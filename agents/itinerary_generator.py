"""
Itinerary Generator 节点模块。

负责将 Planner、Researcher 和 Validator 产生的信息整合成结构化的 Markdown 行程单。
"""

from agents.state import TravelState
from core.model_factory import get_llm_with_fallback
from langchain_core.prompts import ChatPromptTemplate


# 定义生成器的系统提示词
GENERATOR_PROMPT = """
你是一个专业的旅游行程规划师。请根据以下信息，为用户生成一份结构清晰、逻辑连贯的 Markdown 格式行程单。

用户原始需求: {user_input}
校验反馈: {validation_feedback}
收集到的研究素材: 
{research_summary}

**输出要求 (严格执行)**:
1. **事实核查与信息补充**：
   - 尽量核对 {research_summary} 中的信息。
   - **如果搜索素材不足**：不要轻易放弃规划！你可以基于你的常识和大众点评/携程的常见高分地点提供合理的推荐，但必须在推荐项后用括号标明“*（基于经验推荐，可能需自行核实营业状态）*”。
   - **严禁张冠李戴**：确保推荐的景点和餐馆确实位于用户要求的城市。

2. **结构化表格与双重定位（重要）**：
   - 必须包含一个 Markdown 表格，列名为：| 时间段 | 景点/活动 | 美食推荐 | 备注/交通建议 |。
   - **导航链接位置（红线）**：不要使用独立的“定位信息”列。请直接在“景点/活动”或“美食推荐”单元格内，在具体的景点名称后面紧跟：**[📍导航](https://ditu.amap.com/search?query=地点全称)**。
   - **严禁定位区域**：如果只是一个泛指的区域（如“延安市区”、“周边”），**绝对禁止**为其添加导航链接。导航链接仅能用于具体的、经过验证的 POI（如“延安革命纪念馆”）。
   - **地点全称**：请用该地点的官方全称（见下方列表）替换“地点全称”。

3. **极度具体化与排他性（红线）**：
   - **严禁生造**：只能使用下方提供的【真实存在的验证地点】。
   - **禁止免责声明**：**绝对禁止**添加任何形如“由于系统限制”等免责声明。

4. **简洁专业**: 直接输出 Markdown 内容，不含寒暄语。
5. **语言要求**: 必须使用中文生成。

请直接开始生成行程单内容。
"""


async def itinerary_generator_node(state: TravelState) -> dict:
    """
    Itinerary Generator 节点：生成最终行程。

    逻辑流程:
    1. 从 State 中提取所有必要的上下文信息。
    2. 构建 Prompt，将碎片化的搜索结果转化为自然语言指令。
    3. 调用 LLM 生成最终的 Markdown 行程单。
    4. 将结果存入 State 的 final_itinerary 字段。

    Args:
        state: 当前的全局状态。

    Returns:
        dict: 更新后的状态片段，包含最终生成的行程单字符串。
    """
    # 1. 提取并整合上下文
    research_summary = "\n".join(state.get("research_results", []))
    validation_feedback = state.get("validation_feedback", "无特殊校验反馈")
    
    if not research_summary or len(research_summary.strip()) < 10:
        print("⚠️ 搜索素材严重不足，拒绝胡编乱造")
        research_summary = "【错误】由于搜索引擎未返回有效结果，目前无法获取温州当地的实时景点和餐厅信息。请不要胡编乱造任何地点，直接向用户说明情况，并建议用户提供更具体的关键词或稍后再试。"

    llm = get_llm_with_fallback()

    # Step 0: 提取目标城市，提高高德搜索准确度
    city_prompt = ChatPromptTemplate.from_messages([
        ("system", "请从用户需求中提取出最核心的目标城市名称。只返回城市名，不要任何标点。如果没有，返回空。"),
        ("human", "{user_input}")
    ])
    city_chain = city_prompt | llm
    city_resp = await city_chain.ainvoke({"user_input": state["user_input"]})
    target_city = str(city_resp.content).strip()
    print(f"🏙️ 检测到目标城市: {target_city}")

    # Step 1: 提取待规划的兴趣点 (POI)
    print("📍 正在从素材中挖掘具体地点...")
    extraction_prompt = ChatPromptTemplate.from_messages([
        ("system", "你是一个旅游达人。请从搜索素材中挖掘出所有值得推荐的具体景点名称、餐厅名称或店铺全称。**禁止提取区域性描述**（如‘延安市区’、‘西安周边’、‘钟山石窟周边’），只保留具体的、可以精确定位的 POI 名称。只返回地点名称列表，每行一个。"),
        ("human", "需求: {user_input}\n素材: {research_summary}")
    ])
    
    extract_chain = extraction_prompt | llm
    extract_resp = await extract_chain.ainvoke({
        "user_input": state["user_input"],
        "research_summary": research_summary
    })
    
    candidate_pois = [line.strip().strip("-* ") for line in str(extract_resp.content).split("\n") if line.strip()]
    print(f"提取到的候选地点: {candidate_pois}")
    
    # Step 2: 调用高德 API 验证真实性
    from agents.amap_tool import verify_poi_amap
    verified_poi_info = []
    waypoints = []
    
    for poi_name in candidate_pois:
        # 核心修复：搜索时强制带上城市名，防止搜到全国范围的同名地点（如“人民公园”）
        search_keyword = f"{target_city} {poi_name}"
        print(f"正在校验: {search_keyword} (城市: {target_city}) ...")
        poi_data = await verify_poi_amap(search_keyword, city=target_city)
        if poi_data:
            print(f"  ✅ 校验通过: {poi_data['name']} ({poi_data['location']})")
            verified_poi_info.append(f"- 官方全称: {poi_data['name']}\n  详细地址: {poi_data['address']}")
            waypoints.append(poi_data)
        else:
            print(f"  ❌ 查无此地，已过滤: {poi_name}")
            
    verified_context = "\n".join(verified_poi_info) if verified_poi_info else "未获取到任何经过高德地图验证的真实地点。"

    # Step 3: 基于校验后的真实数据生成最终行程单
    final_prompt = ChatPromptTemplate.from_messages([
        ("system", GENERATOR_PROMPT + "\n\n【排版要求】请将‘一键导航’链接紧跟在‘定位信息’列的文字地址后面，不要单独放在备注里或文末。"),
        ("system", "【必须使用的真实地点列表】:\n{verified_context}"),
        ("human", "请根据素材和真实验证地点生成行程单。")
    ])
    
    chain = final_prompt | llm
    
    print(f"📝 Itinerary Generator 正在撰写行程单...")
    response = await chain.ainvoke({
        "user_input": state["user_input"],
        "validation_feedback": validation_feedback,
        "research_summary": research_summary,
        "verified_context": verified_context
    })

    final_itinerary = str(response.content).strip()
    print(f"✅ 行程单生成完毕，共包含 {len(waypoints)} 个有效途径点。")

    # 返回更新后的状态
    return {
        "final_itinerary": final_itinerary,
        "waypoints": waypoints
    }
