"""MCP tool registry — builds tool definitions for Bailian Responses API."""

from __future__ import annotations

from src.config.settings import settings


def build_amap_mcp_tool() -> dict:
    """Build the Amap Maps MCP tool config."""
    return {
        "type": "mcp",
        "server_label": "amap-maps",
        "server_description": (
            "高德地图服务：用于地理编码（获取经纬度）、搜索景点、"
            "规划路径（驾车、步行、公交）以及查询天气。"
        ),
        "server_url": settings.AMAP_MCP_URL,
        "api_key": settings.AMAP_API_KEY
    }


def build_yingmi_mcp_tool() -> dict:
    """Build the Yingmi Finance (Qieman) MCP tool config."""
    return {
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


def get_planning_tools() -> list[dict]:
    """Get MCP tools for travel planning (Amap only)."""
    return [build_amap_mcp_tool()]


def get_finance_tools() -> list[dict]:
    """Get MCP tools for finance advisory (Yingmi only)."""
    return [build_yingmi_mcp_tool()]


def get_all_tools() -> list[dict]:
    """Get all MCP tools (Amap + Yingmi)."""
    return [build_amap_mcp_tool(), build_yingmi_mcp_tool()]
