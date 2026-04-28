from __future__ import annotations

import time

from src.schemas.plan import SkillTrace, TravelIntent
from src.skills.knowledge_base import DEFAULT_TEMPLATE_LIBRARY


def recall_templates(intent: TravelIntent, prompt_version: str) -> tuple[list[str], SkillTrace]:
    started = time.perf_counter()
    templates: list[str] = []
    for interest in intent.interests:
        templates.extend(DEFAULT_TEMPLATE_LIBRARY.get(interest, []))
    if intent.travel_style == "dense":
        templates.append("单日景点密度高，但午后保留机动时间")
    elif intent.travel_style == "relaxed":
        templates.append("每天只安排 2-3 个核心活动，保留自由活动窗口")
    trace = SkillTrace(
        name="template_recall",
        prompt_version=prompt_version,
        model="local-template-library",
        latency_ms=int((time.perf_counter() - started) * 1000),
    )
    return list(dict.fromkeys(templates))[:6], trace
