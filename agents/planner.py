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
你是一个专业的旅游规划助手。你的任务是根据用户的**当前需求**，拆解出需要搜索的**具体信息点**。

用户需求: {user_input}
用户偏好: {preferences}

**核心指令（最高优先级）**：
1. **地点锁定与隔离**：
   - 必须从用户需求中提取唯一的、最核心的目的地（例如“瑞安”）。
   - **严禁跨地点联想**：所有搜索关键词必须强制包含该目的地名称。如果用户输入的是 A 地，绝对禁止出现 B 地的任何关键词。
2. **拒绝模糊词汇**：不要使用“当地美食”、“著名景点”等宽泛词汇。
3. **强制具体化**：必须包含具体的地标全称、餐厅名称或详细地址。
   - 错误示例：["北京美食", "故宫开放时间"]
   - 正确示例：["瑞安市玉海楼门票及开放时间", "瑞安忠义街历史文化街区必吃小吃", "瑞安外滩公园夜景攻略"]
4. **独立性**：请忽略任何可能存在的历史对话上下文，仅针对当前的 {user_input} 进行拆解。

请分析需求，并返回一个 JSON 格式的列表，包含 3-5 个具体的搜索关键词或问题。
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
    plan_steps = []
    try:
        # 尝试清理模型可能返回的 Markdown 代码块标记 (```json ... ```)
        content = response.content
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]
        
        parsed = json.loads(content)
        if isinstance(parsed, list) and len(parsed) > 0:
            plan_steps = parsed
        else:
            # 如果解析出来不是列表或为空，使用原始内容作为单一步骤
            plan_steps = [str(response.content)]
    except (json.JSONDecodeError, Exception) as e:
        # 如果解析完全失败，将整个回复作为一个搜索关键词
        print(f"⚠️ JSON 解析失败，使用原始回复作为步骤: {e}")
        plan_steps = [state["user_input"]]

    print(f"📋 Planner 拆解出的任务步骤: {plan_steps}")

    return {"plan_steps": plan_steps}
