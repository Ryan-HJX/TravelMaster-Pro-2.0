"""
Researcher 节点模块。

负责执行 Planner 拆解出的搜索任务，并整合搜索结果。
"""

from agents.state import TravelState
from tools.search_tool import run_search


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

    for i, step in enumerate(plan_steps):
        try:
            print(f"  [{i+1}/{len(plan_steps)}] 正在搜索: {step}")
            # 调用我们之前封装的统一搜索接口
            result = run_search(step)
            research_results.append(f"任务: {step}\n结果: {result}\n---")
        except Exception as e:
            error_msg = f"任务: {step}\n错误: 搜索过程中发生异常 - {str(e)}\n---"
            research_results.append(error_msg)
            print(f"  ❌ 搜索任务 '{step}' 失败: {e}")

    print(f"✅ Researcher 完成，共收集 {len(research_results)} 条信息")
    
    # 返回更新后的研究结果列表
    # LangGraph 会自动将这些新结果合并到全局 State 中
    return {"research_results": research_results}
