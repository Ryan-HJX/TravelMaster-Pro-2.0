"""Stage 4: Route Optimizer — multi-modal routing from Amap MCP."""

from __future__ import annotations

import logging
from typing import Any

from src.config.settings import settings
from src.core.utils import parse_json_safe
from src.llm.model_router import router
from src.mcp.tool_registry import get_planning_tools
from src.schemas.plan import EnrichedPOI, RouteOption, RouteSegment, TravelIntent

logger = logging.getLogger(__name__)

ROUTE_INSTRUCTIONS = """\
你是一个路线优化专家。根据每天的 POI 列表，使用高德地图路径规划工具，完成以下任务：

1. 对同一天的景点做顺路排序（减少绕路）
2. 相邻景点之间做多交通方式（驾车/公交/步行）估时比选
3. 选出推荐交通方式（时间最优或最经济）
4. 生成替代路线

输出 JSON:
{
  "route_options": [
    {
      "from_poi": "景点A",
      "to_poi": "景点B",
      "options": [
        {"from_poi":"A", "to_poi":"B", "mode":"driving", "duration_minutes": 20},
        {"from_poi":"A", "to_poi":"B", "mode":"transit", "duration_minutes": 35},
        {"from_poi":"A", "to_poi":"B", "mode":"walking", "duration_minutes": 60}
      ],
      "recommended_mode": "transit",
      "recommended_duration_minutes": 35
    }
  ],
  "optimized_order": ["景点名1", "景点名2", ...]
}
"""


async def optimize_routes(
    intent: TravelIntent,
    enriched_pois: list[EnrichedPOI],
) -> tuple[list[RouteOption], dict[str, Any]]:
    """Use Amap MCP for multi-modal route planning between POIs."""
    poi_summary = "\n".join(
        f"- {p.name} ({p.longitude},{p.latitude}) [{p.poi_type}]"
        for p in enriched_pois[:settings.MAX_POI_PER_REQUEST]
    )

    prompt = (
        f"城市: {intent.city}\n"
        f"交通偏好: {intent.transport_preference}\n"
        f"天数: {intent.days}\n"
        f"景点列表:\n{poi_summary}"
    )

    result = await router.call_main(
        prompt=prompt,
        mcp_tools=get_planning_tools(),
        instructions=ROUTE_INSTRUCTIONS,
    )

    text = result["output_text"].strip()
    route_options: list[RouteOption] = []

    data = parse_json_safe(text, {})
    if data:
        for ro in data.get("route_options", []):
            options = [
                RouteSegment(
                    from_poi=opt.get("from_poi", ""),
                    to_poi=opt.get("to_poi", ""),
                    mode=opt.get("mode", ""),
                    duration_minutes=int(opt.get("duration_minutes", 0)),
                )
                for opt in ro.get("options", [])
            ]
            route_options.append(RouteOption(
                from_poi=ro.get("from_poi", ""),
                to_poi=ro.get("to_poi", ""),
                options=options,
                recommended_mode=ro.get("recommended_mode", ""),
                recommended_duration_minutes=int(ro.get("recommended_duration_minutes", 0)),
            ))
    else:
        logger.warning("route optimization parse failed")

    logger.info("generated %d route options", len(route_options))
    return route_options, {
        "tool_calls": result.get("tool_calls", []),
        "model": result.get("model", ""),
        "latency_ms": result.get("latency_ms", 0),
    }
