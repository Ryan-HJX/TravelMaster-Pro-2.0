"""Itinerary quality evaluator — automated assessment of generated plans."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any

logger = logging.getLogger(__name__)


@dataclass
class EvalResult:
    """Evaluation result for a single itinerary."""
    score: float = 0.0  # 0-100
    level: str = "unknown"
    details: dict[str, Any] = field(default_factory=dict)
    warnings: list[str] = field(default_factory=list)


def evaluate_itinerary(structured_content: dict[str, Any]) -> EvalResult:
    """Evaluate itinerary quality across multiple dimensions.

    Dimensions:
    1. POI coverage  (are there real POIs with coords?)
    2. Transport feasibility  (reasonable transport times?)
    3. Weather adaptation  (is weather data present?)
    4. Daily balance  (even distribution of activities?)
    5. MCP grounding  (how many POIs are MCP-sourced?)
    """
    result = EvalResult()
    scores: dict[str, float] = {}
    days = structured_content.get("days", [])
    enriched_pois = structured_content.get("enriched_pois", [])
    route_options = structured_content.get("route_options", [])
    weather_forecast = structured_content.get("weather_forecast", [])
    planning_score = structured_content.get("planning_score", {})

    # 1. POI Coverage (0-20)
    poi_count = len(enriched_pois)
    pois_with_coords = len([p for p in enriched_pois if p.get("longitude", 0) != 0])
    if poi_count == 0:
        scores["poi_coverage"] = 0
        result.warnings.append("无 POI 数据")
    else:
        coord_ratio = pois_with_coords / poi_count
        scores["poi_coverage"] = min(20, coord_ratio * 20)
        if coord_ratio < 0.5:
            result.warnings.append(f"仅 {coord_ratio:.0%} POI 有坐标")

    # 2. Transport Feasibility (0-20)
    if route_options:
        avg_transport = sum(r.get("recommended_duration_minutes", 0) for r in route_options) / max(len(route_options), 1)
        if avg_transport < 60:
            scores["transport"] = 20
        elif avg_transport < 120:
            scores["transport"] = 15
        else:
            scores["transport"] = 8
            result.warnings.append(f"平均交通时间 {avg_transport:.0f} 分钟偏长")
    else:
        scores["transport"] = 5
        result.warnings.append("无路线规划数据")

    # 3. Weather Adaptation (0-20)
    day_count = len(days)
    if weather_forecast and len(weather_forecast) >= day_count:
        scores["weather"] = 20
    elif weather_forecast:
        scores["weather"] = 12
        result.warnings.append("天气数据不完整")
    else:
        scores["weather"] = 5
        result.warnings.append("无天气数据")

    # 4. Daily Balance (0-20)
    if days:
        items_per_day = [len(d.get("items", [])) for d in days]
        avg_items = sum(items_per_day) / len(items_per_day)
        variance = sum((x - avg_items) ** 2 for x in items_per_day) / len(items_per_day)
        if variance < 2:
            scores["balance"] = 20
        elif variance < 5:
            scores["balance"] = 14
        else:
            scores["balance"] = 8
            result.warnings.append("每日行程分布不均")
    else:
        scores["balance"] = 0
        result.warnings.append("无每日行程数据")

    # 5. MCP Grounding (0-20)
    mcp_sourced = len([p for p in enriched_pois if p.get("source") == "amap_mcp"])
    if poi_count > 0:
        mcp_ratio = mcp_sourced / poi_count
        scores["mcp_grounding"] = min(20, mcp_ratio * 20)
        if mcp_ratio < 0.5:
            result.warnings.append(f"仅 {mcp_ratio:.0%} POI 来自高德 MCP")
    else:
        scores["mcp_grounding"] = 0

    # Aggregate
    total = sum(scores.values())
    result.score = round(total, 1)
    result.details = scores

    if total >= 80:
        result.level = "excellent"
    elif total >= 60:
        result.level = "good"
    elif total >= 40:
        result.level = "fair"
    else:
        result.level = "poor"

    logger.info("itinerary eval: score=%.1f level=%s warnings=%d", result.score, result.level, len(result.warnings))
    return result
