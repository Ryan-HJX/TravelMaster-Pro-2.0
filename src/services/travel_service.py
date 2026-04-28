from __future__ import annotations

from uuid import uuid4

from src.agents.workflow import create_travel_graph
from src.schemas.plan import StructuredItinerary


class TravelService:
    def __init__(self) -> None:
        self.graph = create_travel_graph()

    async def generate_plan(
        self,
        user_input: str,
        preferences: dict | None = None,
        travel_constraints: dict | None = None,
        prompt_version: str = "v1-pro",
        trace_id: str | None = None,
    ) -> StructuredItinerary:
        final_state = await self.graph.ainvoke(
            {
                "user_input": user_input,
                "preferences": preferences or {},
                "travel_constraints": travel_constraints or {},
                "prompt_version": prompt_version,
                "trace_id": trace_id or uuid4().hex,
            }
        )
        return final_state["plan"]
