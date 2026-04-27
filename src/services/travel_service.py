from src.agents.workflow import create_travel_graph

class TravelService:
    """
    旅游业务逻辑层
    """
    def __init__(self):
        self.graph = create_travel_graph()

    async def generate_plan(self, user_input: str, preferences: dict = None):
        """
        调用 Agent 工作流生成行程规划
        """
        initial_state = {
            "user_input": user_input,
            "preferences": preferences or {},
            "research_results": [],
            "validation_feedback": "",
            "final_itinerary": "",
            "waypoints": []
        }
        
        # 异步执行图任务
        final_state = await self.graph.ainvoke(initial_state)
        return final_state
