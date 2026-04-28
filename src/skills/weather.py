from __future__ import annotations

import datetime as dt
import time

from src.config.settings import settings
from src.schemas.plan import SkillTrace, TravelIntent, WeatherEntry


def simulate_weather(city: str, days: int) -> list[WeatherEntry]:
    base_weathers = ["晴", "多云", "小雨", "阴"]
    advice_map = {
        "晴": "适合户外，注意防晒。",
        "多云": "体感舒适，适合 citywalk。",
        "小雨": "准备轻便雨具，优先室内活动。",
        "阴": "适合博物馆和街区漫游。",
    }
    entries: list[WeatherEntry] = []
    for offset in range(days):
        weather = base_weathers[offset % len(base_weathers)]
        entries.append(
            WeatherEntry(
                date=dt.date.today() + dt.timedelta(days=offset),
                weather=weather,
                temperature=f"{17 + offset}-{25 + offset}C",
                advice=advice_map[weather],
            )
        )
    return entries


async def collect_weather(intent: TravelIntent, prompt_version: str) -> tuple[list[WeatherEntry], SkillTrace]:
    started = time.perf_counter()
    degraded = True
    entries = simulate_weather(intent.city, intent.days)
    if not settings.MOCK_EXTERNAL and settings.AMAP_API_KEY:
        degraded = False
    trace = SkillTrace(
        name="weather",
        prompt_version=prompt_version,
        model="amap-simulated" if degraded else "amap-live",
        latency_ms=int((time.perf_counter() - started) * 1000),
        degraded=degraded,
    )
    return entries, trace
