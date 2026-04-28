"""MCP tool registry — builds tool definitions for Bailian Responses API."""

from __future__ import annotations

from src.config.settings import settings


def build_amap_mcp_tool() -> dict:
    """Build the Amap Maps MCP tool config for Bailian Responses API.

    Uses SSE protocol to connect to the Amap MCP Server (either Bailian-hosted
    or self-deployed).
    """
    tool: dict = {
        "type": "mcp",
        "server_label": "amap-maps",
        "server_description": (
            "高德地图 MCP 服务：地理编码、逆地理编码、POI 搜索、"
            "周边搜索、路径规划（步行/驾车/公交）、天气查询。"
        ),
    }
    if settings.AMAP_MCP_URL:
        # SSE mode — Bailian hosted or self-deployed endpoint
        tool["server_protocol"] = "sse"
        tool["server_url"] = settings.AMAP_MCP_URL
    else:
        # stdio mode — local npx fallback
        tool["server_protocol"] = "stdio"
        tool["command"] = "npx"
        tool["args"] = ["-y", "@amap/amap-maps-mcp-server"]
        tool["env"] = {"AMAP_MAPS_API_KEY": settings.AMAP_API_KEY}

    return tool


def build_yingmi_mcp_tool() -> dict:
    """Build the Yingmi Finance MCP tool config."""
    tool: dict = {
        "type": "mcp",
        "server_label": "yingmi-finance",
        "server_description": (
            "盈米金融数据 MCP：基金流动性查询、赎回时点提醒、"
            "低风险现金管理产品分类、资金规划辅助。"
        ),
    }
    if settings.YINGMI_MCP_URL:
        tool["server_protocol"] = "sse"
        tool["server_url"] = settings.YINGMI_MCP_URL
        if settings.YINGMI_API_KEY:
            tool["headers"] = {"Authorization": f"Bearer {settings.YINGMI_API_KEY}"}
    else:
        # Mock / placeholder — will be replaced when endpoint is available
        tool["server_protocol"] = "sse"
        tool["server_url"] = "http://localhost:9100/sse"

    return tool


def get_planning_tools() -> list[dict]:
    """Get MCP tools for travel planning (Amap only)."""
    return [build_amap_mcp_tool()]


def get_finance_tools() -> list[dict]:
    """Get MCP tools for finance advisory (Yingmi only)."""
    return [build_yingmi_mcp_tool()]


def get_all_tools() -> list[dict]:
    """Get all MCP tools (Amap + Yingmi)."""
    return [build_amap_mcp_tool(), build_yingmi_mcp_tool()]
