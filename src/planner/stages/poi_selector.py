"""Stage 3: POI Selector — build candidate POI pool from Amap MCP."""

from __future__ import annotations

import logging
from typing import Any

from src.core.utils import parse_json_safe
from src.llm.model_router import router
from src.mcp.tool_registry import get_planning_tools
from src.schemas.plan import EnrichedPOI, FallbackPOI, TravelIntent

logger = logging.getLogger(__name__)

POI_INSTRUCTIONS = """\
你是一个旅游 POI 专家。根据用户的旅行意图和城市地理信息，使用高德地图 POI 搜索和周边搜索工具，构建一个分层候选景点池。

要求：
1. 按主题分层：必去景点(must_see)、餐饮点(restaurant)、休息点(rest)、备选点(backup)
2. 每个景点必须包含：名称、地址、经纬度、类别、建议停留时长
3. 餐饮点要和景点混排（每天至少安排午餐和晚餐）
4. 备选点用于天气不好时替代户外景点（选择室内场所）
5. 每天建议 3-5 个景点 + 2-3 个餐饮点

输出 JSON:
{
  "must_see": [{"name":"...", "address":"...", "longitude":..., "latitude":..., "category":"...", "recommended_duration_minutes":..., "open_hours":"..."}],
  "restaurants": [...],
  "rest_points": [...],
  "backups": [{"name":"...", "address":"...", "longitude":..., "latitude":..., "category":"...", "reason":"室内替代"}]
}
"""


async def select_pois(
    intent: TravelIntent,
    geo_data: dict[str, Any],
) -> tuple[list[EnrichedPOI], list[FallbackPOI], dict[str, Any]]:
    """Use Amap MCP to search and categorize POIs."""
    prompt = (
        f"城市: {intent.city}\n"
        f"天数: {intent.days}\n"
        f"兴趣: {', '.join(intent.interests) or '综合'}\n"
        f"预算: {intent.budget}\n"
        f"出行方式: {intent.transport_preference}\n"
        f"人群: {intent.crowd_type}\n"
        f"核心区域: {geo_data.get('core_areas', [])}\n"
        f"城市中心: {geo_data.get('city_center', {})}"
    )

    result = await router.call_main(
        prompt=prompt,
        mcp_tools=get_planning_tools(),
        instructions=POI_INSTRUCTIONS,
    )

    text = result["output_text"].strip()
    enriched_pois: list[EnrichedPOI] = []
    fallback_pois: list[FallbackPOI] = []

    data = parse_json_safe(text, {})
    if data:
        for poi_type, poi_list in [
            ("attraction", data.get("must_see", [])),
            ("restaurant", data.get("restaurants", [])),
            ("rest", data.get("rest_points", [])),
        ]:
            for p in poi_list:
                enriched_pois.append(EnrichedPOI(
                    name=p.get("name", ""),
                    address=p.get("address", ""),
                    longitude=float(p.get("longitude", 0)),
                    latitude=float(p.get("latitude", 0)),
                    category=p.get("category", ""),
                    recommended_duration_minutes=int(p.get("recommended_duration_minutes", 90)),
                    open_hours=p.get("open_hours", ""),
                    poi_type=poi_type,
                    source="amap_mcp",
                ))

        for b in data.get("backups", []):
            fallback_pois.append(FallbackPOI(
                name=b.get("name", ""),
                address=b.get("address", ""),
                longitude=float(b.get("longitude", 0)),
                latitude=float(b.get("latitude", 0)),
                category=b.get("category", ""),
                reason=b.get("reason", ""),
            ))
    else:
        logger.warning("poi selection parse failed")

    logger.info("selected %d POIs + %d fallbacks", len(enriched_pois), len(fallback_pois))
    return enriched_pois, fallback_pois, {
        "tool_calls": result.get("tool_calls", []),
        "model": result.get("model", ""),
        "latency_ms": result.get("latency_ms", 0),
    }
