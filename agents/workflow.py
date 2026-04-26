"""
LangGraph 工作流组装模块。

负责将 Planner, Researcher, Validator 和 Generator 节点连接成完整的自动化工作流。
"""

from langgraph.graph import StateGraph, END
from agents.state import TravelState
from agents.planner import planner_node
from agents.researcher import researcher_node
from agents.validator import validator_node
from agents.itinerary_generator import itinerary_generator_node


def should_regenerate(state: TravelState) -> str:
    """
    条件分支函数：根据 Validator 的反馈决定下一步走向。

    Args:
        state: 当前的全局状态。

    Returns:
        str: 下一个节点的名称 ('itinerary_generator' 或 'planner')。
    """
    feedback = state.get("validation_feedback", "")
    
    # 如果校验通过（包含 PASS）或者没有发现明显错误，则进入生成阶段
    if "PASS" in feedback or not feedback:
        return "itinerary_generator"
    else:
        # 如果发现了矛盾，返回 Planner 重新拆解任务或调整方向
        print(f"⚠️ 检测到逻辑矛盾，正在返回 Planner 重新规划...")
        return "planner"


def create_travel_graph():
    """
    创建并编译旅游规划 Agent 的工作流图。

    流程说明:
    1. START -> Planner: 接收用户输入，拆解任务。
    2. Planner -> Researcher: 根据任务列表执行搜索。
    3. Researcher -> Validator: 检查搜索结果的逻辑一致性。
    4. Validator -> [Condition]: 
       - 如果通过 -> Itinerary Generator
       - 如果不通过 -> Planner (重试)
    5. Itinerary Generator -> END: 输出最终行程单。

    Returns:
        CompiledGraph: 编译好的 LangGraph 实例。
    """
    # 1. 初始化状态图
    workflow = StateGraph(TravelState)

    # 2. 添加节点 (Nodes)
    workflow.add_node("planner", planner_node)
    workflow.add_node("researcher", researcher_node)
    workflow.add_node("validator", validator_node)
    workflow.add_node("itinerary_generator", itinerary_generator_node)

    # 3. 设置入口点 (Entry Point)
    workflow.set_entry_point("planner")

    # 4. 添加连线 (Edges)
    # 线性流程：Planner -> Researcher -> Validator
    workflow.add_edge("planner", "researcher")
    workflow.add_edge("researcher", "validator")

    # 条件分支：Validator -> (Generator 或 Planner)
    workflow.add_conditional_edges(
        source="validator",
        path=should_regenerate,
        path_map={
            "itinerary_generator": "itinerary_generator",
            "planner": "planner"
        }
    )

    # 结束流程：Generator -> END
    workflow.add_edge("itinerary_generator", END)

    # 5. 编译工作流
    app = workflow.compile()
    print("🚀 TravelMaster 工作流已编译完成")
    return app
