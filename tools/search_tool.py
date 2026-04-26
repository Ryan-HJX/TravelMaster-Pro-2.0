"""
搜索工具模块。

集成 Tavily Search 和 DuckDuckGo，实现具备 Fallback 机制的搜索功能。
"""

from langchain_community.tools import DuckDuckGoSearchRun
from config.settings import settings
import os

# 尝试导入 Tavily，如果未安装或无 Key 则使用 DuckDuckGo
try:
    if settings.TAVILY_API_KEY:
        from langchain_tavily import TavilySearchResults
        search_tool = TavilySearchResults(
            api_key=settings.TAVILY_API_KEY,
            max_results=5
        )
    else:
        raise ImportError("Tavily API Key not found")
except (ImportError, Exception):
    # 如果没有 Tavily Key 或库未安装，回退到 DuckDuckGo
    print("⚠️ 未检测到 Tavily API Key，已自动切换至 DuckDuckGo 搜索引擎")
    search_tool = DuckDuckGoSearchRun()


def run_search(query: str) -> str:
    """
    执行搜索任务。
    
    Args:
        query: 搜索关键词。
        
    Returns:
        str: 搜索结果摘要。
    """
    try:
        return search_tool.invoke(query)
    except Exception as e:
        return f"搜索失败: {str(e)}"
