from __future__ import annotations

import time

from src.schemas.plan import PointOfInterest, SkillTrace, TravelIntent
from src.skills.knowledge_base import CITY_KNOWLEDGE


async def verify_pois(intent: TravelIntent, prompt_version: str) -> tuple[list[PointOfInterest], SkillTrace]:
    started = time.perf_counter()
    raw_pois = CITY_KNOWLEDGE.get(intent.city, CITY_KNOWLEDGE["北京"])
    filtered = [
        PointOfInterest(
            name=str(item["name"]),
            address=str(item["address"]),
            location=str(item["location"]),
            tags=list(item.get("tags", [])),
            recommended_duration_minutes=90 if "food" not in item.get("tags", []) else 60,
        )
        for item in raw_pois
        if not intent.interests or any(tag in intent.interests for tag in item.get("tags", []))
    ]
    pois = filtered if len(filtered) >= intent.days else [
        PointOfInterest(
            name=str(item["name"]),
            address=str(item["address"]),
            location=str(item["location"]),
            tags=list(item.get("tags", [])),
            recommended_duration_minutes=90 if "food" not in item.get("tags", []) else 60,
        )
        for item in raw_pois
    ]
    if len(pois) < 2:
        pois = [
            PointOfInterest(
                name=str(item["name"]),
                address=str(item["address"]),
                location=str(item["location"]),
                tags=list(item.get("tags", [])),
                recommended_duration_minutes=90 if "food" not in item.get("tags", []) else 60,
            )
            for item in raw_pois
        ]
    trace = SkillTrace(
        name="poi_verify",
        prompt_version=prompt_version,
        model="knowledge-base",
        latency_ms=int((time.perf_counter() - started) * 1000),
    )
    return pois[: max(intent.days * 3, 4)], trace
