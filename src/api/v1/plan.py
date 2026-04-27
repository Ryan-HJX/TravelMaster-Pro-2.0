from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Generic, TypeVar
from src.services.travel_service import TravelService
from src.models.response import BaseResponse

router = APIRouter()
travel_service = TravelService()

class PlanRequest(BaseModel):
    user_input: Optional[str] = None
    query: Optional[str] = None
    preferences: dict = {}
    user_id: Optional[str] = None
    userId: Optional[str] = None

    def get_input(self) -> str:
        return self.user_input or self.query or ""

    def get_user_id(self) -> str:
        return self.user_id or self.userId or self.preferences.get("user_id") or "guest"

@router.post("/plan", response_model=BaseResponse)
async def create_plan(request: PlanRequest):
    """
    创建旅游规划任务
    """
    try:
        result = await travel_service.generate_plan(
            request.get_input(), 
            {**request.preferences, "user_id": request.get_user_id()}
        )
        # 核心调试日志
        itinerary_content = result.get('final_itinerary', '')
        waypoints_list = result.get('waypoints', [])
        print(f"DEBUG: Graph State Keys: {list(result.keys())}")
        print(f"DEBUG: Itinerary Length: {len(itinerary_content)}")
        print(f"DEBUG: Waypoints Count: {len(waypoints_list)}")
        if len(waypoints_list) > 0:
            print(f"DEBUG: First Waypoint: {waypoints_list[0].get('name')} - {waypoints_list[0].get('location')}")
        
        return BaseResponse.success(data={
            "itinerary": itinerary_content,
            "waypoints": waypoints_list
        })
    except Exception as e:
        print(f"❌ 规划失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
