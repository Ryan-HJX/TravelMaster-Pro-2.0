from __future__ import annotations

import asyncio
import json
import logging

import httpx
from redis.asyncio import from_url as redis_from_url

from src.config.settings import settings
from src.schemas.plan import WorkerTaskRequest
from src.services.travel_service import TravelService
from src.services.progress_tracker import progress_tracker

logger = logging.getLogger(__name__)


async def process_stream_tasks() -> None:
    travel_service = TravelService()
    redis_client = redis_from_url(settings.REDIS_URL, decode_responses=True)
    # Start from the end to avoid reprocessing old messages
    last_id = '$'  # ✅ 从最新消息开始，忽略历史消息
    # Explicitly disable proxies for internal Java backend calls to avoid 502 errors
    logger.info(f"Starting stream worker. Redis: {settings.REDIS_URL}, Stream: {settings.AI_TASK_STREAM}")
    logger.info(f"Will only process NEW messages (last_id={last_id})")
    async with httpx.AsyncClient(timeout=settings.EXTERNAL_TIMEOUT_SECONDS, trust_env=False) as client:
        logger.info("HTTP Client initialized. Entering main loop...")
        while True:
            try:
                messages = await redis_client.xread({settings.AI_TASK_STREAM: last_id}, block=5000, count=10)
                if not messages:
                    logger.debug(f"Watching {settings.AI_TASK_STREAM} from ID {last_id}...")
                    continue
                for _, entries in messages:
                    for message_id, payload in entries:
                        last_id = message_id

                        if "taskId" not in payload or "userInput" not in payload:
                            logger.warning(f"Invalid message format (id: {message_id})")
                            continue

                        logger.info(f"Processing task: {payload['taskId']} (User: {payload.get('userId')})")

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
                            logger.error(f"Failed to handle task {payload.get('taskId')}: {inner_exc}")

            except asyncio.CancelledError:
                raise
            except Exception as exc:
                logger.error(f"Iteration failed: {exc}")
                await asyncio.sleep(1)


def _build_success_payload(plan, request: WorkerTaskRequest) -> dict:
    """Build success payload from plan and request."""
    mcp_calls = [tc.model_dump() for tc in plan.mcp_tool_calls]
    return {
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
        "modelProvider": plan.model_provider,
        "modelName": plan.model_name,
        "mcpTrace": json.dumps(mcp_calls, ensure_ascii=False),
        "toolCalls": json.dumps(mcp_calls, ensure_ascii=False),
        "fallbackUsed": plan.model_provider.startswith("ollama"),
        "planningScore": plan.planning_score.level,
        "startLocation": plan.enriched_pois[0].address if plan.enriched_pois else None,
        "endLocation": plan.enriched_pois[-1].address if plan.enriched_pois else None,
        "travelModePreference": "mixed",
        "weatherSummary": json.dumps([w.model_dump() for w in plan.weather_forecast], ensure_ascii=False),
        "financeSummary": json.dumps(plan.finance_summary, ensure_ascii=False) if plan.finance_summary else None,
    }


def _build_failure_payload(exc: Exception, request: WorkerTaskRequest) -> dict:
    """Build failure payload from exception and request."""
    return {
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


async def _handle_task(travel_service: TravelService, client: httpx.AsyncClient, request: WorkerTaskRequest) -> None:
    try:
        await progress_tracker.initialize_task(request.task_id)
        logger.info(f"Initialized progress tracking for task {request.task_id}")
    except Exception as e:
        logger.error(f"Failed to initialize progress tracking: {e}")

    try:
        plan = await travel_service.generate_plan(
            user_input=request.user_input,
            preferences=request.preferences,
            travel_constraints=request.travel_constraints,
            prompt_version=request.prompt_version,
            trace_id=request.trace_id,
            task_id=request.task_id,
        )
        payload = _build_success_payload(plan, request)
    except Exception as exc:
        logger.error(f"generate_plan failed for task {request.task_id}: {exc}")
        payload = _build_failure_payload(exc, request)

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
            logger.info(f"Task {request.task_id} callback successful")
            return
        except Exception as callback_exc:
            if attempt < 4:
                logger.warning(f"Callback for {request.task_id} failed (attempt {attempt + 1}/5): {callback_exc}")
                await asyncio.sleep(5)
            else:
                logger.error(f"Callback failed for task {request.task_id} after 5 attempts")
