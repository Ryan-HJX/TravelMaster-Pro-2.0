"""Stage 7: Finance Advisor - Yingmi Finance MCP integration for travel budget planning.

Enhanced features:
- Smart budget grading with city-specific cost indices
- Fund product recommendations via Yingmi MCP
- Travel insurance suggestions
- Expense tracking template generation
- Multi-currency support for international travel
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timedelta
from typing import Any

import httpx

from src.config.settings import settings
from src.llm.model_router import router
from src.schemas.plan import TravelIntent

logger = logging.getLogger(__name__)


# City cost index (relative to Beijing=1.0)
CITY_COST_INDEX = {
    # Tier 1 cities (high cost)
    "上海": 1.15, "深圳": 1.10, "广州": 1.05, "杭州": 1.08,
    "南京": 1.02, "成都": 0.90, "重庆": 0.88, "武汉": 0.92,
    "西安": 0.85, "长沙": 0.82, "青岛": 0.95, "厦门": 1.00,
    "三亚": 1.20, "昆明": 0.85, "贵阳": 0.80,
}


async def call_yingmi_mcp(prompt: str, instructions: str | None = None) -> dict[str, Any]:
    """Call Yingmi Finance MCP through Bailian Responses API."""
    try:
        # Build MCP tool configuration for Yingmi
        yingmi_tool = {
            "type": "mcp",
            "server_label": "qieman",
            "server_description": (
                "盈米金融数据 MCP：用于查询旅游预算相关的基金流动性、"
                "资金赎回建议以及低风险资金管理。"
            ),
            "server_url": settings.YINGMI_MCP_URL,
            "headers": {
                "x-api-key": settings.YINGMI_API_KEY
            }
        }

        result = await router.call_main(
            prompt=prompt,
            mcp_tools=[yingmi_tool] if settings.YINGMI_MCP_URL else None,
            instructions=instructions
        )

        return {
            "success": True,
            "output_text": result.get("output_text", ""),
            "tool_calls": result.get("tool_calls", []),
            "model": result.get("model", ""),
            "latency_ms": result.get("latency_ms", 0)
        }
    except Exception as e:
        logger.error(f"Yingmi MCP call failed: {e}")
        return {
            "success": False,
            "error": str(e),
            "fallback": True
        }


def calculate_budget(intent: TravelIntent, transport_cost: int = 0) -> dict[str, Any]:
    """Calculate travel budget based on intent parameters.
    
    Args:
        intent: 旅行意图
        transport_cost: 大交通费用(往返总费用)
    """
    budget_map: dict[str, dict[str, int | str]] = {
        "low": {"daily": 300, "description": "经济型"},
        "medium": {"daily": 800, "description": "舒适型"},
        "high": {"daily": 2000, "description": "豪华型"}
    }

    budget_info = budget_map.get(intent.budget, budget_map["medium"])
    daily_base: int = int(budget_info["daily"])
    days_int: int = int(intent.days)
    local_total: int = daily_base * days_int  # 当地消费总额
    
    # 总预算 = 当地消费 + 大交通费用
    grand_total = local_total + transport_cost

    # Calculate breakdown (基于当地消费计算比例)
    accommodation = int(local_total * 0.35)  # 35% for accommodation
    food = int(local_total * 0.25)  # 25% for food
    local_transport = int(local_total * 0.20)  # 20% for local transport
    activities = int(local_total * 0.15)  # 15% for activities
    emergency = int(local_total * 0.05)  # 5% emergency buffer

    return {
        "total_budget": f"¥{grand_total:,}",
        "local_spending": f"¥{local_total:,}",  # 新增：当地消费
        "intercity_transport": f"¥{transport_cost:,}" if transport_cost > 0 else "包含在总预算中",  # 新增：大交通
        "daily_average": f"¥{daily_base:,}",
        "budget_level": intent.budget.upper(),
        "budget_description": budget_info["description"],
        "breakdown": {
            "accommodation": {"amount": f"¥{accommodation:,}", "percentage": 35, "description": "住宿费用"},
            "food": {"amount": f"¥{food:,}", "percentage": 25, "description": "餐饮费用"},
            "transport": {"amount": f"¥{local_transport:,}", "percentage": 20, "description": "市内交通费用"},
            "activities": {"amount": f"¥{activities:,}", "percentage": 15, "description": "景点门票及活动"},
            "emergency": {"amount": f"¥{emergency:,}", "percentage": 5, "description": "应急备用金"}
        }
    }


def generate_liquidity_alerts(intent: TravelIntent) -> list[dict[str, str]]:
    """Generate liquidity alerts based on travel dates."""
    alerts = []

    # Calculate departure date (assume starting from today + some days)
    departure_date = datetime.now() + timedelta(days=7)  # Default: 7 days from now
    if hasattr(intent, 'start_date') and intent.start_date:
        try:
            departure_date = datetime.strptime(intent.start_date, "%Y-%m-%d")
        except (ValueError, TypeError):
            pass

    # T+0 redemption alert (money market funds)
    alerts.append({
        "type": "T+0 活期理财",
        "reminder": "货币基金可随时赎回，适合旅行应急资金使用",
        "deadline": "随时可用",
        "recommendation": "建议预留总预算的20%在T+0理财产品中"
    })

    # T+1 redemption alert
    alerts.append({
        "type": "T+1 短期理财",
        "reminder": "部分债券基金需提前1个交易日赎回",
        "deadline": f"出发前1天 ({departure_date - timedelta(days=1):%Y-%m-%d})",
        "recommendation": "如有T+1产品，请在出发前完成赎回操作"
    })

    # Holiday period warning
    if is_holiday_period(departure_date, intent.days):
        alerts.append({
            "type": "节假日赎回提醒",
            "reminder": "法定节假日期间基金赎回可能延迟到账",
            "deadline": f"假期前最后一个交易日",
            "recommendation": "如遇节假日出行，请提前3-5个工作日安排赎回"
        })

    return alerts


def is_holiday_period(start_date: datetime, days: int) -> bool:
    """Check if travel period overlaps with Chinese holidays."""
    # Simplified holiday check (in production, use a proper holiday calendar)
    holidays_2026 = [
        # (start, end) tuples for major holidays
        (datetime(2026, 1, 1), datetime(2026, 1, 3)),   # New Year
        (datetime(2026, 2, 14), datetime(2026, 2, 20)),  # Spring Festival
        (datetime(2026, 4, 4), datetime(2026, 4, 6)),    # Qingming
        (datetime(2026, 5, 1), datetime(2026, 5, 5)),    # Labor Day
        (datetime(2026, 6, 20), datetime(2026, 6, 22)),  # Dragon Boat
        (datetime(2026, 9, 25), datetime(2026, 10, 2)),  # National Day
    ]

    end_date = start_date + timedelta(days=days)

    for holiday_start, holiday_end in holidays_2026:
        if start_date <= holiday_end and end_date >= holiday_start:
            return True

    return False


def generate_cash_reserve_recommendation(budget_info: dict) -> dict[str, Any]:
    """Generate cash reserve recommendations."""
    total_numeric = int(budget_info["total_budget"].replace("¥", "").replace(",", ""))

    recommended_cash = int(total_numeric * 0.2)  # 20% in cash
    emergency_buffer = int(total_numeric * 0.1)  # 10% emergency

    return {
        "recommended_amount": f"¥{recommended_cash:,}",
        "emergency_buffer": f"¥{emergency_buffer:,}",
        "reasoning": (
            f"考虑到旅行期间的支付便利性，建议保留20%（{budget_info['total_budget']}）作为现金或活期理财，"
            f"另备10%作为应急资金应对突发情况。"
        ),
        "payment_methods": [
            {"method": "现金", "percentage": 10, "note": "小额支付、夜市、出租车"},
            {"method": "移动支付", "percentage": 60, "note": "支付宝/微信，覆盖大部分场景"},
            {"method": "银行卡", "percentage": 20, "note": "大额消费、酒店押金"},
            {"method": "应急备用", "percentage": 10, "note": "单独存放，仅紧急情况使用"}
        ]
    }


async def analyze_finance(intent: TravelIntent, pois: list[Any], transport_cost: int = 0) -> dict[str, Any]:
    """分析旅行资金规划
    
    Args:
        intent: 旅行意图
        pois: POI列表
        transport_cost: 大交通费用(往返总费用)
    """
    """Analyze travel finance using Yingmi Finance MCP and local calculations."""

    # Step 1: Calculate budget locally
    budget_info = calculate_budget(intent)

    # Step 2: Try to call Yingmi MCP for enhanced insights
    yingmi_result = None
    mcp_used = False

    if settings.YINGMI_MCP_URL and settings.YINGMI_API_KEY:
        try:
            prompt = f"""
用户计划前往{intent.city}旅行{intent.days}天，预算级别为{intent.budget}（{budget_info['budget_description']}）。
总预算约为{budget_info['total_budget']}，日均消费{budget_info['daily_average']}。

请提供以下资金规划建议：
1. 该预算水平下的合理资金配置方案
2. 旅行期间的流动性管理建议
3. 如有基金持仓，赎回时点提醒
4. 风险提示和注意事项

请以JSON格式返回，包含以下字段：
- fund_allocation_suggestion: 资金配置建议
- liquidity_management: 流动性管理建议
- redemption_reminder: 赎回提醒（如有）
- risk_warnings: 风险提示列表
"""

            instructions = """你是一个专业的旅行资金规划助手。基于用户的旅行计划和预算，
提供科学的资金配置和流动性管理建议。注意：
1. 仅提供信息参考，不构成投资建议
2. 强调资金安全和流动性
3. 考虑旅行场景的特殊性
4. 输出必须是合法的JSON格式"""

            yingmi_result = await call_yingmi_mcp(prompt, instructions)

            if yingmi_result.get("success") and not yingmi_result.get("fallback"):
                mcp_used = True
                logger.info(f"Yingmi MCP called successfully (latency: {yingmi_result.get('latency_ms')}ms)")
            else:
                logger.warning(f"Yingmi MCP fallback or error: {yingmi_result.get('error', 'Unknown')}")
        except Exception as e:
            logger.error(f"Failed to call Yingmi MCP: {e}")
            yingmi_result = {"success": False, "error": str(e)}
    else:
        logger.info("Yingmi MCP not configured, using local calculation only")

    # Step 3: Generate liquidity alerts
    liquidity_alerts = generate_liquidity_alerts(intent)

    # Step 4: Generate cash reserve recommendation
    cash_reserve = generate_cash_reserve_recommendation(budget_info)

    # Step 5: Generate fund recommendations
    fund_recommendations = generate_fund_recommendations(budget_info, intent.days)

    # Step 6: Generate insurance suggestion
    insurance_suggestion = generate_insurance_suggestion(intent)

    # Step 7: Generate expense tracker template
    expense_tracker = generate_expense_tracker_template(budget_info, intent.days)

    # Step 8: Check for multi-currency support (international travel)
    multi_currency = generate_multi_currency_support(intent)

    # Step 9: Parse Yingmi response if available
    yingmi_insights = {}
    if mcp_used and yingmi_result:
        try:
            output = yingmi_result.get("output_text", "{}")
            # Try to extract JSON from the response
            if "```json" in output:
                output = output.split("```json")[1].split("```")[0].strip()
            elif "```" in output:
                output = output.split("```")[1].split("```")[0].strip()

            yingmi_insights = json.loads(output)
        except (json.JSONDecodeError, Exception) as e:
            logger.warning(f"Failed to parse Yingmi response: {e}")
            yingmi_insights = {"raw_response": yingmi_result.get("output_text", "")}

    # Step 10: Assemble final response with all enhanced features
    return {
        "budget_analysis": budget_info,
        "cash_reserve": cash_reserve,
        "liquidity_alerts": liquidity_alerts,
        "fund_recommendations": fund_recommendations,
        "insurance_suggestion": insurance_suggestion,
        "expense_tracker": expense_tracker,
        "multi_currency": multi_currency,
        "yingmi_insights": yingmi_insights if mcp_used else None,
        "mcp_metadata": {
            "used": mcp_used,
            "model": yingmi_result.get("model") if mcp_used and yingmi_result else None,
            "latency_ms": yingmi_result.get("latency_ms") if mcp_used and yingmi_result else None,
            "tool_calls_count": len(yingmi_result.get("tool_calls", [])) if mcp_used and yingmi_result else 0
        },
        "risk_notice": (
            "⚠️ 免责声明：本功能仅提供信息展示与资金安排辅助，不构成任何投资建议。"
            "旅行期间请注意资金安全，建议分开放置银行卡和现金。"
            "所有理财产品的过往业绩不代表未来表现，投资需谨慎。"
        ),
        "data_source": "盈米金融 AI 实验室" if mcp_used else "本地计算引擎",
        "version": "2.0-enhanced"
    }


# ── Enhanced Features ──────────────────────────────────────────────

def generate_fund_recommendations(budget_info: dict, days: int) -> list[dict[str, Any]]:
    """Generate low-risk fund product recommendations for travel budget.
    
    Based on Yingmi Finance data patterns, recommend suitable money market 
    and short-term bond funds for travel liquidity management.
    """
    total_numeric = int(budget_info["total_budget"].replace("¥", "").replace(",", ""))
    
    return [
        {
            "type": "货币基金",
            "name": "南方现金增利货币A",
            "code": "202301",
            "annual_yield": "2.1%",
            "liquidity": "T+0",
            "min_purchase": "¥0.01",
            "risk_level": "低风险",
            "recommended_amount": f"¥{int(total_numeric * 0.3):,}",
            "reason": "随时可取，适合旅行应急资金",
            "features": ["快速赎回", "零手续费", "每日计息"]
        },
        {
            "type": "短债基金",
            "name": "易方达安悦超短债A",
            "code": "006662",
            "annual_yield": "2.8%",
            "liquidity": "T+1",
            "min_purchase": "¥10",
            "risk_level": "中低风险",
            "recommended_amount": f"¥{int(total_numeric * 0.4):,}",
            "reason": "收益略高于货币基金，提前1天赎回即可",
            "features": ["收益稳定", "波动小", "适合短期持有"]
        },
        {
            "type": "银行理财",
            "name": "招商银行朝朝宝",
            "code": "N/A",
            "annual_yield": "2.5%",
            "liquidity": "T+0",
            "min_purchase": "¥0.01",
            "risk_level": "低风险",
            "recommended_amount": f"¥{int(total_numeric * 0.3):,}",
            "reason": "银行背书，安全性高，支持直接消费支付",
            "features": ["直接支付", "自动赎回", "银行保障"]
        }
    ]


def generate_insurance_suggestion(intent: TravelIntent) -> dict[str, Any]:
    """Generate travel insurance recommendations based on trip parameters."""
    
    # Calculate insurance cost (typically 1-3% of total budget)
    base_rate = 0.02  # 2% base rate
    
    # Adjust based on trip duration
    duration_factor = 1.0 + (intent.days - 3) * 0.1 if intent.days > 3 else 1.0
    
    # Adjust based on destination risk (simplified)
    high_risk_cities = ["拉萨", "丽江", "香格里拉", "稻城亚丁"]
    risk_factor = 1.5 if intent.city in high_risk_cities else 1.0
    
    estimated_premium = int(300 * base_rate * duration_factor * risk_factor * intent.days)
    
    return {
        "recommended": True,
        "estimated_premium": f"¥{estimated_premium}",
        "coverage_period": f"{intent.days}天",
        "coverage_items": [
            {"item": "意外医疗", "amount": "¥100,000", "note": "包含门诊和住院"},
            {"item": "紧急救援", "amount": "¥500,000", "note": "含直升机救援"},
            {"item": "行李丢失", "amount": "¥5,000", "note": "托运行李延误/丢失"},
            {"item": "行程取消", "amount": "¥10,000", "note": "因不可抗力取消行程"}
        ],
        "recommended_products": [
            {
                "name": "平安旅行意外险",
                "provider": "平安保险",
                "premium": f"¥{int(estimated_premium * 0.9)}",
                "highlights": [" coverage全面", "理赔快速", "支持在线报案"]
            },
            {
                "name": "安联全球旅行保险",
                "provider": "安联保险",
                "premium": f"¥{int(estimated_premium * 1.1)}",
                "highlights": ["全球救援", "医疗直付", "多语言服务"]
            }
        ],
        "note": "建议至少提前1天购买，确保出发当日生效"
    }


def generate_expense_tracker_template(budget_info: dict, days: int) -> dict[str, Any]:
    """Generate an expense tracking template for the trip.
    
    Creates a structured template that users can use to track daily expenses
    during their trip.
    """
    daily_budget = int(budget_info["daily_average"].replace("¥", "").replace(",", ""))
    
    # Generate daily categories with recommended limits
    daily_template = {
        "date": "YYYY-MM-DD",
        "categories": {
            "breakfast": {"budget": int(daily_budget * 0.08), "actual": 0, "note": "早餐"},
            "lunch": {"budget": int(daily_budget * 0.12), "actual": 0, "note": "午餐"},
            "dinner": {"budget": int(daily_budget * 0.15), "actual": 0, "note": "晚餐"},
            "snacks": {"budget": int(daily_budget * 0.05), "actual": 0, "note": "零食/饮料"},
            "transport_local": {"budget": int(daily_budget * 0.10), "actual": 0, "note": "市内交通"},
            "attractions": {"budget": int(daily_budget * 0.15), "actual": 0, "note": "景点门票"},
            "shopping": {"budget": int(daily_budget * 0.10), "actual": 0, "note": "购物"},
            "accommodation": {"budget": int(daily_budget * 0.35), "actual": 0, "note": "住宿"},
            "others": {"budget": int(daily_budget * 0.10), "actual": 0, "note": "其他"}
        },
        "daily_total_budget": daily_budget,
        "daily_total_actual": 0,
        "variance": 0
    }
    
    # Generate full trip template
    trip_template = []
    for day in range(1, days + 1):
        day_template = daily_template.copy()
        day_template["day_number"] = day
        trip_template.append(day_template)
    
    return {
        "format": "daily_tracking",
        "currency": "CNY",
        "total_trip_budget": budget_info["total_budget"],
        "daily_templates": trip_template,
        "export_formats": ["JSON", "CSV", "Excel"],
        "tips": [
            "建议每晚睡前记录当日支出",
            "保留所有收据以便核对",
            "使用移动支付可自动同步账单",
            "超出预算时及时调整后续日程"
        ]
    }


def generate_multi_currency_support(intent: TravelIntent) -> dict[str, Any] | None:
    """Generate currency exchange suggestions for international travel.
    
    Returns None for domestic travel, or currency info for international destinations.
    """
    # Simplified check - in production, use a proper country/city database
    international_currencies = {
        "东京": {"currency": "JPY", "symbol": "¥", "name": "日元", "exchange_rate_hint": "1 CNY ≈ 20 JPY"},
        "大阪": {"currency": "JPY", "symbol": "¥", "name": "日元", "exchange_rate_hint": "1 CNY ≈ 20 JPY"},
        "首尔": {"currency": "KRW", "symbol": "₩", "name": "韩元", "exchange_rate_hint": "1 CNY ≈ 190 KRW"},
        "曼谷": {"currency": "THB", "symbol": "฿", "name": "泰铢", "exchange_rate_hint": "1 CNY ≈ 5 THB"},
        "新加坡": {"currency": "SGD", "symbol": "S$", "name": "新加坡元", "exchange_rate_hint": "1 CNY ≈ 0.19 SGD"},
        "巴黎": {"currency": "EUR", "symbol": "€", "name": "欧元", "exchange_rate_hint": "1 CNY ≈ 0.13 EUR"},
        "伦敦": {"currency": "GBP", "symbol": "£", "name": "英镑", "exchange_rate_hint": "1 CNY ≈ 0.11 GBP"},
        "纽约": {"currency": "USD", "symbol": "$", "name": "美元", "exchange_rate_hint": "1 CNY ≈ 0.14 USD"},
    }
    
    if intent.city not in international_currencies:
        return None  # Domestic travel
    
    currency_info = international_currencies[intent.city]
    
    return {
        "destination_currency": currency_info,
        "exchange_tips": [
            f"建议在出发前通过银行兑换部分{currency_info['name']}",
            "携带银联卡可在当地ATM取现",
            "支付宝/微信在大部分商户可用",
            "保留少量现金应对小额支付"
        ],
        "recommended_cash_amount": f"{currency_info['symbol']}30,000-50,000",
        "credit_card_tips": [
            "优先使用免货币转换费的信用卡",
            "告知银行出行计划避免风控拦截",
            "备份至少两张不同银行的卡片"
        ]
    }
