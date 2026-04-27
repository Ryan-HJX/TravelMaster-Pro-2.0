import uvicorn
import sys

# 强制设置标准输出为 UTF-8，防止 Windows 终端显示乱码
if sys.platform == "win32":
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8')

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api.v1.plan import router as plan_router

app = FastAPI(
    title="TravelMaster API",
    description="企业级 AI 旅游规划助手后端",
    version="1.0.0"
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(plan_router, prefix="/api/v1", tags=["旅游规划"])

@app.get("/")
async def root():
    return {"message": "Welcome to TravelMaster API v1.0", "docs": "/docs"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
