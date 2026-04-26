"""
Validator 节点模块。

负责检查行程信息的逻辑一致性，识别时间冲突或事实矛盾。
"""

from agents.state import TravelState
from core.model_factory import get_llm_with_fallback
from langchain_core.prompts import ChatPromptTemplate


# 定义 Validator 的系统提示词
VALIDATOR_PROMPT = """
你是一个严谨的行程校验员。请检查以下搜索到的旅游信息是否存在逻辑矛盾或事实错误。

用户原始需求: {user_input}
搜索结果摘要: 
{research_summary}

请重点检查：
1. **时间冲突**: 例如景点开放时间 vs 行程安排，或周一闭馆但计划周一参观。
2. **地理位置矛盾**: 例如要求在极短时间内跨越距离很远的两个地点。
3. **事实错误**: 明显的常识性错误。

如果发现问题，请简要描述矛盾点；如果没有问题，请返回 "PASS"。
只返回检查结果，不要包含其他寒暄语。
"""


async def validator_node(state: TravelState) -> dict:
    """
    Validator 节点：逻辑校验。

    Args:
        state: 当前的全局状态。

    Returns:
        dict: 更新后的状态片段，包含校验反馈 (validation_feedback)。
    """
    # 1. 整合研究结果，方便 LLM 阅读
    research_summary = "\n".join(state.get("research_results", []))
    
    if not research_summary:
        return {"validation_feedback": "WARN: 没有可供校验的搜索结果"}

    # 2. 获取 LLM 实例
    llm = get_llm_with_fallback()

    # 3. 构建校验链
    prompt = ChatPromptTemplate.from_messages([
        ("system", VALIDATOR_PROMPT),
        ("human", "请开始校验。")
    ])
    
    chain = prompt | llm
    
    # 4. 执行校验
    response = await chain.ainvoke({
        "user_input": state["user_input"],
        "research_summary": research_summary
    })

    feedback = str(response.content).strip()
    print(f"🛡️ Validator 校验结果: {feedback}")

    # 5. 返回反馈信息
    # 如果反馈是 "PASS"，后续节点可以据此决定直接生成行程
    return {"validation_feedback": feedback}
