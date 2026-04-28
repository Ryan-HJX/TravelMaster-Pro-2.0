from __future__ import annotations

import time

from src.schemas.plan import PointOfInterest, RouteSegment, SkillTrace


async def plan_routes(pois: list[PointOfInterest], prompt_version: str) -> tuple[list[RouteSegment], SkillTrace]:
    started = time.perf_counter()
    routes: list[RouteSegment] = []
    for index in range(len(pois) - 1):
        routes.append(
            RouteSegment(
                from_poi=pois[index].name,
                to_poi=pois[index + 1].name,
                mode="taxi" if index % 2 == 0 else "metro",
                duration_minutes=25 + (index * 8),
            )
        )
    trace = SkillTrace(
        name="route_plan",
        prompt_version=prompt_version,
        model="estimated-routing",
        latency_ms=int((time.perf_counter() - started) * 1000),
        degraded=True,
    )
    return routes, trace
