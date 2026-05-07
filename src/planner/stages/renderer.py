"""Stage 7: Renderer — final structured itinerary assembly via LLM."""

from __future__ import annotations

import json
import logging
from typing import Any

from src.llm.model_router import router
from src.schemas.plan import (
    DayPlan, DayPlanItem, EnrichedPOI, FallbackPOI,
    HotelRecommendation, MCPToolCall, PlanningScore, RouteOption, RouteSegment,
    StructuredItinerary, TransportPlan, TravelIntent, WeatherDay,
)

logger = logging.getLogger(__name__)

RENDER_INSTRUCTIONS = """\
你是一个行程渲染专家。根据提供的 POI 池、路线方案、天气预报和可执行性评分，
生成一份完整的每日行程安排。

规则：
1. 每天安排合理数量的景点，考虑交通耗时
2. 穿插餐饮点（午餐、晚餐）
3. 根据天气调整（雨天用室内备选）
4. 每个行程项包含：时间段、地点、活动类型、交通方式
5. 生成整体标题和摘要
6. **重要**：每个 item 必须包含丰富的 notes、estimated_price、highlights、tips 字段
7. **重要**：每天必须包含 hotel 字段（住宿推荐）

每个 item 的字段要求：
- notes: 综合描述，包含门票/人均、亮点、小贴士（如"门票60元 | 必看太和殿 | 建议早上去人少"）
- estimated_price: 价格信息（如"免费"、"60元"、"人均80元"）
- highlights: 亮点/推荐（如"必看：太和殿、御花园"、"推荐：宫保鸡丁"）
- tips: 实用小贴士（如"建议早上去人少"、"周一闭馆"）

每天的 hotel 字段：
- name: 酒店名称
- address: 地址
- estimated_price: 预估价格（如"300-400元/晚"）
- star_rating: 档次（经济型/舒适型/豪华型）
- highlights: 位置优势（如"距故宫步行10分钟"）
- booking_tip: 预订建议（如"建议提前7天预订"）

输出 JSON:
{
  "title": "行程标题",
  "summary": "行程摘要",
  "risk_tips": "注意事项",
  "days": [
    {
      "day_number": 1,
      "title": "第一天标题",
      "items": [
        {
          "sequence_number": 1,
          "item_title": "景点名",
          "activity_type": "sightseeing",
          "address": "地址",
          "longitude": 116.39,
          "latitude": 39.90,
          "start_time": "09:00",
          "end_time": "11:30",
          "transport": {"from_poi":"出发","to_poi":"景点","mode":"subway","duration_minutes":30},
          "notes": "门票60元 | 必看太和殿、御花园 | 建议早上去人少",
          "estimated_price": "60元",
          "highlights": "必看：太和殿、御花园、珍宝馆",
          "tips": "建议早上8:30开门就进去，人少拍照好"
        }
      ],
      "hotel": {
        "name": "如家酒店(王府井店)",
        "address": "东城区王府井大街xxx号",
        "estimated_price": "300-400元/晚",
        "star_rating": "舒适型",
        "highlights": "距故宫步行15分钟，地铁直达",
        "booking_tip": "建议提前7天预订"
      }
    }
  ]
}
"""


async def render_itinerary(
    intent: TravelIntent,
    enriched_pois: list[EnrichedPOI],
    fallback_options: list[FallbackPOI],
    route_options: list[RouteOption],
    weather_forecast: list[WeatherDay],
    planning_score: PlanningScore,
    finance_summary: dict[str, Any] | None,
    transport_plan: TransportPlan | None = None,
    trace_id: str = "",
    prompt_version: str = "v2-mcp",
    mcp_tool_calls: list[MCPToolCall] | None = None,
    model_provider: str = "",
    hotels: list[dict[str, Any]] | None = None,
    meituan_context: str = "",
) -> StructuredItinerary:
    """Render the final structured itinerary using the main model."""
    poi_text = "\n".join(
        f"- [{p.poi_type}] {p.name} @ {p.address} ({p.longitude},{p.latitude}) ~{p.recommended_duration_minutes}min"
        + (f" 💰{p.estimated_price}" if p.estimated_price else "")
        + (f" ⭐{p.highlights}" if p.highlights else "")
        + (f" 💡{p.tips}" if p.tips else "")
        for p in enriched_pois[:25]
    )
    weather_text = "\n".join(
        f"- Day{w.day_number}: {w.weather} {w.temperature_high}/{w.temperature_low} {'☀户外OK' if w.is_outdoor_friendly else '🌧建议室内'}"
        for w in weather_forecast
    )
    route_text = "\n".join(
        f"- {r.from_poi}→{r.to_poi}: 推荐{r.recommended_mode} {r.recommended_duration_minutes}min"
        for r in route_options[:15]
    )
    fallback_text = "\n".join(f"- {f.name}: {f.reason}" for f in fallback_options[:5])

    hotel_text = ""
    if hotels:
        hotel_text = "\n\n酒店推荐（从POI选择阶段获得）:\n" + "\n".join(
            f"- {h.get('name', '')} | {h.get('estimated_price', '')} | {h.get('star_rating', '')} | {h.get('highlights', '')}"
            for h in hotels
        )

    prompt = (
        f"城市: {intent.city}, 天数: {intent.days}, 风格: {intent.travel_style}\n"
        f"预算: {intent.budget}, 出发地: {intent.departure_city or '本地'}\n"
        f"可执行性: {planning_score.level} — {planning_score.reasoning}\n\n"
        f"POI池:\n{poi_text}\n\n天气:\n{weather_text}\n\n路线:\n{route_text}\n\n备选:\n{fallback_text}"
        f"{hotel_text}"
        f"{meituan_context}"
    )

    result = await router.call_main(prompt=prompt, instructions=RENDER_INSTRUCTIONS)
    text = result["output_text"].strip()

    try:
        if "```" in text:
            text = text.split("```json")[-1].split("```")[0].strip()
        data = json.loads(text)
    except (json.JSONDecodeError, Exception):
        logger.warning("render parse failed, building minimal itinerary")
        data = {"title": f"{intent.city}{intent.days}天行程", "summary": "行程生成中", "risk_tips": "", "days": []}

    # Build DayPlan objects
    days: list[DayPlan] = []
    for d in data.get("days", []):
        items: list[DayPlanItem] = []
        for item in d.get("items", []):
            transport = None
            if item.get("transport"):
                t = item["transport"]
                transport = RouteSegment(
                    from_poi=t.get("from_poi", ""), to_poi=t.get("to_poi", ""),
                    mode=t.get("mode", ""), duration_minutes=int(t.get("duration_minutes", 0)),
                )
            items.append(DayPlanItem(
                sequence_number=int(item.get("sequence_number", 0)),
                item_title=item.get("item_title", ""),
                activity_type=item.get("activity_type", ""),
                address=item.get("address", ""),
                longitude=float(item.get("longitude", 0)),
                latitude=float(item.get("latitude", 0)),
                start_time=item.get("start_time", ""),
                end_time=item.get("end_time", ""),
                transport=transport,
                notes=item.get("notes", ""),
                estimated_price=item.get("estimated_price", ""),
                highlights=item.get("highlights", ""),
                tips=item.get("tips", ""),
            ))

        # Parse hotel recommendation
        hotel = None
        if d.get("hotel"):
            h = d["hotel"]
            hotel = HotelRecommendation(
                name=h.get("name", ""),
                address=h.get("address", ""),
                estimated_price=h.get("estimated_price", ""),
                star_rating=h.get("star_rating", ""),
                highlights=h.get("highlights", ""),
                booking_tip=h.get("booking_tip", ""),
            )

        weather_day = next((w for w in weather_forecast if w.day_number == d.get("day_number")), None)
        days.append(DayPlan(
            day_number=int(d.get("day_number", 0)),
            title=d.get("title", ""),
            weather=weather_day,
            items=items,
            hotel=hotel,
        ))

    # Build rendered markdown with table format
    md_lines = [f"# {data.get('title', '')}\n", f"> {data.get('summary', '')}\n"]

    for day in days:
        md_lines.append(f"\n## 📅 {day.title}\n")
        if day.weather:
            weather_icon = "☀️" if day.weather.is_outdoor_friendly else "🌧️"
            md_lines.append(f"**天气**: {weather_icon} {day.weather.weather} | 温度: {day.weather.temperature_high}°C / {day.weather.temperature_low}°C\n")

        # Create table header
        md_lines.append("| 时间 | 活动 | 地点 | 交通方式 | 备注 |")
        md_lines.append("|------|------|------|----------|------|")

        for item in day.items:
            time_range = f"{item.start_time}-{item.end_time}"
            activity_icons = {
                "sightseeing": "🏛️", "restaurant": "🍽️", "transport": "🚌",
                "shopping": "🛍️", "hotel": "🏨", "cafe": "☕"
            }
            icon = activity_icons.get(item.activity_type, "📍")
            activity = f"{icon} {item.item_title}"

            transport_info = ""
            if item.transport:
                transport_icons = {
                    "subway": "🚇", "bus": "🚌", "taxi": "🚕",
                    "walking": "🚶", "driving": "🚗", "bike": "🚲"
                }
                t_icon = transport_icons.get(item.transport.mode, "🚶")
                transport_info = f"{t_icon} {item.transport.mode} ({item.transport.duration_minutes}分钟)"
            else:
                transport_info = "—"

            address = item.address[:20] + "..." if len(item.address) > 20 else item.address
            notes = item.notes if item.notes else "—"
            md_lines.append(f"| **{time_range}** | {activity} | {address} | {transport_info} | {notes} |")

        # Hotel recommendation for the day
        if day.hotel:
            md_lines.append(f"\n🏨 **住宿推荐**: {day.hotel.name} | {day.hotel.estimated_price} | {day.hotel.highlights}")

        md_lines.append("")

    return StructuredItinerary(
        trace_id=trace_id, prompt_version=prompt_version,
        title=data.get("title", ""), summary=data.get("summary", ""),
        risk_tips=data.get("risk_tips", ""), rendered_markdown="\n".join(md_lines),
        days=days, enriched_pois=enriched_pois, fallback_options=fallback_options,
        route_options=route_options, weather_forecast=weather_forecast,
        planning_score=planning_score, model_provider=model_provider,
        mcp_tool_calls=mcp_tool_calls or [], finance_summary=finance_summary,
        transport_plan=transport_plan
    )
