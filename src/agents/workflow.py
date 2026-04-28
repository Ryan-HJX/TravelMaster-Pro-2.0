from __future__ import annotations

import asyncio
from uuid import uuid4

from langgraph.graph import END, StateGraph

from src.agents.state import TravelState
from src.schemas.plan import StructuredItinerary
from src.skills.intent_parse import parse_intent
from src.skills.itinerary_render import render_itinerary
from src.skills.poi_verify import verify_pois
from src.skills.route_plan import plan_routes
from src.skills.social_context import build_social_context
from src.skills.template_recall import recall_templates
from src.skills.weather import collect_weather


async def intent_node(state: TravelState) -> TravelState:
    intent, trace = parse_intent(state["user_input"], state["prompt_version"])
    return {"intent": intent, "skill_traces": [trace], "trace_id": state.get("trace_id", uuid4().hex)}


async def enrichment_node(state: TravelState) -> TravelState:
    intent = state["intent"]
    prompt_version = state["prompt_version"]
    templates_result, weather_result, pois_result = await asyncio.gather(
        asyncio.to_thread(recall_templates, intent, prompt_version),
        collect_weather(intent, prompt_version),
        verify_pois(intent, prompt_version),
    )
    social_notes, social_trace = build_social_context(intent, prompt_version, state.get("preferences", {}))
    templates, template_trace = templates_result
    weather, weather_trace = weather_result
    pois, poi_trace = pois_result
    traces = state.get("skill_traces", []) + [template_trace, weather_trace, poi_trace, social_trace]
    return {
        "templates": templates,
        "social_notes": social_notes,
        "weather": weather,
        "pois": pois,
        "skill_traces": traces,
    }


async def route_node(state: TravelState) -> TravelState:
    routes, trace = await plan_routes(state.get("pois", []), state["prompt_version"])
    return {"routes": routes, "skill_traces": state.get("skill_traces", []) + [trace]}


async def validation_node(state: TravelState) -> TravelState:
    feedback = "PASS"
    if not state.get("pois"):
        feedback = "NO_POI_FALLBACK"
    elif len(state.get("weather", [])) < state["intent"].days:
        feedback = "WEATHER_DEGRADED"
    return {"validation_feedback": feedback}


async def render_node(state: TravelState) -> TravelState:
    plan, trace = render_itinerary(
        intent=state["intent"],
        prompt_version=state["prompt_version"],
        templates=state.get("templates", []),
        social_notes=state.get("social_notes", []),
        weather=state.get("weather", []),
        pois=state.get("pois", []),
        routes=state.get("routes", []),
        traces=state.get("skill_traces", []),
        trace_id=state.get("trace_id"),
    )
    traces = state.get("skill_traces", []) + [trace]
    plan = StructuredItinerary.model_validate({**plan.model_dump(), "skill_traces": traces})
    return {"plan": plan, "skill_traces": traces}


def create_travel_graph():
    workflow = StateGraph(TravelState)
    workflow.add_node("intent_skill", intent_node)
    workflow.add_node("enrichment_skill", enrichment_node)
    workflow.add_node("routing_skill", route_node)
    workflow.add_node("validation_skill", validation_node)
    workflow.add_node("render_skill", render_node)
    workflow.set_entry_point("intent_skill")
    workflow.add_edge("intent_skill", "enrichment_skill")
    workflow.add_edge("enrichment_skill", "routing_skill")
    workflow.add_edge("routing_skill", "validation_skill")
    workflow.add_edge("validation_skill", "render_skill")
    workflow.add_edge("render_skill", END)
    return workflow.compile()
