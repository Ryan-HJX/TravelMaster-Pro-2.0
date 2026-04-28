from __future__ import annotations

import math
import time
from uuid import uuid4

from src.schemas.plan import DayPlan, DayPlanItem, PointOfInterest, RouteSegment, SkillTrace, StructuredItinerary, TravelIntent, WeatherEntry


def render_itinerary(intent: TravelIntent,
                     prompt_version: str,
                     templates: list[str],
                     social_notes: list[str],
                     weather: list[WeatherEntry],
                     pois: list[PointOfInterest],
                     routes: list[RouteSegment],
                     traces: list[SkillTrace],
                     trace_id: str | None = None) -> tuple[StructuredItinerary, SkillTrace]:
    started = time.perf_counter()
    trace_id = trace_id or uuid4().hex
    items_per_day = max(2, math.ceil(len(pois) / intent.days))
    day_plans: list[DayPlan] = []
    route_index = 0

    for day in range(intent.days):
        selected = pois[day * items_per_day: (day + 1) * items_per_day]
        if not selected:
            break
        plan_items: list[DayPlanItem] = []
        current_hour = 9
        for sequence, poi in enumerate(selected, start=1):
            end_hour = min(current_hour + 2, 21)
            transport = None
            if sequence > 1 and route_index < len(routes):
                transport = routes[route_index]
                route_index += 1
            plan_items.append(
                DayPlanItem(
                    sequence_number=sequence,
                    item_title=poi.name,
                    activity_type="food" if "food" in poi.tags else "sightseeing",
                    address=poi.address,
                    start_time=f"{current_hour:02d}:00",
                    end_time=f"{end_hour:02d}:00",
                    transport=transport,
                    notes="；".join([f"标签: {', '.join(poi.tags)}"] + social_notes[:1]),
                )
            )
            current_hour = end_hour + 1
        day_plans.append(DayPlan(day_number=day + 1, title=f"Day {day + 1} - {intent.city}", items=plan_items))

    markdown_lines = [f"# {intent.city}{intent.days}日行程", "", "## 天气"]
    for item in weather:
        markdown_lines.append(f"- {item.date}: {item.weather} {item.temperature} | {item.advice}")
    markdown_lines.extend(["", "## 行程安排"])
    for day in day_plans:
        markdown_lines.append(f"### {day.title}")
        for item in day.items:
            transport_line = ""
            if item.transport:
                transport_line = f" | 交通: {item.transport.mode} {item.transport.duration_minutes} 分钟"
            markdown_lines.append(
                f"- {item.start_time}-{item.end_time} {item.item_title} ({item.address}){transport_line}"
            )
    markdown_lines.extend(["", "## 规划说明"])
    markdown_lines.extend([f"- {template}" for template in templates[:4]])

    plan = StructuredItinerary(
        trace_id=trace_id,
        prompt_version=prompt_version,
        title=f"{intent.city}{intent.days}日{intent.travel_style}旅行方案",
        summary=f"围绕 {intent.city} 的 {intent.days} 日行程，覆盖 {', '.join(intent.interests[:3])} 等主题。",
        risk_tips="遇到降雨时优先切换为室内博物馆/餐饮节点，并保留 20% 机动时间。",
        rendered_markdown="\n".join(markdown_lines),
        weather=weather,
        pois=pois,
        routes=routes,
        days=day_plans,
        metadata={
            "budget": intent.budget,
            "interests": intent.interests,
            "travel_style": intent.travel_style,
            "template_count": len(templates),
            "social_notes": social_notes,
        },
        skill_traces=traces,
    )
    trace = SkillTrace(
        name="itinerary_render",
        prompt_version=prompt_version,
        model="structured-renderer",
        latency_ms=int((time.perf_counter() - started) * 1000),
    )
    return plan, trace
