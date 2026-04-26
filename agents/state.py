"""
LangGraph 状态定义模块。

使用 TypedDict 定义 Graph 的全局状态，确保数据在节点间传递时的类型安全。
"""

from typing import Annotated, List, Optional
from typing_extensions import TypedDict
from langgraph.graph.message import add_messages


class TravelState(TypedDict):
    """
    旅游规划 Agent 的全局状态。

    属性:
        messages (Annotated[List, add_messages]): 存储用户与 Agent 的对话历史。
                                                  使用 add_messages 注解可以自动处理消息追加逻辑。
        user_input (str): 用户当前的原始输入请求。
        plan_steps (List[str]): 由 Planner 节点拆解出的任务步骤列表。
        research_results (List[str]): 由 Researcher 节点收集到的搜索信息或数据库查询结果。
        validation_feedback (Optional[str]): Validator 节点返回的逻辑检查反馈（如时间冲突警告）。
        final_itinerary (Optional[str]): 最终生成的 Markdown 格式行程单。
        waypoints (Optional[List[dict]]): 验证过的途经点坐标列表，供前端地图渲染。
        user_id (Optional[str]): 当前交互用户的唯一标识，用于记忆管理。
    """
    messages: Annotated[list, add_messages]
    user_input: str
    plan_steps: List[str]
    research_results: List[str]
    validation_feedback: Optional[str]
    final_itinerary: Optional[str]
    waypoints: Optional[List[dict]]
    user_id: Optional[str]
