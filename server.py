"""
TravelMaster Agent 服务入口。

使用 FastAPI 封装 LangGraph 工作流，对外提供 RESTful API 接口。
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from agents.workflow import create_travel_graph
from db.database import init_db
import uvicorn
import asyncio

# 初始化 FastAPI 应用
app = FastAPI(
    title="TravelMaster Agent API",
    description="AI 智能旅游规划 Agent 核心服务",
    version="1.0.0"
)

# 全局工作流实例
graph = None


class PlanRequest(BaseModel):
    """
    行程规划请求模型。
    
    Attributes:
        query (str): 用户的自然语言旅行需求。
        user_id (str, optional): 用户唯一标识。
    """
    query: str
    user_id: str | None = None


class PlanResponse(BaseModel):
    """
    行程规划响应模型。
    
    Attributes:
        itinerary (str): 生成的 Markdown 格式行程单。
        status (str): 任务执行状态。
        waypoints (list): 途经点坐标列表，用于前端地图渲染。
    """
    itinerary: str
    status: str
    waypoints: list = []


@app.on_event("startup")
async def startup_event():
    """
    服务启动时初始化数据库和编译工作流。
    """
    global graph
    await init_db()
    graph = create_travel_graph()
    print("✅ TravelMaster Agent 服务已启动")


@app.post("/api/v1/plan", response_model=PlanResponse)
async def plan_trip(request: PlanRequest):
    """
    接收用户输入并执行旅游规划工作流。

    Args:
        request: 包含用户查询和用户 ID 的请求对象。

    Returns:
        PlanResponse: 包含最终行程单和执行状态。
    """
    if not graph:
        raise HTTPException(status_code=503, detail="服务尚未初始化完成")

    try:
        # 构建初始状态
        initial_state = {
            "messages": [],
            "user_input": request.query,
            "plan_steps": [],
            "research_results": [],
            "validation_feedback": None,
            "final_itinerary": None,
            "waypoints": [],
            "user_id": request.user_id or "anonymous"
        }

        # 异步执行工作流
        final_state = await graph.ainvoke(initial_state)
        
        itinerary = final_state.get("final_itinerary")
        waypoints = final_state.get("waypoints", [])
        if not itinerary:
            raise HTTPException(status_code=500, detail="行程生成失败")

        return PlanResponse(itinerary=itinerary, status="success", waypoints=waypoints)

    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"❌ 发生严重错误: {str(e)}")
        print(error_trace)
        raise HTTPException(status_code=500, detail=f"内部服务器错误: {str(e)}")


if __name__ == "__main__":
    # 启动 Uvicorn 服务器
    uvicorn.run(app, host="0.0.0.0", port=8000)
