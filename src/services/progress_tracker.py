"""Real-time progress tracking service for itinerary generation tasks."""

from __future__ import annotations

import json
import logging
from datetime import datetime
from typing import Optional

import redis.asyncio as redis

from src.config.settings import settings
from src.core.constants import WORKFLOW_STEPS_CONFIG

logger = logging.getLogger(__name__)


class ProgressStep:
    """Represents a single step in the planning workflow."""

    def __init__(
        self,
        step_id: str,
        step_name: str,
        description: str,
        status: str = "pending",  # pending, processing, completed, failed
        start_time: Optional[str] = None,
        end_time: Optional[str] = None,
    ):
        self.step_id = step_id
        self.step_name = step_name
        self.description = description
        self.status = status
        self.start_time = start_time
        self.end_time = end_time

    def to_dict(self) -> dict:
        return {
            "stepId": self.step_id,
            "stepName": self.step_name,
            "description": self.description,
            "status": self.status,
            "startTime": self.start_time,
            "endTime": self.end_time,
        }


WORKFLOW_STEPS = WORKFLOW_STEPS_CONFIG


class ProgressTracker:
    """Tracks and stores progress for itinerary generation tasks."""

    def __init__(self):
        self.redis_url = settings.REDIS_URL
        self._redis: Optional[redis.Redis] = None

    async def _get_redis(self) -> redis.Redis:
        if self._redis is None:
            self._redis = redis.from_url(
                self.redis_url,
                decode_responses=True,
                max_connections=10,
                socket_timeout=5,
                socket_connect_timeout=5,
            )
        return self._redis

    async def initialize_task(self, task_id: str):
        """Initialize progress tracking for a new task."""
        try:
            r = await self._get_redis()
            steps = [
                ProgressStep(
                    step_id=step_id,
                    step_name=step_name,
                    description=description,
                    status="pending",
                ).to_dict()
                for step_id, step_name, description in WORKFLOW_STEPS
            ]

            now_str = datetime.utcnow().isoformat()
            progress_data = {
                "taskId": str(task_id),
                "currentStep": "",
                "overallProgress": "0",
                "steps": json.dumps(steps),
                "createdAt": now_str,
                "updatedAt": now_str,
            }

            await r.hset(f"task_progress:{task_id}", mapping=progress_data)  # type: ignore
            await r.expire(f"task_progress:{task_id}", 3600)  # type: ignore
            logger.info(f"Initialized progress tracking for task {task_id}")
        except Exception as e:
            logger.error(f"Failed to initialize task progress: {e}")

    async def update_step_status(
        self, task_id: str, step_id: str, status: str
    ):
        """Update the status of a specific step."""
        try:
            r = await self._get_redis()
            progress_key = f"task_progress:{task_id}"

            # Get current progress data
            progress_data = await r.hgetall(progress_key)  # type: ignore
            if not progress_data:
                logger.warning(f"No progress data found for task {task_id}")
                return

            # Parse existing steps
            steps = json.loads(progress_data.get("steps", "[]"))
            logger.info(f"[PROGRESS UPDATE] Task {task_id}, Step {step_id} -> {status}")

            # Update the specific step
            now = datetime.utcnow().isoformat()
            updated = False
            current_step_name = None

            for step in steps:
                if step["stepId"] == step_id:
                    step["status"] = status
                    if status == "processing":
                        step["startTime"] = now
                        current_step_name = step["stepName"]
                    elif status in ["completed", "failed"]:
                        step["endTime"] = now
                    updated = True
                    break

            if not updated:
                logger.warning(f"Step {step_id} not found in task {task_id}")
                return

            # Calculate overall progress
            completed_count = sum(
                1 for s in steps if s["status"] == "completed"
            )
            total_steps = len(steps)
            overall_progress = int((completed_count / total_steps) * 100)

            # Update progress data
            progress_data["steps"] = json.dumps(steps)
            progress_data["currentStep"] = current_step_name or progress_data.get(
                "currentStep", ""
            )
            progress_data["overallProgress"] = str(overall_progress)
            progress_data["updatedAt"] = now

            await r.hset(progress_key, mapping=progress_data)  # type: ignore
            await r.expire(progress_key, 3600)  # type: ignore

            logger.info(
                f"[PROGRESS UPDATED] Task {task_id}: {overall_progress}% complete, "
                f"current step: {current_step_name or 'N/A'}"
            )
        except Exception as e:
            logger.error(f"Failed to update step status: {e}", exc_info=True)

    async def get_progress(self, task_id: str) -> Optional[dict]:
        """Get current progress for a task."""
        try:
            r = await self._get_redis()
            progress_data = await r.hgetall(f"task_progress:{task_id}")  # type: ignore

            if not progress_data:
                return None

            # Parse steps from JSON string
            steps = json.loads(progress_data.get("steps", "[]"))

            return {
                "taskId": progress_data.get("taskId"),
                "currentStep": progress_data.get("currentStep"),
                "overallProgress": int(progress_data.get("overallProgress", 0)),
                "steps": steps,
                "createdAt": progress_data.get("createdAt"),
                "updatedAt": progress_data.get("updatedAt"),
            }
        except Exception as e:
            logger.error(f"Failed to get progress: {e}")
            return None

    async def complete_task(self, task_id: str):
        """Mark all remaining steps as completed."""
        try:
            r = await self._get_redis()
            progress_data = await r.hgetall(f"task_progress:{task_id}")  # type: ignore

            if not progress_data:
                return

            steps = json.loads(progress_data.get("steps", "[]"))
            now = datetime.utcnow().isoformat()

            # Mark any non-completed steps as completed
            for step in steps:
                if step["status"] not in ["completed", "failed"]:
                    step["status"] = "completed"
                    step["endTime"] = now

            progress_data["steps"] = json.dumps(steps)
            progress_data["overallProgress"] = "100"
            progress_data["currentStep"] = "completed"
            progress_data["updatedAt"] = now

            await r.hset(f"task_progress:{task_id}", mapping=progress_data)  # type: ignore
            logger.info(f"Task {task_id} marked as completed")
        except Exception as e:
            logger.error(f"Failed to complete task: {e}")


    async def close(self):
        """Close the Redis connection pool."""
        if self._redis:
            await self._redis.close()
            self._redis = None


# Global instance
progress_tracker = ProgressTracker()
