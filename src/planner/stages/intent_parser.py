"""Stage 1: Intent Parser — lightweight extraction using flash model."""

from __future__ import annotations

import json
import logging

from src.llm.model_router import router
from src.schemas.plan import TravelIntent

logger = logging.getLogger(__name__)

INTENT_INSTRUCTIONS = """\
你是一个旅游意图解析器。从用户输入中提取旅行计划的关键信息。
严格按 JSON 格式输出，不要输出任何其他文字。

输出 JSON Schema:
{
  "city": "目的地城市",
  "start_point": "出发地点（如酒店、机场、火车站，未提及则为空）",
  "end_point": "结束地点（未提及则为空）",
  "days": 天数(整数),
  "budget": "low|medium|high|luxury",
  "interests": ["文化", "美食", ...],
  "travel_style": "relaxed|balanced|intensive",
  "crowd_type": "solo|couple|family|friends|elderly",
  "transport_preference": "walking|public|driving|mixed"
}
"""


async def parse_intent(user_input: str) -> TravelIntent:
    """Extract travel intent from user input using flash model."""
    result = await router.call_flash(
        prompt=f"用户输入: {user_input}",
        instructions=INTENT_INSTRUCTIONS,
    )
    text = result["output_text"].strip()

    # Try to extract JSON from the response
    try:
        # Handle potential markdown code blocks
        if "```" in text:
            text = text.split("```json")[-1].split("```")[0].strip()
            if not text:
                text = result["output_text"].split("```")[-2].strip()

        data = json.loads(text)
        intent = TravelIntent(**data)
    except (json.JSONDecodeError, Exception) as exc:
        logger.warning("intent parse failed, using defaults: %s", exc)
        # Fallback: extract city from input
        intent = TravelIntent(city=user_input.split("天")[0] if "天" in user_input else user_input[:10], days=3)

    logger.info("parsed intent: city=%s days=%d style=%s", intent.city, intent.days, intent.travel_style)
    return intent
