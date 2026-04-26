"""
Itinerary Generator 节点模块。

负责将 Planner、Researcher 和 Validator 产生的信息整合成结构化的 Markdown 行程单。
"""

from agents.state import TravelState
from core.model_factory import get_llm_with_fallback
from langchain_core.prompts import ChatPromptTemplate


# 定义生成器的系统提示词
GENERATOR_PROMPT = """
你是一个专业的旅游行程规划师。请根据以下信息，为用户生成一份结构清晰、逻辑连贯的 Markdown 格式行程单。

用户原始需求: {user_input}
校验反馈: {validation_feedback}
收集到的研究素材: 
{research_summary}

**输出要求**:
1. **结构化表格**: 必须包含一个 Markdown 表格，列名为：| 时间段 | 景点/活动 | 美食推荐 | 备注/交通建议 |。
2. **逻辑性**: 确保行程安排符合地理位置和时间逻辑，并参考校验反馈中的建议。
3. **简洁专业**: 直接输出 Markdown 内容，不要包含“好的，这是您的行程”等寒暄语。
4. **个性化**: 在备注栏中适当体现用户的偏好（如预算、兴趣点等）。

请直接开始生成行程单内容。
"""


async def itinerary_generator_node(state: TravelState) -> dict:
    """
    Itinerary Generator 节点：生成最终行程。

    逻辑流程:
    1. 从 State 中提取所有必要的上下文信息。
    2. 构建 Prompt，将碎片化的搜索结果转化为自然语言指令。
    3. 调用 LLM 生成最终的 Markdown 行程单。
    4. 将结果存入 State 的 final_itinerary 字段。

    Args:
        state: 当前的全局状态。

    Returns:
        dict: 更新后的状态片段，包含最终生成的行程单字符串。
    """
    # 1. 提取并整合上下文
    research_summary = "\n".join(state.get("research_results", []))
    validation_feedback = state.get("validation_feedback", "无特殊校验反馈")
    
    if not research_summary:
        return {"final_itinerary": "❌ 错误：由于缺乏搜索数据，无法生成行程单。"}

    # 2. 获取 LLM 实例
    llm = get_llm_with_fallback()

    # 3. 构建生成链
    prompt = ChatPromptTemplate.from_messages([
        ("system", GENERATOR_PROMPT),
        ("human", "请根据上述素材生成行程单。")
    ])
    
    chain = prompt | llm
    
    # 4. 异步执行生成
    print(f"📝 Itinerary Generator 正在撰写行程单...")
    response = await chain.ainvoke({
        "user_input": state["user_input"],
        "validation_feedback": validation_feedback,
        "research_summary": research_summary
    })

    final_itinerary = str(response.content).strip()
    print(f"✅ 行程单生成完毕")

    # 5. 返回更新后的状态
    return {"final_itinerary": final_itinerary}
