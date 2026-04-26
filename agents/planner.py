"""
Planner 节点模块。

负责将用户的模糊旅游需求拆解为具体的搜索任务列表。
"""

from agents.state import TravelState
from core.model_factory import get_llm_with_fallback
from langchain_core.prompts import ChatPromptTemplate
import json


# 定义 Planner 的系统提示词
PLANNER_PROMPT = """
你是一个专业的旅游规划助手。你的任务是根据用户的需求，拆解出需要搜索的具体信息点。

用户需求: {user_input}
用户偏好: {preferences}

请分析需求，并返回一个 JSON 格式的列表，包含 3-5 个需要搜索的关键词或问题。
例如：["北京故宫开放时间", "北京必吃烤鸭餐厅推荐", "北京地铁线路图"]

只返回 JSON 列表，不要包含其他文字。
"""


async def planner_node(state: TravelState) -> dict:
    """
    Planner 节点：拆解用户任务。

    Args:
        state: 当前的全局状态。

    Returns:
        dict: 更新后的状态片段，包含拆解后的 plan_steps。
    """
    # 1. 获取 LLM 实例
    llm = get_llm_with_fallback()

    # 2. 构建提示词
    prompt = ChatPromptTemplate.from_messages([
        ("system", PLANNER_PROMPT),
        ("human", "{user_input}")
    ])

    # 3. 调用模型进行拆解
    # 注意：这里为了演示简单，暂时从 state 中获取 preferences（后续会结合 DB）
    chain = prompt | llm
    response = await chain.ainvoke({
        "user_input": state["user_input"],
        "preferences": "暂无特定偏好" 
    })

    # 4. 解析结果
    try:
        # 尝试解析模型返回的 JSON 字符串
        plan_steps = json.loads(response.content)
        if not isinstance(plan_steps, list):
            plan_steps = [str(response.content)]
    except json.JSONDecodeError:
        # 如果解析失败，将整个回复作为一个步骤
        plan_steps = [str(response.content)]

    print(f"📋 Planner 拆解出的任务步骤: {plan_steps}")

    return {"plan_steps": plan_steps}
