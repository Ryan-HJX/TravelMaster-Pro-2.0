"""Stage 6: Scoring — feasibility assessment of the planned itinerary."""

from __future__ import annotations

import logging

from src.schemas.plan import EnrichedPOI, PlanningScore, RouteOption, TravelIntent

logger = logging.getLogger(__name__)


def compute_planning_score(
    intent: TravelIntent,
    enriched_pois: list[EnrichedPOI],
    route_options: list[RouteOption],
) -> PlanningScore:
    """Compute a feasibility score for the itinerary."""
    attraction_count = len([p for p in enriched_pois if p.poi_type == "attraction"])
    daily_poi_avg = attraction_count / max(intent.days, 1)
    total_transport = sum(ro.recommended_duration_minutes for ro in route_options)
    daily_transport = total_transport / max(intent.days, 1)
    walking_minutes = sum(
        ro.recommended_duration_minutes for ro in route_options if ro.recommended_mode == "walking"
    )
    total_walking_km = round(walking_minutes / 60 * 5, 1)

    if daily_poi_avg > 7 or daily_transport > 180:
        level, reasoning = "infeasible", f"日均{daily_poi_avg:.1f}景点，日均交通{daily_transport:.0f}分钟，不可执行"
    elif daily_poi_avg > 5 or daily_transport > 120:
        level, reasoning = "tight", f"日均{daily_poi_avg:.1f}景点，日均交通{daily_transport:.0f}分钟，较紧凑"
    elif daily_poi_avg > 3 or daily_transport > 60:
        level, reasoning = "normal", f"日均{daily_poi_avg:.1f}景点，日均交通{daily_transport:.0f}分钟，节奏适中"
    else:
        level, reasoning = "relaxed", f"日均{daily_poi_avg:.1f}景点，日均交通{daily_transport:.0f}分钟，轻松"

    score = PlanningScore(
        level=level, daily_poi_avg=round(daily_poi_avg, 1),
        total_transport_minutes=total_transport, total_walking_km=total_walking_km, reasoning=reasoning,
    )
    logger.info("planning score: %s", score.level)
    return score
