"""Stage 5: Weather Adjuster — weather-aware itinerary adaptation via Amap MCP."""

from __future__ import annotations

import logging
from typing import Any

from src.core.utils import parse_json_safe
from src.llm.model_router import router
from src.mcp.tool_registry import get_planning_tools
from src.schemas.plan import EnrichedPOI, FallbackPOI, TravelIntent, WeatherDay

logger = logging.getLogger(__name__)

WEATHER_INSTRUCTIONS = """\
你是一个天气-行程适配专家。使用高德地图的天气查询工具获取目的地未来天气预报，
然后根据天气状况调整行程建议。

规则：
1. 晴天优先户外景点
2. 雨天切换到室内景点（从备选列表中选择）
3. 极端天气（暴雨/暴雪/高温>38°C）自动降低当日景点密度
4. 为每天生成天气建议

输出 JSON:
{
  "weather_forecast": [
    {
      "day_number": 1,
      "date": "2025-05-01",
      "weather": "晴",
      "temperature_high": "28°C",
      "temperature_low": "18°C",
      "advice": "适合户外活动",
      "is_outdoor_friendly": true
    }
  ],
  "adjustments": [
    {"day_number": 2, "action": "swap", "remove_poi": "xxx", "add_poi": "yyy", "reason": "雨天切换室内"}
  ]
}
"""


async def adjust_for_weather(
    intent: TravelIntent,
    enriched_pois: list[EnrichedPOI],
    fallback_options: list[FallbackPOI],
) -> tuple[list[WeatherDay], dict[str, Any]]:
    """Use Amap MCP weather to get forecast and adjust itinerary."""
    fallback_summary = "\n".join(
        f"- {f.name} ({f.category}) — {f.reason}" for f in fallback_options[:10]
    )

    prompt = (
        f"城市: {intent.city}\n"
        f"天数: {intent.days}\n"
        f"当前景点数: {len(enriched_pois)}\n"
        f"备选室内景点:\n{fallback_summary or '无'}"
    )

    result = await router.call_main(
        prompt=prompt,
        mcp_tools=get_planning_tools(),
        instructions=WEATHER_INSTRUCTIONS,
    )

    text = result["output_text"].strip()
    weather_days: list[WeatherDay] = []

    data = parse_json_safe(text, {})
    if data:
        for w in data.get("weather_forecast", []):
            weather_days.append(WeatherDay(
                day_number=int(w.get("day_number", 1)),
                date=w.get("date", ""),
                weather=w.get("weather", "未知"),
                temperature_high=w.get("temperature_high", ""),
                temperature_low=w.get("temperature_low", ""),
                advice=w.get("advice", ""),
                is_outdoor_friendly=w.get("is_outdoor_friendly", True),
            ))
    else:
        logger.warning("weather adjustment parse failed, using placeholders")
        for d in range(1, intent.days + 1):
            weather_days.append(WeatherDay(
                day_number=d,
                date="",
                weather="未知",
                advice="天气数据暂不可用",
                is_outdoor_friendly=True,
            ))

    logger.info("weather forecast: %d days", len(weather_days))
    return weather_days, {
        "tool_calls": result.get("tool_calls", []),
        "model": result.get("model", ""),
        "latency_ms": result.get("latency_ms", 0),
    }
