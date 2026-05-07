"""API endpoint for querying task progress."""

from __future__ import annotations

import asyncio
import json

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

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


@router.get("/tasks/{task_id}/progress/stream")
async def stream_task_progress(task_id: str):
    """SSE endpoint: stream real-time progress updates for a task."""

    async def event_generator():
        last_sent = None
        for _ in range(600):  # max 5 minutes (600 * 500ms)
            progress = await progress_tracker.get_progress(task_id)
            if progress is None:
                yield f"data: {json.dumps({'status': 'not_found'})}\n\n"
                return

            # Only send if changed
            progress_json = json.dumps(progress, ensure_ascii=False)
            if progress_json != last_sent:
                yield f"data: {progress_json}\n\n"
                last_sent = progress_json

            # If completed or all steps done, send final and close
            overall = progress.get("overallProgress", 0)
            if overall >= 100:
                yield f"data: {json.dumps({'status': 'completed'})}\n\n"
                return

            await asyncio.sleep(0.5)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
