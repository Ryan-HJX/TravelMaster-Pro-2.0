"""Stage 3: POI Selector — build candidate POI pool from Amap MCP + Meituan CLI."""

from __future__ import annotations

import asyncio
import logging
from typing import Any

from src.core.utils import parse_json_safe
from src.integrations.meituan_client import meituan_client
from src.llm.model_router import router
from src.mcp.tool_registry import get_planning_tools
from src.schemas.plan import EnrichedPOI, FallbackPOI, TravelIntent

logger = logging.getLogger(__name__)

POI_INSTRUCTIONS = """\
你是一个旅游 POI 专家。根据用户的旅行意图和城市地理信息，使用高德地图工具构建一个分层候选景点池。

**必须使用的高德工具**：
1. POI 搜索（keyword_search）— 搜索景点、餐厅、酒店
2. 周边搜索（around_search）— 以城市中心为圆点搜索周边设施
3. POI 详情（poi_detail）— 对 top 景点获取评分、评价数、营业时间
4. 地理编码（geocode）— 确认地址坐标

要求：
1. 按主题分层：必去景点(must_see)、餐饮点(restaurant)、休息点(rest)、备选点(backup)、酒店(hotels)
2. 每个景点必须包含：名称、地址、经纬度、类别、建议停留时长、预估价格、亮点、小贴士、评分(rating)
3. 餐饮点要和景点混排（每天至少安排午餐和晚餐）
4. 备选点用于天气不好时替代户外景点（选择室内场所）
5. 每天建议 3-5 个景点 + 2-3 个餐饮点
6. 酒店推荐：根据预算推荐 2-3 家酒店，包含预估价格和位置优势

每个 POI 的丰富信息要求：
- estimated_price: 景点写门票价格（如"60元"或"免费"），餐厅写人均消费（如"人均80元"）
- highlights: 景点写必看项目（如"必看：太和殿、御花园"），餐厅写推荐菜品（如"推荐：宫保鸡丁、北京烤鸭"）
- tips: 实用小贴士（如"建议早上去人少"、"周一闭馆"、"需要提前预约"）
- rating: 高德评分（如 4.5），从 POI 详情获取

输出 JSON:
{
  "must_see": [{"name":"...", "address":"...", "longitude":..., "latitude":..., "category":"...", "recommended_duration_minutes":..., "open_hours":"...", "estimated_price":"...", "highlights":"...", "tips":"...", "rating":4.5}],
  "restaurants": [{"name":"...", "address":"...", "longitude":..., "latitude":..., "category":"...", "estimated_price":"人均...", "highlights":"推荐：...", "tips":"...", "rating":4.3}],
  "rest_points": [...],
  "backups": [{"name":"...", "address":"...", "longitude":..., "latitude":..., "category":"...", "reason":"室内替代"}],
  "hotels": [{"name":"...", "address":"...", "estimated_price":"...元/晚", "star_rating":"经济型/舒适型/豪华型", "highlights":"...", "booking_tip":"...", "rating":4.2}]
}
"""


async def select_pois(
    intent: TravelIntent,
    geo_data: dict[str, Any],
) -> tuple[list[EnrichedPOI], list[FallbackPOI], dict[str, Any]]:
    """Use Amap MCP to search and categorize POIs, enriched with Meituan CLI data."""
    # Run Amap LLM call and Meituan CLI queries in parallel
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

    amap_task = router.call_main(
        prompt=prompt,
        mcp_tools=get_planning_tools(),
        instructions=POI_INSTRUCTIONS,
    )

    # Fire Meituan CLI queries in parallel (don't block on them)
    meituan_restaurant_task = meituan_client.search_restaurants(intent.city)
    meituan_hotel_task = meituan_client.search_hotels(intent.city)

    amap_result, meituan_restaurant_text, meituan_hotel_text = await asyncio.gather(
        amap_task, meituan_restaurant_task, meituan_hotel_task,
        return_exceptions=True,
    )

    # Handle Meituan results (may be None or exceptions)
    meituan_context = ""
    if isinstance(meituan_restaurant_text, str) and meituan_restaurant_text:
        meituan_context += f"\n\n【美团餐厅真实数据】\n{meituan_restaurant_text}"
    if isinstance(meituan_hotel_text, str) and meituan_hotel_text:
        meituan_context += f"\n\n【美团酒店真实数据】\n{meituan_hotel_text}"

    if meituan_context:
        logger.info("Meituan data fetched, %d chars of context", len(meituan_context))
    else:
        logger.debug("No Meituan data available")

    text = amap_result["output_text"].strip()
    enriched_pois: list[EnrichedPOI] = []
    fallback_pois: list[FallbackPOI] = []

    data = parse_json_safe(text, {})
    hotels: list[dict] = []
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
                    estimated_price=p.get("estimated_price", ""),
                    highlights=p.get("highlights", ""),
                    tips=p.get("tips", ""),
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

        hotels = data.get("hotels", [])
    else:
        logger.warning("poi selection parse failed")

    logger.info("selected %d POIs + %d fallbacks + %d hotels", len(enriched_pois), len(fallback_pois), len(hotels))

    return enriched_pois, fallback_pois, {
        "tool_calls": amap_result.get("tool_calls", []),
        "model": amap_result.get("model", ""),
        "latency_ms": amap_result.get("latency_ms", 0),
        "hotels": hotels,
        "meituan_context": meituan_context,
    }
