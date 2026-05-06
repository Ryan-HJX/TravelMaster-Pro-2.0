from __future__ import annotations

import json
import logging
from functools import wraps
from typing import Any, Callable, Coroutine, ParamSpec, TypeVar

from src.services.progress_tracker import progress_tracker

logger = logging.getLogger(__name__)

P = ParamSpec("P")
R = TypeVar("R")


def extract_json_markdown(text: str) -> str:
    """Extract JSON content from markdown code blocks."""
    if "```" in text:
        # Try to find json code block first
        if "```json" in text:
            text = text.split("```json")[-1].split("```")[0].strip()
        else:
            # Fallback to any code block
            text = text.split("```")[1].strip()
    return text.strip()


def parse_json_safe(text: str, default: Any = None) -> Any:
    """Safely parse JSON with fallback to default value."""
    try:
        cleaned = extract_json_markdown(text)
        return json.loads(cleaned)
    except (json.JSONDecodeError, ValueError) as exc:
        logger.warning("JSON parse failed: %s", exc)
        return default


def async_step(step_id: str):
    """Decorator for workflow steps with progress tracking."""
    def decorator(func: Callable[P, Coroutine[Any, Any, R]]) -> Callable[P, Coroutine[Any, Any, R]]:
        @wraps(func)
        async def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            state = args[0] if args else kwargs.get("state")
            task_id = state.get("task_id", "") if isinstance(state, dict) else ""

            if task_id:
                await progress_tracker.update_step_status(task_id, step_id, "processing")

            try:
                result = await func(*args, **kwargs)
            except Exception:
                if task_id:
                    await progress_tracker.update_step_status(task_id, step_id, "failed")
                raise

            if task_id:
                await progress_tracker.update_step_status(task_id, step_id, "completed")

            return result
        return wrapper
    return decorator


