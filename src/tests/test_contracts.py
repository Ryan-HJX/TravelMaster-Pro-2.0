from src.schemas.plan import CompatPlanRequest


def test_compat_request_normalization():
    request = CompatPlanRequest(query="上海2天美食游", preferences={"user_id": "demo-user"})
    assert request.normalized_input() == "上海2天美食游"
    assert request.normalized_user_id() == "demo-user"
