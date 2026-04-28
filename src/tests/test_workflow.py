import pytest

from src.services.travel_service import TravelService


HARNESS_CASES = [
    "北京3天文化游，预算中等，想多逛博物馆和古建",
    "上海2天美食 citywalk，轻松一点",
    "成都3天带娃亲子游，希望节奏不要太赶",
    "杭州2天自然风景+喝茶路线",
    "北京1天特种兵打卡，夜景也想看",
    "上海3天情侣旅行，拍照和咖啡馆优先",
    "成都2天本地小吃路线",
    "杭州3天历史文化慢游",
    "北京4天家庭出游，预算高一点",
    "上海2天周末散心，想要平衡一点",
    "成都3天城市漫游+公园喝茶",
    "杭州2天轻松 citywalk",
]


@pytest.mark.asyncio
@pytest.mark.parametrize("user_input", HARNESS_CASES)
async def test_generate_plan_returns_structured_itinerary(user_input: str):
    service = TravelService()
    plan = await service.generate_plan(user_input=user_input, preferences={"user_id": "tester"})

    assert plan.title
    assert plan.summary
    assert plan.rendered_markdown.startswith("#")
    assert len(plan.days) >= 1

    # 2.0: enriched_pois from Amap MCP
    assert plan.enriched_pois is not None
    # 2.0: planning score
    assert plan.planning_score is not None
    assert plan.planning_score.level in ("relaxed", "normal", "tight", "infeasible")
    # 2.0: model provider tracked
    assert plan.model_provider

    for day in plan.days:
        assert day.items, "each day should contain at least one item"
        for item in day.items:
            assert item.item_title
            assert item.start_time
            assert item.end_time
