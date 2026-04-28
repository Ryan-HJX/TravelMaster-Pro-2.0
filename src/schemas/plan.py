from __future__ import annotations

from datetime import date
from typing import Any

from pydantic import BaseModel, Field


class SkillTrace(BaseModel):
    name: str
    prompt_version: str
    model: str
    latency_ms: int
    token_usage: int | None = None
    degraded: bool = False


class TravelIntent(BaseModel):
    city: str
    days: int = Field(ge=1, le=14)
    budget: str = "medium"
    interests: list[str] = Field(default_factory=list)
    travel_style: str = "balanced"


class WeatherEntry(BaseModel):
    date: date
    weather: str
    temperature: str
    advice: str


class PointOfInterest(BaseModel):
    name: str
    address: str
    location: str
    tags: list[str] = Field(default_factory=list)
    recommended_duration_minutes: int = 90


class RouteSegment(BaseModel):
    from_poi: str
    to_poi: str
    mode: str
    duration_minutes: int


class DayPlanItem(BaseModel):
    sequence_number: int
    item_title: str
    activity_type: str
    address: str
    start_time: str
    end_time: str
    transport: RouteSegment | None = None
    notes: str = ""


class DayPlan(BaseModel):
    day_number: int
    title: str
    items: list[DayPlanItem] = Field(default_factory=list)


class StructuredItinerary(BaseModel):
    trace_id: str
    prompt_version: str
    title: str
    summary: str
    risk_tips: str
    rendered_markdown: str
    weather: list[WeatherEntry] = Field(default_factory=list)
    pois: list[PointOfInterest] = Field(default_factory=list)
    routes: list[RouteSegment] = Field(default_factory=list)
    days: list[DayPlan] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)
    skill_traces: list[SkillTrace] = Field(default_factory=list)


class CompatPlanRequest(BaseModel):
    user_input: str | None = None
    query: str | None = None
    preferences: dict[str, Any] = Field(default_factory=dict)
    user_id: str | None = None
    userId: str | None = None
    travel_constraints: dict[str, Any] = Field(default_factory=dict)
    prompt_version: str = "v1-pro"

    def normalized_input(self) -> str:
        return self.user_input or self.query or ""

    def normalized_user_id(self) -> str:
        return self.user_id or self.userId or str(self.preferences.get("user_id", "guest"))


class WorkerTaskRequest(BaseModel):
    task_id: str
    user_id: str
    trace_id: str
    prompt_version: str
    user_input: str
    preferences: dict[str, Any] = Field(default_factory=dict)
    travel_constraints: dict[str, Any] = Field(default_factory=dict)
