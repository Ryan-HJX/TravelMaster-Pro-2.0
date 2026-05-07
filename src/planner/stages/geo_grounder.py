"""Stage 2: Geo Grounding — real geographic context from Amap MCP."""

from __future__ import annotations

import logging
from typing import Any

from src.core.utils import parse_json_safe
from src.llm.model_router import router
from src.mcp.tool_registry import get_planning_tools
from src.schemas.plan import TravelIntent

logger = logging.getLogger(__name__)

GEO_INSTRUCTIONS = """\
你是一个地理信息专家。根据用户的旅行目的地，使用高德地图工具完成以下任务：

**必须使用的高德工具**：
1. 地理编码（geocode）— 获取城市中心坐标
2. 行政区划查询（district_search）— 获取城市核心区域信息
3. 周边搜索（around_search）— 发现热门商圈、夜市、美食街
4. POI 搜索（keyword_search）— 搜索标志性景点确认城市位置

要求：
1. 对目的地城市做地理编码，获取城市中心坐标
2. 如果用户指定了出发点/结束点（如酒店、机场、火车站），也做地理编码
3. 识别城市的核心旅游区域
4. 发现城市的特色区域：热门商圈、美食街、夜市、文化街区
5. 标注城市的主要交通枢纽（机场、火车站）

最终输出 JSON 格式：
{
  "city_name": "城市名",
  "city_center": {"lng": 116.39, "lat": 39.90},
  "start_point": {"name": "...", "lng": ..., "lat": ...} 或 null,
  "end_point": {"name": "...", "lng": ..., "lat": ...} 或 null,
  "core_areas": ["区域1", "区域2"],
  "featured_areas": [{"name": "南锣鼓巷", "type": "文化街区", "description": "..."}],
  "food_streets": [{"name": "簋街", "specialty": "小龙虾"}],
  "transport_hubs": [{"name": "首都国际机场", "type": "airport"}],
  "city_adcode": "城市行政区划代码"
}
"""


async def ground_geography(intent: TravelIntent) -> dict[str, Any]:
    """Use Amap MCP to ground the travel destination geographically."""
    prompt = (
        f"目的地: {intent.city}\n"
        f"出发点: {intent.start_point or '未指定'}\n"
        f"结束点: {intent.end_point or '未指定'}"
    )

    result = await router.call_main(
        prompt=prompt,
        mcp_tools=get_planning_tools(),
        instructions=GEO_INSTRUCTIONS,
    )

    text = result["output_text"].strip()
    geo_data = parse_json_safe(text, {})
    if not geo_data:
        logger.warning("geo grounding parse failed, using defaults")
        geo_data = {
            "city_name": intent.city,
            "city_center": {"lng": 0, "lat": 0},
            "start_point": None,
            "end_point": None,
            "core_areas": [],
            "city_adcode": "",
        }

    logger.info("geo grounding: city=%s areas=%s", geo_data.get("city_name"), geo_data.get("core_areas"))
    return {
        "geo_data": geo_data,
        "tool_calls": result.get("tool_calls", []),
        "model": result.get("model", ""),
        "latency_ms": result.get("latency_ms", 0),
    }
