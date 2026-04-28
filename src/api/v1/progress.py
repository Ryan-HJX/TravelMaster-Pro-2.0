"""API endpoint for querying task progress."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from src.models.response import BaseResponse
from src.services.progress_tracker import progress_tracker

router = APIRouter()


@router.get("/tasks/{task_id}/progress", response_model=BaseResponse)
async def get_task_progress(task_id: str):
    """Get real-time progress for an itinerary generation task."""
    try:
        progress = await progress_tracker.get_progress(task_id)

        if progress is None:
            raise HTTPException(status_code=404, detail="Task progress not found")

        return BaseResponse.success(data=progress)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
