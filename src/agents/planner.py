"""
Planner 节点模块。

负责将用户的模糊旅游需求拆解为具体的搜索任务列表。
"""

from src.agents.state import TravelState
from src.core.model_factory import get_llm_with_fallback
from langchain_core.prompts import ChatPromptTemplate
import json


# 定义 Planner 的系统提示词
PLANNER_PROMPT = """
你是一个顶级的旅游规划搜索专家。你的任务是生成能直接在搜索引擎中调取“深度攻略”的关键词。

### 搜索任务生成铁律:
1. **天气**: "{{城市}} 未来3-5天天气预报 气温 降水 穿衣建议"
2. **景点（深度攻略感）**: "{{城市}} 旅游攻略 2026 必去景点清单 马蜂窝 携程 推荐"
3. **美食（地道感）**: "{{城市}} 当地人推荐的美食 必吃榜 老字号 餐厅"
4. **地标校验**: "{{城市}} 著名地标 历史文化建筑 列表"

### 要求:
- 必须包含具体的城市名。
- 搜索词要像人类搜索攻略一样（例如增加“攻略”、“推荐”、“清单”）。
- 直接输出 JSON 字符串列表。
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
    chain = prompt | llm
    response = await chain.ainvoke({
        "user_input": state["user_input"]
    })

    # 4. 解析结果
    plan_steps = []
    try:
        content = response.content
        if not isinstance(content, str):
            content = str(content)
        
        # 尝试清理模型可能返回的 Markdown 代码块标记 (```json ... ```)
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]
        
        parsed = json.loads(content.strip())
        if isinstance(parsed, list) and len(parsed) > 0:
            # 确保列表中的每一项都是字符串
            plan_steps = [str(step) for step in parsed if step]
        else:
            plan_steps = [state["user_input"]]
    except (json.JSONDecodeError, Exception) as e:
        print(f"⚠️ JSON 解析失败，使用原始输入作为兜底: {e}")
        plan_steps = [state["user_input"]]

    print(f"📋 Planner 拆解出的任务步骤: {plan_steps}")

    return {"plan_steps": plan_steps}
