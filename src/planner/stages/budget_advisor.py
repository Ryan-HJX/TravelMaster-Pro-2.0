"""Stage 8 (optional): Budget Advisor — travel fund planning via Yingmi Finance MCP."""

from __future__ import annotations

import json
import logging
from typing import Any

from src.llm.model_router import router
from src.mcp.tool_registry import get_finance_tools
from src.schemas.plan import TravelIntent

logger = logging.getLogger(__name__)

BUDGET_INSTRUCTIONS = """\
你是一个旅行资金安排顾问。根据用户的旅行预算和出发日期，使用盈米金融数据工具，
为用户提供资金安排建议。

重要合规边界：
- 仅做信息展示与资金安排辅助
- 不构成投资建议
- 不直接做申购/赎回操作
- 不做收益承诺

分析内容：
1. 本次旅行预算占日常资产的合理性评估
2. 建议的现金预留规模（旅行预算 + 应急金）
3. 如果资金在基金中，给出流动性提醒（T+0/T+1/T+N）
4. 假期前赎回时点提醒
5. 低风险现金管理产品分类说明（仅信息展示）

输出 JSON:
{
  "budget_analysis": {
    "total_budget": "预算金额",
    "daily_average": "日均消费",
    "budget_level": "low|medium|high|luxury"
  },
  "cash_reserve": {
    "recommended_amount": "建议预留金额",
    "emergency_buffer": "应急金额",
    "reasoning": "预留理由"
  },
  "liquidity_alerts": [
    {"type": "T+1赎回", "reminder": "出发前3个工作日操作", "deadline": "日期"}
  ],
  "risk_notice": "免责声明：以上信息仅供参考，不构成投资建议。",
  "data_source": "盈米金融数据 MCP"
}
"""


async def advise_budget(
    intent: TravelIntent,
    budget_amount: float | None = None,
    departure_date: str | None = None,
    risk_level: str = "low",
) -> dict[str, Any]:
    """Use Yingmi Finance MCP to generate travel fund planning advice."""
    prompt = (
        f"旅行目的地: {intent.city}\n"
        f"旅行天数: {intent.days}\n"
        f"预算级别: {intent.budget}\n"
        f"具体预算金额: {budget_amount or '未指定'}\n"
        f"出发日期: {departure_date or '未指定'}\n"
        f"可接受风险级别: {risk_level}"
    )

    result = await router.call_main(
        prompt=prompt,
        mcp_tools=get_finance_tools(),
        instructions=BUDGET_INSTRUCTIONS,
    )

    text = result["output_text"].strip()
    try:
        if "```" in text:
            text = text.split("```json")[-1].split("```")[0].strip()
        finance_data = json.loads(text)
    except (json.JSONDecodeError, Exception):
        logger.warning("budget advice parse failed, using minimal response")
        finance_data = {
            "budget_analysis": {"total_budget": str(budget_amount or "未指定"), "budget_level": intent.budget},
            "cash_reserve": {"recommended_amount": "未知", "reasoning": "金融数据暂不可用"},
            "liquidity_alerts": [],
            "risk_notice": "以上信息仅供参考，不构成投资建议。",
            "data_source": "盈米金融数据 MCP",
        }

    logger.info("budget advice generated for %s %d-day trip", intent.city, intent.days)
    return {
        "finance_summary": finance_data,
        "tool_calls": result.get("tool_calls", []),
        "model": result.get("model", ""),
        "latency_ms": result.get("latency_ms", 0),
    }
