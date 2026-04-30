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
    except (json.JSONDecodeError, Exception) as exc:
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
            except Exception as exc:
                if task_id:
                    await progress_tracker.update_step_status(task_id, step_id, "failed")
                raise

            if task_id:
                await progress_tracker.update_step_status(task_id, step_id, "completed")

            return result
        return wrapper
    return decorator


def calculate_budget(intent: Any, transport_cost: int = 0) -> dict[str, Any]:
    """Calculate travel budget based on intent parameters.
    
    Args:
        intent: TravelIntent object or dict with budget and days attributes
        transport_cost: 大交通费用(往返总费用)
    """
    budget_map: dict[str, dict[str, int | str]] = {
        "low": {"daily": 300, "description": "经济型"},
        "medium": {"daily": 800, "description": "舒适型"},
        "high": {"daily": 2000, "description": "豪华型"}
    }

    # Support both dict and object access
    budget_key = intent.get("budget", "medium") if isinstance(intent, dict) else getattr(intent, "budget", "medium")
    days_raw = intent.get("days", 3) if isinstance(intent, dict) else getattr(intent, "days", 3)
    days_int = int(days_raw) if days_raw is not None else 3
    
    budget_info = budget_map.get(budget_key, budget_map["medium"])
    daily_base: int = int(budget_info["daily"])
    local_total: int = daily_base * days_int  # 当地消费总额
    
    grand_total = local_total + transport_cost

    accommodation = int(local_total * 0.35)
    food = int(local_total * 0.25)
    local_transport = int(local_total * 0.20)
    activities = int(local_total * 0.15)
    emergency = int(local_total * 0.05)

    return {
        "total_budget": f"¥{grand_total:,}",
        "local_spending": f"¥{local_total:,}",
        "intercity_transport": f"¥{transport_cost:,}" if transport_cost > 0 else "包含在总预算中",
        "daily_average": f"¥{daily_base:,}",
        "budget_level": budget_key.upper(),
        "budget_description": budget_info["description"],
        "breakdown": {
            "accommodation": {"amount": f"¥{accommodation:,}", "percentage": 35, "description": "住宿费用"},
            "food": {"amount": f"¥{food:,}", "percentage": 25, "description": "餐饮费用"},
            "transport": {"amount": f"¥{local_transport:,}", "percentage": 20, "description": "市内交通费用"},
            "activities": {"amount": f"¥{activities:,}", "percentage": 15, "description": "景点门票及活动"},
            "emergency": {"amount": f"¥{emergency:,}", "percentage": 5, "description": "应急备用金"}
        }
    }