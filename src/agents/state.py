from typing import Any
from typing_extensions import TypedDict

from src.schemas.plan import (
    EnrichedPOI,
    FallbackPOI,
    MCPToolCall,
    PlanningScore,
    RouteOption,
    SkillTrace,
    StructuredItinerary,
    TravelIntent,
    TransportPlan,
    WeatherDay,
)


class TravelState(TypedDict, total=False):
    # ── Input ────────────────────────────────────────────────────
    user_input: str
    preferences: dict[str, Any]
    travel_constraints: dict[str, Any]
    prompt_version: str
    trace_id: str

    # ── Stage 1: Intent ──────────────────────────────────────────
    intent: TravelIntent

    # ── Stage 2: Geo Grounding ───────────────────────────────────
    geo_grounding: dict[str, Any]

    # ── Stage 3: POI Pool ────────────────────────────────────────
    enriched_pois: list[EnrichedPOI]
    fallback_options: list[FallbackPOI]
    hotels: list[dict[str, Any]]
    meituan_context: str

    # ── Stage 4: Route Optimization ──────────────────────────────
    route_options: list[RouteOption]

    # ── Stage 5: Weather ─────────────────────────────────────────
    weather_forecast: list[WeatherDay]

    # ── Stage 6: Scoring ─────────────────────────────────────────
    planning_score: PlanningScore

    # ── Stage 7: Finance ─────────────────────────────────────────
    finance_summary: dict[str, Any] | None

    # ── Stage 8: Transport Planner (新增) ────────────────────────
    transport_plan: TransportPlan | None

    # ── Stage 9: Render ──────────────────────────────────────────
    plan: StructuredItinerary

    # ── Observability ────────────────────────────────────────────
    skill_traces: list[SkillTrace]
    mcp_tool_calls: list[MCPToolCall]
    model_provider: str
    validation_feedback: str
