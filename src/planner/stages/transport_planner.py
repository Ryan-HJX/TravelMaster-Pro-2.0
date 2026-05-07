"""
Stage 8: Inter-city Transport Planner (新增：大交通规划)
根据出发地和目的地，通过 LLM 推断往返大交通方案（飞机/火车）
"""
from __future__ import annotations

import json
import logging
from typing import Any

from src.llm.model_router import router
from src.schemas.plan import TravelIntent, TransportPlan, InterCityTransport
from src.core.utils import parse_json_safe

logger = logging.getLogger(__name__)

TRANSPORT_INSTRUCTIONS = """\
你是一个交通规划专家。根据出发地、目的地、日期和预算，推荐最合适的城际交通方案。

规则：
1. 根据城市间距离和交通条件，推荐飞机或高铁
2. 经济型预算优先推荐高铁，豪华型优先推荐飞机
3. 提供具体的车次/航班号（可以是常见的）
4. 价格要合理（参考实际市场价格）
5. 提供实用的预订建议

输出 JSON:
{
  "outbound": {
    "mode": "flight 或 train",
    "departure_city": "出发城市",
    "arrival_city": "到达城市",
    "departure_time": "YYYY-MM-DD HH:mm",
    "arrival_time": "YYYY-MM-DD HH:mm",
    "duration_hours": 2.5,
    "price_estimate": 800,
    "carrier": "航空公司或铁路局",
    "flight_number": "航班号或车次",
    "booking_tips": "预订建议"
  },
  "return_trip": {
    "mode": "flight 或 train",
    "departure_city": "出发城市",
    "arrival_city": "到达城市",
    "departure_time": "YYYY-MM-DD HH:mm",
    "arrival_time": "YYYY-MM-DD HH:mm",
    "duration_hours": 2.5,
    "price_estimate": 800,
    "carrier": "航空公司或铁路局",
    "flight_number": "航班号或车次",
    "booking_tips": "预订建议"
  },
  "total_cost": 1600,
  "recommendations": ["建议1", "建议2"]
}

如果出发地和目的地相同或没有出发地，返回：
{"outbound": null, "return_trip": null, "total_cost": 0, "recommendations": []}
"""


async def plan_intercity_transport(
    intent: TravelIntent,
) -> TransportPlan:
    """
    规划城际大交通方案（通过 LLM 推断）

    Args:
        intent: 旅行意图，包含 departure_city, city(目的地), start_date, end_date

    Returns:
        TransportPlan: 包含往返交通方案
    """
    if not intent.departure_city or intent.departure_city == intent.city:
        return TransportPlan()

    logger.info("大交通规划: 从 %s 到 %s", intent.departure_city, intent.city)

    prompt = (
        f"出发地: {intent.departure_city}\n"
        f"目的地: {intent.city}\n"
        f"出发日期: {intent.start_date or '未定'}\n"
        f"返回日期: {intent.end_date or '未定'}\n"
        f"预算级别: {intent.budget}\n"
        f"旅行天数: {intent.days}"
    )

    try:
        result = await router.call_flash(prompt=prompt, instructions=TRANSPORT_INSTRUCTIONS)
        text = result["output_text"].strip()

        data = parse_json_safe(text, {})
        if not data:
            logger.warning("transport plan parse failed, returning empty")
            return TransportPlan()

        outbound = _parse_transport(data.get("outbound"))
        return_trip = _parse_transport(data.get("return_trip"))
        total_cost = data.get("total_cost", 0)
        if not total_cost and outbound and return_trip:
            total_cost = (outbound.price_estimate or 0) + (return_trip.price_estimate or 0)

        return TransportPlan(
            outbound=outbound,
            return_trip=return_trip,
            total_cost=total_cost,
            recommendations=data.get("recommendations", []),
        )
    except Exception as exc:
        logger.error("transport plan failed: %s", exc)
        return TransportPlan()


def _parse_transport(data: dict[str, Any] | None) -> InterCityTransport | None:
    """Parse a single transport direction from LLM output."""
    if not data or not data.get("mode"):
        return None

    return InterCityTransport(
        mode=data.get("mode", "train"),
        departure_city=data.get("departure_city", ""),
        arrival_city=data.get("arrival_city", ""),
        departure_time=data.get("departure_time", ""),
        arrival_time=data.get("arrival_time", ""),
        duration_hours=float(data.get("duration_hours", 0)),
        price_estimate=int(data.get("price_estimate", 0)),
        carrier=data.get("carrier", ""),
        flight_number=data.get("flight_number", ""),
        booking_tips=data.get("booking_tips", ""),
    )
