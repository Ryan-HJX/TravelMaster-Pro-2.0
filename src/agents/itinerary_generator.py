import json
import sys

# 强制设置标准输出为 UTF-8
if sys.platform == "win32":
    if hasattr(sys.stdout, 'reconfigure'):
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except:
            pass

from src.agents.state import TravelState
from src.core.model_factory import get_llm_with_fallback
from langchain_core.prompts import ChatPromptTemplate

# 定义流水线子任务提示词
WEATHER_PROMPT = """
你是一个专业的天气数据分析员。请从以下素材中提取【{target_city}】未来几天的天气信息，并直接输出为一个 Markdown 表格。
### 要求:
1. 包含列：日期, 天气, 气温, 建议。
2. 请根据用户请求的旅行时长，尽可能提供完整的天气信息（如果是5天就提供5天）。
3. 严禁输出任何多余的解释，只输出表格。
4. 如果素材中没有天气信息，请根据你对【{target_city}】当前季节的常识进行模拟补全。
"""

TABLE_PROMPT = """
你是一个顶级的旅游行程规划师。现在你需要根据提供的地点、交通耗时和天气，生成一个结构化的 Markdown 行程表。

### 核心任务:
1. **强制使用表格**：列名固定为 | 时间段 | 景点/活动 | 美食推荐 | 备注/交通/费用 |。
2. **地点颗粒度**：必须使用下面提供的具体地点，每个景点后必须带上 [📍导航](https://ditu.amap.com/search?query=地点全称) 链接。
3. **交通集成**：请在“备注/交通/费用”列中，参考下面的【交通路线建议】，写出景点间的耗时。

### 天气参考:
{weather_table}

### 待规划的地点与交通建议:
{verified_context}

### 用户需求:
{user_input}
"""

CITY_KNOWLEDGE = {
    "内江": ["张大千纪念馆", "西林寺", "大千园", "内江圣水寺", "内江牛肉面"],
    "瑞安": ["玉海楼", "花岩森林公园", "九珠潭", "圣井山", "隆山公园"],
    "温州": ["江心屿", "雁荡山", "五马街", "南塘街", "温州乐园"],
    "北京": ["故宫", "颐和园", "天坛", "南锣鼓巷", "长城"]
}

async def itinerary_generator_node(state: TravelState) -> dict:
    user_input = state.get("user_input", "")
    research_summary = "\n".join(state.get("research_results", []))
    truncated_summary = research_summary[:3000]
    
    llm = get_llm_with_fallback()

    # Step 0: 提取城市 (增强版提示词)
    city_prompt = ChatPromptTemplate.from_template("请只返回用户提到的目标城市名，不要包含'市'或'县'等后缀，不要标点符号。如果没提到，返回'未知'。用户输入：{user_input}")
    city_resp = await (city_prompt | llm).ainvoke({"user_input": user_input})
    target_city = str(city_resp.content).strip().replace("市", "").replace("县", "").replace("“", "").replace("”", "")
    
    if target_city == "未知":
        target_city = "北京" # 默认兜底
    
    print(f"🔍 识别到目标城市: {target_city}")

    # Step 1: 真实天气
    from src.tools.weather_tool import get_weather_amap
    weather_table = await get_weather_amap(target_city)

    # Step 2: POI 挖掘与校验
    extract_prompt = ChatPromptTemplate.from_template("从素材中提取具体的景点名，每行一个：\n{summary}")
    extract_resp = await (extract_prompt | llm).ainvoke({"summary": truncated_summary})
    raw_pois = str(extract_resp.content).split("\n")
    candidate_pois = [p.strip().lstrip("#- *").strip() for p in raw_pois if 2 <= len(p.strip()) <= 15]
    
    if len(candidate_pois) < 2 and target_city in CITY_KNOWLEDGE:
        candidate_pois.extend(CITY_KNOWLEDGE[target_city])

    from src.agents.amap_tool import verify_poi_amap
    from src.tools.direction_tool import get_direction_amap
    verified_poi_info = []
    waypoints = []
    for poi_name in list(set(candidate_pois))[:6]:
        # 增加前缀以提高搜索精确度
        search_keyword = f"{target_city} {poi_name}"
        poi_data = await verify_poi_amap(search_keyword, city=target_city)
        if poi_data:
            print(f"  ✅ 校验通过: {poi_data['name']}")
            verified_poi_info.append(f"- {poi_data['name']} (地址: {poi_data['address']})")
            waypoints.append(poi_data)
        else:
            print(f"  ❌ 校验失败: {poi_name}")
    
    # 计算路径规划
    transport_context = ""
    if len(waypoints) >= 2:
        transport_tips = []
        for i in range(len(waypoints) - 1):
            p1, p2 = waypoints[i], waypoints[i+1]
            direction = await get_direction_amap(p1["location"], p2["location"])
            if direction:
                transport_tips.append(f"从【{p1['name']}】到【{p2['name']}】：距离约 {direction['distance']}km，打车约 {direction['duration']} 分钟。")
        transport_context = "\n".join(transport_tips)

    verified_context = "\n".join(verified_poi_info) + "\n\n### 交通建议:\n" + transport_context

    # Step 3: 生成最终结果
    table_chain = ChatPromptTemplate.from_template(TABLE_PROMPT) | llm
    table_resp = await table_chain.ainvoke({
        "weather_table": weather_table,
        "verified_context": verified_context,
        "user_input": user_input
    })
    
    final_itinerary = f"# {target_city} 深度旅游行程单\n\n### 🌤️ 官方实时天气预报 (高德提供)\n{weather_table}\n\n### 📅 详细行程安排\n{table_resp.content}"
    
    return {"final_itinerary": final_itinerary, "waypoints": waypoints}
