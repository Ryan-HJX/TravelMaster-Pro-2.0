"""
Researcher 节点模块。

负责执行 Planner 拆解出的搜索任务，并整合搜索结果。
"""

from src.agents.state import TravelState
from src.tools.search_tool import run_search


async def researcher_node(state: TravelState) -> dict:
    """
    Researcher 节点：执行信息检索。

    逻辑流程:
    1. 获取 Planner 生成的任务步骤列表 (plan_steps)。
    2. 遍历每个步骤，调用搜索工具获取信息。
    3. 将收集到的结果汇总并存入 State 的 research_results 字段。

    Args:
        state: 当前的全局状态。

    Returns:
        dict: 更新后的状态片段，包含搜索到的结果列表。
    """
    plan_steps = state.get("plan_steps", [])
    research_results = []

    if not plan_steps:
        print("⚠️ Planner 未生成任何搜索任务，跳过 Researcher 节点")
        return {"research_results": []}

    print(f"🔍 Researcher 开始执行 {len(plan_steps)} 个搜索任务...")

    import re
    from src.tools.scraper_tool import scrape_url

    for i, step in enumerate(plan_steps):
        try:
            print(f"  [{i+1}/{len(plan_steps)}] 正在搜索: {step}")
            result = run_search(step)
            
            # 确保 result 是字符串，防止 re.findall 报错
            if not isinstance(result, str):
                result = str(result)

            # 1. 尝试提取搜索结果中的 URL (DuckDuckGo 的结果格式通常包含 link: URL)
            urls = re.findall(r'link: (https?://[^\],]+)', result)
            
            # 2. 对前 10 个关键链接进行深度抓取
            if urls:
                print(f"    🔎 发现 {len(urls)} 个链接，准备对前 10 个进行深度内容抓取...")
                for url in urls[:10]:
                    # 排除一些不需要抓取的域名
                    if any(domain in url for domain in ["google.com", "bing.com", "baidu.com"]):
                        continue
                    
                    print(f"    📖 正在深度阅读: {url}")
                    scraped_content = await scrape_url(url)
                    if scraped_content:
                        result += f"\n--- 来自网页 {url} 的深度详情 ---\n{scraped_content}\n"

            # 3. 如果结果还是太短，或者包含明显的错误，尝试进行更宽泛的城市概况搜索
            if len(result) < 500 or "搜索结果为空" in result:
                # 提取地名（第一个词通常是地名）
                city_name = step.split()[0] if step.split() else ""
                refined_query = f"{city_name} 旅游全攻略 必去景点 必吃餐厅 推荐 2026"
                print(f"  [深度补充] 搜索信息不足，尝试宽泛搜索: {refined_query}")
                refined_result = run_search(refined_query)
                result += f"\n--- 深度补充搜索结果 ---\n{refined_result}"
            
            research_results.append(f"任务: {step}\n结果: {result}\n---")
        except Exception as e:
            error_msg = f"任务: {step}\n错误: 搜索过程中发生异常 - {str(e)}\n---"
            research_results.append(error_msg)
            print(f"  ❌ 搜索任务 '{step}' 失败: {e}")

    print(f"✅ Researcher 完成，已通过深度抓取获取了大量信息。")
    return {"research_results": research_results}
