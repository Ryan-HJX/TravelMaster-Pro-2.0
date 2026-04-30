"""7-stage travel planning workflow using Bailian + Amap MCP.

Pipeline: intent → geo_grounding → poi_pool → route_optimization
         → weather_adjustment → scoring → rendering → END
"""

from __future__ import annotations

import logging
from uuid import uuid4

from langgraph.graph import END, StateGraph

from src.agents.state import TravelState
from src.schemas.plan import MCPToolCall, PlanningScore, SkillTrace

from src.planner.stages.intent_parser import parse_intent
from src.planner.stages.geo_grounder import ground_geography
from src.planner.stages.poi_selector import select_pois
from src.planner.stages.route_optimizer import optimize_routes
from src.planner.stages.weather_adjuster import adjust_for_weather
from src.planner.stages.scoring import compute_planning_score
from src.core.utils import calculate_budget
from src.planner.stages.finance_advisor import analyze_finance
from src.planner.stages.transport_planner import plan_intercity_transport
from src.planner.stages.renderer import render_itinerary
from src.services.progress_tracker import progress_tracker

logger = logging.getLogger(__name__)


def _build_trace(name: str, model: str, latency_ms: int, pv: str) -> SkillTrace:
    return SkillTrace(name=name, prompt_version=pv, model=model, latency_ms=latency_ms)


def _build_mcp_calls(stage: str, tool_calls: list[dict]) -> list[MCPToolCall]:
    return [
        MCPToolCall(
            stage=stage, tool_type=tc.get("type", ""),
            tool_name=tc.get("name", ""), server_label=tc.get("server_label", ""),
            arguments=str(tc.get("arguments", ""))[:200],
            output_preview=str(tc.get("output", ""))[:200],
        )
        for tc in tool_calls
    ]


# ── Node 1: Intent Parsing ──────────────────────────────────────

async def intent_node(state: TravelState) -> TravelState:
    task_id = state.get("task_id", "")
    print(">>> [AI 步骤] 1. 正在深度解析您的旅行意图...")

    # Update progress
    if task_id:
        await progress_tracker.update_step_status(task_id, "intent_parser", "processing")

    intent = await parse_intent(state["user_input"])

    # Mark as completed
    if task_id:
        await progress_tracker.update_step_status(task_id, "intent_parser", "completed")

    return {
        "intent": intent,
        "trace_id": state.get("trace_id", uuid4().hex),
        "skill_traces": [_build_trace("intent_parser", "flash", 0, state.get("prompt_version", "v2-mcp"))],
        "mcp_tool_calls": [],
        "model_provider": "",
    }


# ── Node 2: Geo Grounding ───────────────────────────────────────

async def geo_grounding_node(state: TravelState) -> TravelState:
    task_id = state.get("task_id", "")
    print(">>> [AI 步骤] 2. 正在通过高德地图进行地理位置校准...")

    if task_id:
        await progress_tracker.update_step_status(task_id, "geo_grounding", "processing")

    result = await ground_geography(state["intent"])

    if task_id:
        await progress_tracker.update_step_status(task_id, "geo_grounding", "completed")

    traces = state.get("skill_traces", []) + [
        _build_trace("geo_grounding", result.get("model", ""), result.get("latency_ms", 0), state.get("prompt_version", "v2-mcp"))
    ]
    mcp_calls = state.get("mcp_tool_calls", []) + _build_mcp_calls("geo_grounding", result.get("tool_calls", []))
    return {
        "geo_grounding": result["geo_data"],
        "skill_traces": traces,
        "mcp_tool_calls": mcp_calls,
        "model_provider": result.get("model", ""),
    }


# ── Node 3: POI Pool ────────────────────────────────────────────

async def poi_pool_node(state: TravelState) -> TravelState:
    task_id = state.get("task_id", "")
    print(">>> [AI 步骤] 3. 正在筛选目的地附近的精品景点和餐厅...")

    if task_id:
        await progress_tracker.update_step_status(task_id, "poi_selector", "processing")

    pois, fallbacks, meta = await select_pois(state["intent"], state.get("geo_grounding", {}))

    if task_id:
        await progress_tracker.update_step_status(task_id, "poi_selector", "completed")

    traces = state.get("skill_traces", []) + [
        _build_trace("poi_selector", meta.get("model", ""), meta.get("latency_ms", 0), state.get("prompt_version", "v2-mcp"))
    ]
    mcp_calls = state.get("mcp_tool_calls", []) + _build_mcp_calls("poi_selector", meta.get("tool_calls", []))
    return {
        "enriched_pois": pois,
        "fallback_options": fallbacks,
        "skill_traces": traces,
        "mcp_tool_calls": mcp_calls,
    }


# ── Node 4: Route Optimization ──────────────────────────────────

async def route_optimizer_node(state: TravelState) -> TravelState:
    task_id = state.get("task_id", "")
    print(">>> [AI 步骤] 4. 正在为您规划最合理的交通路线...")

    if task_id:
        await progress_tracker.update_step_status(task_id, "route_optimizer", "processing")

    routes, meta = await optimize_routes(state["intent"], state.get("enriched_pois", []))

    if task_id:
        await progress_tracker.update_step_status(task_id, "route_optimizer", "completed")

    traces = state.get("skill_traces", []) + [
        _build_trace("route_optimizer", meta.get("model", ""), meta.get("latency_ms", 0), state.get("prompt_version", "v2-mcp"))
    ]
    mcp_calls = state.get("mcp_tool_calls", []) + _build_mcp_calls("route_optimizer", meta.get("tool_calls", []))
    return {"route_options": routes, "skill_traces": traces, "mcp_tool_calls": mcp_calls}


# ── Node 5: Weather Adjustment ──────────────────────────────────

async def weather_adjuster_node(state: TravelState) -> TravelState:
    task_id = state.get("task_id", "")
    print(">>> [AI 步骤] 5. 正在结合目的地天气情况调整行程...")

    if task_id:
        await progress_tracker.update_step_status(task_id, "weather_adjuster", "processing")

    weather, meta = await adjust_for_weather(
        state["intent"], state.get("enriched_pois", []), state.get("fallback_options", []),
    )

    if task_id:
        await progress_tracker.update_step_status(task_id, "weather_adjuster", "completed")

    traces = state.get("skill_traces", []) + [
        _build_trace("weather_adjuster", meta.get("model", ""), meta.get("latency_ms", 0), state.get("prompt_version", "v2-mcp"))
    ]
    mcp_calls = state.get("mcp_tool_calls", []) + _build_mcp_calls("weather_adjuster", meta.get("tool_calls", []))
    return {"weather_forecast": weather, "skill_traces": traces, "mcp_tool_calls": mcp_calls}


# ── Node 6: Scoring ─────────────────────────────────────────────

async def scoring_node(state: TravelState) -> TravelState:
    task_id = state.get("task_id", "")
    print(">>> [AI 步骤] 6. 正在对行程质量进行多维度评估打分...")

    if task_id:
        await progress_tracker.update_step_status(task_id, "scoring", "processing")

    score = compute_planning_score(
        state["intent"], state.get("enriched_pois", []), state.get("route_options", []),
    )

    if task_id:
        await progress_tracker.update_step_status(task_id, "scoring", "completed")

    return {"planning_score": score}


# ── Node 7: Finance Advisor ─────────────────────────────────────

async def finance_node(state: TravelState) -> TravelState:
    task_id = state.get("task_id", "")
    print(">>> [AI 步骤] 7. 正在结合盈米金融能力为您生成资金建议...")

    if task_id:
        await progress_tracker.update_step_status(task_id, "finance_advisor", "processing")

    finance = await analyze_finance(state["intent"], state.get("enriched_pois", []))

    if task_id:
        await progress_tracker.update_step_status(task_id, "finance_advisor", "completed")

    return {"finance_summary": finance}


# ── Node 8: Transport Planner ────────────────────────────────────

async def transport_node(state: TravelState) -> TravelState:
    task_id = state.get("task_id", "")
    print(">>> [AI 步骤] 8. 正在为您规划往返大交通方案...")

    if task_id:
        await progress_tracker.update_step_status(task_id, "transport_planner", "processing")

    transport_plan = await plan_intercity_transport(state["intent"])
    
    if transport_plan and transport_plan.total_cost > 0:
        updated_finance = calculate_budget(state["intent"], transport_plan.total_cost)
        finance_summary = state.get("finance_summary", {})
        finance_summary.update(updated_finance)
    else:
        finance_summary = state.get("finance_summary")

    if task_id:
        await progress_tracker.update_step_status(task_id, "transport_planner", "completed")

    return {"transport_plan": transport_plan, "finance_summary": finance_summary}


# ── Node 9: Render ──────────────────────────────────────────────

async def render_node(state: TravelState) -> TravelState:
    task_id = state.get("task_id", "")
    print(">>> [AI 步骤] 9. 正在为您绘制精美的旅行地图与文档...")

    if task_id:
        await progress_tracker.update_step_status(task_id, "renderer", "processing")

    plan = await render_itinerary(
        intent=state["intent"],
        enriched_pois=state.get("enriched_pois", []),
        fallback_options=state.get("fallback_options", []),
        route_options=state.get("route_options", []),
        weather_forecast=state.get("weather_forecast", []),
        planning_score=state.get("planning_score", PlanningScore()),
        finance_summary=state.get("finance_summary"),
        transport_plan=state.get("transport_plan"),  # 新增：传入大交通方案
        trace_id=state.get("trace_id", ""),
        prompt_version=state.get("prompt_version", "v2-mcp"),
        mcp_tool_calls=state.get("mcp_tool_calls", []),
        model_provider=state.get("model_provider", ""),
    )

    if task_id:
        await progress_tracker.update_step_status(task_id, "renderer", "completed")
        await progress_tracker.complete_task(task_id)

    return {"plan": plan}


# ── Graph Construction ──────────────────────────────────────────

def create_travel_graph():
    workflow = StateGraph(TravelState)
    workflow.add_node("intent_parser", intent_node)
    workflow.add_node("geo_grounder", geo_grounding_node)
    workflow.add_node("poi_selector", poi_pool_node)
    workflow.add_node("route_optimizer", route_optimizer_node)
    workflow.add_node("weather_adjuster", weather_adjuster_node)
    workflow.add_node("scoring", scoring_node)
    workflow.add_node("finance_advisor", finance_node)
    workflow.add_node("transport_planner", transport_node)  # 新增
    workflow.add_node("renderer", render_node)

    workflow.set_entry_point("intent_parser")
    workflow.add_edge("intent_parser", "geo_grounder")
    workflow.add_edge("geo_grounder", "poi_selector")
    workflow.add_edge("poi_selector", "route_optimizer")
    workflow.add_edge("route_optimizer", "weather_adjuster")
    workflow.add_edge("weather_adjuster", "scoring")
    workflow.add_edge("scoring", "finance_advisor")
    workflow.add_edge("finance_advisor", "transport_planner")  # 修改：finance → transport
    workflow.add_edge("transport_planner", "renderer")  # 修改：transport → renderer
    workflow.add_edge("renderer", END)

    return workflow.compile()
