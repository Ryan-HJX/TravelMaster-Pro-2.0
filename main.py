from __future__ import annotations

import asyncio
import sys
from contextlib import asynccontextmanager, suppress

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.v1.plan import router as plan_router
from src.api.v1.progress import router as progress_router
from src.config.settings import settings
from src.services.travel_service import TravelService
from src.worker.stream_worker import process_stream_tasks

if sys.platform == "win32":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8")


print(">>> [LOAD] main.py is loading...")

@asynccontextmanager
async def lifespan(app: FastAPI):
    print(">>> [LIFESPAN] Starting application...")
    worker_task = None
    if settings.ENABLE_STREAM_WORKER:
        print(">>> [LIFESPAN] Spawning Stream Worker...")
        worker_task = asyncio.create_task(process_stream_tasks())
    try:
        yield
    finally:
        if worker_task:
            worker_task.cancel()
            with suppress(asyncio.CancelledError):
                await worker_task


app = FastAPI(
    title="TravelMaster AI Planner",
    description="Structured LangGraph planner for TravelMaster Pro",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(plan_router, prefix="/api/v1", tags=["planner"])
app.include_router(progress_router, prefix="/api/v1", tags=["progress"])


@app.get("/")
async def root():
    return {"message": "TravelMaster AI Planner", "docs": "/docs"}


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",  # 显示 info 级别日志，包括进度更新
        access_log=False  # 关闭 HTTP 访问日志，减少噪音
    )
