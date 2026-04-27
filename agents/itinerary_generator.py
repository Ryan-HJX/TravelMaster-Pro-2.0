"""
Itinerary Generator 节点模块。

负责将 Planner、Researcher 和 Validator 产生的信息整合成结构化的 Markdown 行程单。
"""

from agents.state import TravelState
from core.model_factory import get_llm_with_fallback
from langchain_core.prompts import ChatPromptTemplate


# 定义流水线子任务提示词
# 子任务 1：天气看板提取
WEATHER_PROMPT = """
你是一个专业的天气数据分析员。请从以下素材中提取【{target_city}】未来3天的天气信息，并直接输出为一个 Markdown 表格。

### 要求:
1. 包含列：日期, 天气, 气温, 建议。
2. 严禁输出任何多余的解释，只输出表格。
3. 如果素材中没有天气信息，请根据你对【{target_city}】当前季节的常识进行模拟补全。

### 素材内容:
{truncated_summary}
"""

# 子任务 2：结构化行程生成
TABLE_PROMPT = """
你是一个顶级的旅游行程规划师。现在你需要根据提供的地点和天气，生成一个结构化的 Markdown 行程表。

### 核心任务:
1. **强制使用表格**：列名固定为 | 时间段 | 景点/活动 | 美食推荐 | 备注/费用 |。
2. **地点颗粒度**：必须使用下面提供的具体地点，每个景点后必须带上 [📍导航](https://ditu.amap.com/search?query=地点全称) 链接。
3. **严禁废话**：直接从表格开始输出。

### 天气参考:
{weather_table}

### 待规划的真实地点:
{verified_context}

### 用户需求:
{user_input}
"""


async def itinerary_generator_node(state: TravelState) -> dict:
    """
    Itinerary Generator 节点：采用流水线方式分段生成。
    """
    user_input = state.get("user_input", "")
    research_summary = "\n".join(state.get("research_results", []))
    truncated_summary = research_summary[:3000]
    
    # 深度检查素材是否包含实质性内容
    is_empty_results = "搜索结果为空" in research_summary and len(research_summary.replace("搜索结果为空", "").strip()) < 50
    if not research_summary.strip() or is_empty_results:
        return {"final_itinerary": "【系统提示】搜索未能获取到有效实时信息，请检查网络或搜索更热门的城市。", "waypoints": []}

    llm = get_llm_with_fallback()

    # Step 0: 提取目标城市
    city_prompt = ChatPromptTemplate.from_messages([
        ("system", "提取城市名，只返回名称"),
        ("human", "{user_input}")
    ])
    city_resp = await (city_prompt | llm).ainvoke({"user_input": user_input})
    target_city = str(city_resp.content).strip()

    # Step 1: 提取 POI 并清洗 (复用之前的逻辑)
    # ... (为了保持代码整洁，这里直接进行 POI 处理)
    print(f"🏙️ 目标城市: {target_city}")
    
    # --- POI 提取与过滤 ---
    extract_prompt = ChatPromptTemplate.from_messages([("human", "请从素材中提取具体的景点名，每行一个：\n{summary}")])
    extract_resp = await (extract_prompt | llm).ainvoke({"summary": truncated_summary})
    raw_pois = str(extract_resp.content).split("\n")
    candidate_pois = [p.strip().lstrip("#- *").strip() for p in raw_pois if 2 <= len(p.strip()) <= 15]
    
    # --- POI 校验 ---
    from agents.amap_tool import verify_poi_amap
    verified_poi_info = []
    waypoints = []
    for poi_name in candidate_pois[:5]: # 限制数量提高速度
        poi_data = await verify_poi_amap(f"{target_city} {poi_name}", city=target_city)
        if poi_data:
            verified_poi_info.append(f"- {poi_data['name']} (地址: {poi_data['address']})")
            waypoints.append(poi_data)
    
    verified_context = "\n".join(verified_poi_info) if verified_poi_info else "【待核实地点清单】: " + ", ".join(candidate_pois[:5])

    # --- 流水线生成过程 ---
    print("🌤️ 子任务 1: 正在生成天气看板...")
    weather_chain = ChatPromptTemplate.from_template(WEATHER_PROMPT) | llm
    weather_resp = await weather_chain.ainvoke({"target_city": target_city, "truncated_summary": truncated_summary})
    weather_table = str(weather_resp.content).strip()

    print("📅 子任务 2: 正在生成行程表格...")
    table_chain = ChatPromptTemplate.from_template(TABLE_PROMPT) | llm
    table_resp = await table_chain.ainvoke({
        "weather_table": weather_table,
        "verified_context": verified_context,
        "user_input": user_input
    })
    itinerary_table = str(table_resp.content).strip()

    # 最后合并结果
    final_itinerary = f"# {target_city} 深度旅游行程单\n\n### 🌤️ 未来 3 天天气预报\n{weather_table}\n\n### 📅 详细行程安排\n{itinerary_table}"
    
    print(f"✅ 流水线生成完毕。")
    return {
        "final_itinerary": final_itinerary,
        "waypoints": waypoints
    }
