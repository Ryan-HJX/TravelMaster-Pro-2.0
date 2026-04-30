"""
Stage 8: Inter-city Transport Planner (新增：大交通规划)
根据出发地和目的地，规划往返大交通方案（飞机/火车）
"""
from __future__ import annotations

import asyncio
from datetime import datetime, timedelta
from typing import TypedDict

from src.schemas.plan import TravelIntent, TransportPlan, InterCityTransport
from src.config.settings import settings


class FlightData(TypedDict):
    carrier: str
    flight_number: str
    duration: float
    price: int


# 模拟航班/火车数据（实际应接入携程/12306 API）
FLIGHT_DATABASE: dict[str, list[FlightData]] = {
    "北京-上海": [
        {"carrier": "中国国航", "flight_number": "CA1831", "duration": 2.5, "price": 800},
        {"carrier": "东方航空", "flight_number": "MU5101", "duration": 2.3, "price": 750},
    ],
    "上海-北京": [
        {"carrier": "中国国航", "flight_number": "CA1832", "duration": 2.5, "price": 850},
        {"carrier": "东方航空", "flight_number": "MU5102", "duration": 2.3, "price": 800},
    ],
}

TRAIN_DATABASE: dict[str, list[FlightData]] = {
    "北京-上海": [
        {"carrier": "铁路局", "flight_number": "G2", "duration": 4.5, "price": 650},
        {"carrier": "铁路局", "flight_number": "G4", "duration": 5.0, "price": 600},
    ],
    "上海-北京": [
        {"carrier": "铁路局", "flight_number": "G3", "duration": 4.5, "price": 650},
        {"carrier": "铁路局", "flight_number": "G5", "duration": 5.0, "price": 600},
    ],
}


async def plan_intercity_transport(
    intent: TravelIntent,
) -> TransportPlan:
    """
    规划城际大交通方案

    Args:
        intent: 旅行意图，包含 departure_city, city(目的地), start_date, end_date

    Returns:
        TransportPlan: 包含往返交通方案
    """
    if not intent.departure_city or intent.departure_city == intent.city:
        # 没有出发地或出发地=目的地，不需要大交通
        return TransportPlan()

    print(f"🚄 [大交通规划] 从 {intent.departure_city} 到 {intent.city}")

    # 生成去程和返程方案
    outbound = await _generate_one_way(
        intent.departure_city,
        intent.city,
        intent.start_date,
        intent.budget,
        is_outbound=True,
    )

    return_trip = await _generate_one_way(
        intent.city,
        intent.departure_city,
        intent.end_date,
        intent.budget,
        is_outbound=False,
    )

    total_cost = (outbound.price_estimate if outbound else 0) + (
        return_trip.price_estimate if return_trip else 0
    )

    recommendations = _generate_recommendations(outbound, return_trip, intent.days)

    return TransportPlan(
        outbound=outbound,
        return_trip=return_trip,
        total_cost=total_cost,
        recommendations=recommendations,
    )


async def _generate_one_way(
    from_city: str,
    to_city: str,
    travel_date: str,
    budget: str,
    is_outbound: bool,
) -> InterCityTransport | None:
    """生成单程交通方案"""
    if not travel_date:
        return None

    route_key = f"{from_city}-{to_city}"

    # 根据预算选择交通方式
    if budget == "low":
        # 经济型：优先火车
        transport = await _search_train(route_key, travel_date, is_outbound)
    elif budget == "high":
        # 豪华型：优先飞机
        transport = await _search_flight(route_key, travel_date, is_outbound)
    else:
        # 舒适型：比较飞机和火车，推荐性价比高的
        flight = await _search_flight(route_key, travel_date, is_outbound)
        train = await _search_train(route_key, travel_date, is_outbound)

        if flight and train:
            # 如果时间差<2小时且价格差<200，推荐火车（更稳定）
            time_diff = abs(flight.duration_hours - train.duration_hours)
            price_diff = abs(flight.price_estimate - train.price_estimate)
            transport = train if (time_diff < 2 and price_diff < 200) else flight
        else:
            transport = flight or train

    return transport


async def _search_flight(
    route_key: str, travel_date: str, is_outbound: bool
) -> InterCityTransport | None:
    """查询航班（模拟数据，实际应接入航司API）"""
    flights = FLIGHT_DATABASE.get(route_key, [])
    if not flights:
        # 如果没有直达航班，返回None
        return None

    # 选择最便宜的航班
    best_flight = min(flights, key=lambda x: float(x["price"]))

    # 生成出发/到达时间
    flight_duration = float(best_flight["duration"])
    if is_outbound:
        departure_time = f"{travel_date} 08:00"
        arrival_dt = datetime.strptime(departure_time, "%Y-%m-%d %H:%M") + timedelta(
            hours=flight_duration
        )
        arrival_time = arrival_dt.strftime("%Y-%m-%d %H:%M")
    else:
        # 返程通常在下午/晚上
        departure_time = f"{travel_date} 18:00"
        arrival_dt = datetime.strptime(departure_time, "%Y-%m-%d %H:%M") + timedelta(
            hours=flight_duration
        )
        arrival_time = arrival_dt.strftime("%Y-%m-%d %H:%M")

    return InterCityTransport(
        mode="flight",
        departure_city=route_key.split("-")[0],
        arrival_city=route_key.split("-")[1],
        departure_time=departure_time,
        arrival_time=arrival_time,
        duration_hours=flight_duration,
        price_estimate=int(best_flight["price"]),
        carrier=str(best_flight["carrier"]),
        flight_number=str(best_flight["flight_number"]),
        booking_tips="建议提前7天预订，可获得更低价格",
    )


async def _search_train(
    route_key: str, travel_date: str, is_outbound: bool
) -> InterCityTransport | None:
    """查询火车（模拟数据，实际应接入12306 API）"""
    trains = TRAIN_DATABASE.get(route_key, [])
    if not trains:
        return None

    # 选择最快的高铁
    best_train = min(trains, key=lambda x: float(x["duration"]))

    train_duration = float(best_train["duration"])
    if is_outbound:
        departure_time = f"{travel_date} 09:00"
        arrival_dt = datetime.strptime(departure_time, "%Y-%m-%d %H:%M") + timedelta(
            hours=train_duration
        )
        arrival_time = arrival_dt.strftime("%Y-%m-%d %H:%M")
    else:
        departure_time = f"{travel_date} 16:00"
        arrival_dt = datetime.strptime(departure_time, "%Y-%m-%d %H:%M") + timedelta(
            hours=train_duration
        )
        arrival_time = arrival_dt.strftime("%Y-%m-%d %H:%M")

    return InterCityTransport(
        mode="train",
        departure_city=route_key.split("-")[0],
        arrival_city=route_key.split("-")[1],
        departure_time=departure_time,
        arrival_time=arrival_time,
        duration_hours=train_duration,
        price_estimate=int(best_train["price"]),
        carrier=str(best_train["carrier"]),
        flight_number=str(best_train["flight_number"]),
        booking_tips="高铁票紧张，建议提前15天在12306预订",
    )


def _generate_recommendations(
    outbound: InterCityTransport | None,
    return_trip: InterCityTransport | None,
    trip_days: int,
) -> list[str]:
    """生成交通建议"""
    recommendations = []

    if outbound and outbound.mode == "flight":
        recommendations.append("✈️ 去程选择飞机，建议提前2小时到达机场办理登机手续")
    elif outbound and outbound.mode == "train":
        recommendations.append("🚄 去程选择高铁，建议提前30分钟到达车站")

    if return_trip and return_trip.mode == "flight":
        recommendations.append("✈️ 返程选择飞机，注意预留充足时间前往机场")
    elif return_trip and return_trip.mode == "train":
        recommendations.append("🚄 返程选择高铁，车站通常位于市区，交通便利")

    if outbound and return_trip:
        total_hours = outbound.duration_hours + return_trip.duration_hours
        if total_hours > 8:
            recommendations.append(
                f"⏰ 往返路途共需{total_hours:.1f}小时，建议在行程中预留休息时间"
            )

    if trip_days <= 3:
        recommendations.append(
            "📅 短途旅行建议选择早班去程和晚班返程，最大化游玩时间"
        )

    return recommendations
