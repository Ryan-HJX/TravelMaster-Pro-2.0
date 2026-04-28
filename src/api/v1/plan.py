from __future__ import annotations

from fastapi import APIRouter, HTTPException

from src.models.response import BaseResponse
from src.schemas.plan import CompatPlanRequest
from src.services.travel_service import TravelService

router = APIRouter()
travel_service = TravelService()


@router.post("/plan", response_model=BaseResponse)
async def create_plan(request: CompatPlanRequest):
    try:
        plan = await travel_service.generate_plan(
            user_input=request.normalized_input(),
            preferences={**request.preferences, "user_id": request.normalized_user_id()},
            travel_constraints=request.travel_constraints,
            prompt_version=request.prompt_version,
        )
        return BaseResponse.success(
            data={
                "itinerary": plan.rendered_markdown,
                "waypoints": [poi.model_dump() for poi in plan.enriched_pois],
                "route_options": [ro.model_dump() for ro in plan.route_options],
                "weather_forecast": [w.model_dump() for w in plan.weather_forecast],
                "planning_score": plan.planning_score.model_dump(),
                "model_provider": plan.model_provider,
                "structured": plan.model_dump(),
            }
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
