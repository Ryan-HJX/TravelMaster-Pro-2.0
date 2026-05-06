from __future__ import annotations

from datetime import date
from typing import Any

from pydantic import BaseModel, Field, field_validator


# ── Trace / Observability ────────────────────────────────────────

class SkillTrace(BaseModel):
    name: str
    prompt_version: str
    model: str
    latency_ms: int
    token_usage: int | None = None
    degraded: bool = False


class MCPToolCall(BaseModel):
    """Record of a single MCP tool invocation."""
    stage: str
    tool_type: str
    tool_name: str = ""
    server_label: str = ""
    arguments: str = ""
    output_preview: str = ""
    latency_ms: int = 0


# ── Intent ───────────────────────────────────────────────────────

class TravelIntent(BaseModel):
    city: str
    start_point: str = ""
    end_point: str = ""
    days: int = Field(ge=1, le=14)
    budget: str = "medium"
    interests: list[str] = Field(default_factory=list)
    travel_style: str = "balanced"
    crowd_type: str = "adult"
    transport_preference: str = "public"
    # 新增：出发地和具体日期
    departure_city: str = ""  # 出发城市
    start_date: str = ""      # 开始日期 YYYY-MM-DD
    end_date: str = ""        # 结束日期 YYYY-MM-DD


# ── Weather ──────────────────────────────────────────────────────

class WeatherEntry(BaseModel):
    date: date
    weather: str
    temperature: str
    advice: str


class WeatherDay(BaseModel):
    day_number: int
    date: str
    weather: str
    temperature_high: str = ""
    temperature_low: str = ""
    advice: str = ""
    is_outdoor_friendly: bool = True


# ── POI ──────────────────────────────────────────────────────────

class PointOfInterest(BaseModel):
    name: str
    address: str
    location: str
    tags: list[str] = Field(default_factory=list)
    recommended_duration_minutes: int = 90


class EnrichedPOI(BaseModel):
    """POI enriched with real geographic data from Amap MCP."""
    name: str
    address: str
    longitude: float = 0.0
    latitude: float = 0.0
    category: str = ""
    tags: list[str] = Field(default_factory=list)
    recommended_duration_minutes: int = 90
    open_hours: str = ""
    poi_type: str = "attraction"  # attraction | restaurant | rest | backup
    source: str = "amap_mcp"
    distance_from_center_km: float = 0.0


class FallbackPOI(BaseModel):
    """Backup POI for rain/closure scenarios."""
    name: str
    address: str
    longitude: float = 0.0
    latitude: float = 0.0
    category: str = ""
    reason: str = ""  # e.g. "indoor alternative for rain"


# ── Route ────────────────────────────────────────────────────────

class RouteSegment(BaseModel):
    from_poi: str
    to_poi: str
    mode: str
    duration_minutes: int


class RouteOption(BaseModel):
    """Multi-modal route comparison from Amap MCP."""
    from_poi: str
    to_poi: str
    options: list[RouteSegment] = Field(default_factory=list)
    recommended_mode: str = ""
    recommended_duration_minutes: int = 0


# ── Inter-city Transportation (新增：大交通) ─────────────────────

class InterCityTransport(BaseModel):
    """城际大交通方案（飞机/火车/长途汽车）"""
    mode: str = "flight"  # flight|train|bus|self_drive
    departure_city: str = ""
    arrival_city: str = ""
    departure_time: str = ""  # YYYY-MM-DD HH:mm
    arrival_time: str = ""    # YYYY-MM-DD HH:mm
    duration_hours: float = 0.0
    price_estimate: int = 0   # 预估价格(元)
    carrier: str = ""         # 航空公司/铁路局
    flight_number: str = ""   # 航班号/车次
    booking_tips: str = ""    # 预订建议


class TransportPlan(BaseModel):
    """完整的大交通方案（往返）"""
    outbound: InterCityTransport | None = None  # 去程
    return_trip: InterCityTransport | None = None  # 返程
    total_cost: int = 0  # 往返总费用
    recommendations: list[str] = Field(default_factory=list)  # 推荐建议


# ── Day Plan ─────────────────────────────────────────────────────

class DayPlanItem(BaseModel):
    sequence_number: int
    item_title: str
    activity_type: str
    address: str
    longitude: float = 0.0
    latitude: float = 0.0
    start_time: str
    end_time: str
    transport: RouteSegment | None = None
    notes: str = ""


class DayPlan(BaseModel):
    day_number: int
    title: str
    weather: WeatherDay | None = None
    items: list[DayPlanItem] = Field(default_factory=list)


# ── Planning Score ───────────────────────────────────────────────

class PlanningScore(BaseModel):
    level: str = "normal"  # relaxed | normal | tight | infeasible
    daily_poi_avg: float = 0.0
    total_transport_minutes: int = 0
    total_walking_km: float = 0.0
    reasoning: str = ""


# ── Structured Itinerary (final output) ─────────────────────────

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

    # ── 2.0 enhancements ─────────────────────────────────────────
    enriched_pois: list[EnrichedPOI] = Field(default_factory=list)
    fallback_options: list[FallbackPOI] = Field(default_factory=list)
    route_options: list[RouteOption] = Field(default_factory=list)
    weather_forecast: list[WeatherDay] = Field(default_factory=list)
    planning_score: PlanningScore = Field(default_factory=PlanningScore)
    model_provider: str = ""
    model_name: str = ""
    mcp_tool_calls: list[MCPToolCall] = Field(default_factory=list)
    finance_summary: dict[str, Any] | None = None
    transport_plan: TransportPlan | None = None  # 新增：大交通方案

    @field_validator("risk_tips", mode="before")
    @classmethod
    def normalize_risk_tips(cls, v: Any) -> str:
        if isinstance(v, list):
            return " ".join([str(item) for item in v])
        return str(v) if v is not None else ""


# ── API Request Models ───────────────────────────────────────────

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
