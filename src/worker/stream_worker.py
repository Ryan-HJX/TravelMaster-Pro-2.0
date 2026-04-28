from __future__ import annotations

import asyncio
import json
import logging

import httpx
from redis.asyncio import from_url as redis_from_url

from src.config.settings import settings
from src.schemas.plan import WorkerTaskRequest
from src.services.travel_service import TravelService

logger = logging.getLogger(__name__)


async def process_stream_tasks() -> None:
    travel_service = TravelService()
    redis_client = redis_from_url(settings.REDIS_URL, decode_responses=True)
    # Start from the beginning or pending to ensure no tasks are missed
    last_id = '0' 
    # Explicitly disable proxies for internal Java backend calls to avoid 502 errors
    print(f">>> [WORKER] Starting stream worker. Redis: {settings.REDIS_URL}, Stream: {settings.AI_TASK_STREAM}")
    async with httpx.AsyncClient(timeout=settings.EXTERNAL_TIMEOUT_SECONDS, trust_env=False) as client:
        print(">>> [WORKER] HTTP Client initialized. Entering main loop...")
        while True:
            try:
                messages = await redis_client.xread({settings.AI_TASK_STREAM: last_id}, block=5000, count=10)
                if not messages:
                    # Heartbeat
                    print(f">>> [HEARTBEAT] Watching {settings.AI_TASK_STREAM} from ID {last_id}...")
                    continue
                for _, entries in messages:
                    for message_id, payload in entries:
                        last_id = message_id
                        
                        # Basic validation to prevent KeyError
                        if "taskId" not in payload or "userInput" not in payload:
                            print(f">>> [SKIP] Invalid message format (id: {message_id})")
                            continue
                            
                        print(f">>> [WORKER] Processing task: {payload['taskId']} (User: {payload.get('userId')})")
                        
                        try:
                            request = WorkerTaskRequest(
                                task_id=payload["taskId"],
                                user_id=payload.get("userId", "anonymous"),
                                trace_id=payload.get("traceId", "none"),
                                prompt_version=payload.get("promptVersion", "v2-mcp"),
                                user_input=payload["userInput"],
                                preferences=json.loads(payload.get("preferences", "{}")),
                                travel_constraints=json.loads(payload.get("travelConstraints", "{}")),
                            )
                            await _handle_task(travel_service, client, request)
                        except Exception as inner_exc:
                            print(f"!!! [ERROR] Failed to handle task {payload.get('taskId')}: {inner_exc}")
                            
            except asyncio.CancelledError:
                raise
            except Exception as exc:
                print(f"!!! [ITERATION FAILED] {exc}")
                await asyncio.sleep(1)


async def _handle_task(travel_service: TravelService, client: httpx.AsyncClient, request: WorkerTaskRequest) -> None:
    try:
        plan = await travel_service.generate_plan(
            user_input=request.user_input,
            preferences=request.preferences,
            travel_constraints=request.travel_constraints,
            prompt_version=request.prompt_version,
            trace_id=request.trace_id,
            task_id=request.task_id,
        )
        payload = {
            "success": True,
            "traceId": plan.trace_id,
            "promptVersion": plan.prompt_version,
            "title": plan.title,
            "summary": plan.summary,
            "riskTips": plan.risk_tips,
            "renderedMarkdown": plan.rendered_markdown,
            "structuredContent": plan.model_dump(),
            "days": [day.model_dump() for day in plan.days],
            "failureReason": None,
            # ── 2.0 enhanced fields ─────────────────────────
            "modelProvider": plan.model_provider,
            "modelName": plan.model_provider,
            "mcpTrace": json.dumps([tc.model_dump() for tc in plan.mcp_tool_calls], ensure_ascii=False),
            "toolCalls": json.dumps([tc.model_dump() for tc in plan.mcp_tool_calls], ensure_ascii=False),
            "fallbackUsed": plan.model_provider.startswith("ollama"),
            "planningScore": plan.planning_score.level,
            "startLocation": plan.enriched_pois[0].address if plan.enriched_pois else None,
            "endLocation": plan.enriched_pois[-1].address if plan.enriched_pois else None,
            "travelModePreference": "mixed",
            "weatherSummary": json.dumps([w.model_dump() for w in plan.weather_forecast], ensure_ascii=False),
            "financeSummary": json.dumps(plan.finance_summary, ensure_ascii=False) if plan.finance_summary else None,
        }
    except Exception as exc:
        print(f"!!! [LLM ERROR] generate_plan failed for task {request.task_id}: {exc}")
        payload = {
            "success": False,
            "traceId": request.trace_id,
            "promptVersion": request.prompt_version,
            "title": None, "summary": None, "riskTips": None,
            "renderedMarkdown": None, "structuredContent": {},
            "days": [], "failureReason": str(exc),
            "modelProvider": None, "modelName": None,
            "mcpTrace": None, "toolCalls": None,
            "fallbackUsed": False, "planningScore": None,
            "startLocation": None, "endLocation": None,
            "travelModePreference": None, "weatherSummary": None,
            "financeSummary": None,
        }

    callback_url = f"{settings.JAVA_CALLBACK_BASE_URL}/{request.task_id}/complete"
    # Retry logic for callback in case Java is still restarting
    for attempt in range(5):
        try:
            response = await client.post(
                callback_url,
                json=payload,
                headers={"X-Internal-Token": settings.INTERNAL_API_TOKEN},
            )
            response.raise_for_status()
            print(f">>> [DONE] Task {request.task_id} callback successful")
            return
        except Exception as callback_exc:
            if attempt < 4:
                print(f">>> [RETRY] Callback for {request.task_id} failed (attempt {attempt + 1}/5): {callback_exc}")
                await asyncio.sleep(5)
            else:
                print(f"!!! [FATAL] Callback failed for task {request.task_id} after 5 attempts")
