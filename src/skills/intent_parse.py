from __future__ import annotations

import re
import time

from src.schemas.plan import SkillTrace, TravelIntent
from src.skills.knowledge_base import CITY_KNOWLEDGE


def parse_intent(user_input: str, prompt_version: str) -> tuple[TravelIntent, SkillTrace]:
    started = time.perf_counter()
    city = next((candidate for candidate in CITY_KNOWLEDGE if candidate in user_input), "北京")

    day_match = re.search(r"(\d+)\s*[天日]", user_input)
    days = int(day_match.group(1)) if day_match else 3
    days = max(1, min(days, 7))

    budget = "medium"
    if any(keyword in user_input for keyword in ["省钱", "穷游", "预算低"]):
        budget = "low"
    elif any(keyword in user_input for keyword in ["高端", "豪华", "预算高"]):
        budget = "high"

    interest_rules = {
        "culture": ["文化", "历史", "博物馆", "古建"],
        "food": ["美食", "小吃", "餐厅", "咖啡"],
        "nature": ["自然", "公园", "湿地", "户外", "山"],
        "family": ["亲子", "带娃", "家庭"],
        "citywalk": ["citywalk", "逛街", "散步", "拍照"],
        "nightlife": ["夜景", "酒吧", "livehouse"],
    }
    interests = [
        interest
        for interest, keywords in interest_rules.items()
        if any(keyword.lower() in user_input.lower() for keyword in keywords)
    ]
    if not interests:
        interests = ["culture", "food", "citywalk"]

    style = "balanced"
    if "轻松" in user_input:
        style = "relaxed"
    elif "特种兵" in user_input:
        style = "dense"

    trace = SkillTrace(
        name="intent_parse",
        prompt_version=prompt_version,
        model="heuristic-fallback",
        latency_ms=int((time.perf_counter() - started) * 1000),
        degraded=False,
    )
    return TravelIntent(city=city, days=days, budget=budget, interests=interests, travel_style=style), trace
