from typing import Any
from typing_extensions import TypedDict

from src.schemas.plan import DayPlan, PointOfInterest, RouteSegment, SkillTrace, StructuredItinerary, TravelIntent, WeatherEntry


class TravelState(TypedDict, total=False):
    user_input: str
    preferences: dict[str, Any]
    travel_constraints: dict[str, Any]
    prompt_version: str
    trace_id: str
    intent: TravelIntent
    templates: list[str]
    social_notes: list[str]
    weather: list[WeatherEntry]
    pois: list[PointOfInterest]
    routes: list[RouteSegment]
    plan: StructuredItinerary
    skill_traces: list[SkillTrace]
    validation_feedback: str
