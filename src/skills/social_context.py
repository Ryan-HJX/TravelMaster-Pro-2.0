from __future__ import annotations

import time

from src.schemas.plan import SkillTrace, TravelIntent


def build_social_context(intent: TravelIntent, prompt_version: str, preferences: dict) -> tuple[list[str], SkillTrace]:
    started = time.perf_counter()
    notes = [
        f"优先选择适合 {intent.travel_style} 节奏的路线。",
        "保留可发布到社交平台的拍照/复盘节点。",
    ]
    if preferences.get("creator_style"):
        notes.append(f"对齐创作者风格: {preferences['creator_style']}")
    if preferences.get("preference_tags"):
        notes.append("结合用户偏好标签做顺序微调。")
    trace = SkillTrace(
        name="social_context",
        prompt_version=prompt_version,
        model="rules",
        latency_ms=int((time.perf_counter() - started) * 1000),
    )
    return notes, trace
