"""
搜索工具模块。

集成 Tavily Search 和 DuckDuckGo，实现具备 Fallback 机制的搜索功能。
"""

from langchain_community.tools import DuckDuckGoSearchResults
from config.settings import settings
import os

# 尝试导入 Tavily，如果未安装或无 Key 则使用 DuckDuckGo
try:
    if settings.TAVILY_API_KEY:
        from langchain_tavily import TavilySearchResults
        search_tool = TavilySearchResults(
            api_key=settings.TAVILY_API_KEY,
            max_results=8
        )
    else:
        raise ImportError("Tavily API Key not found")
except (ImportError, Exception):
    # 如果没有 Tavily Key 或库未安装，回退到 DuckDuckGo
    print("⚠️ 未检测到 Tavily API Key，已自动切换至 DuckDuckGo 搜索引擎")
    # 使用 DuckDuckGoSearchResults 并设置 max_results 以获取更多条目
    search_tool = DuckDuckGoSearchResults(max_results=26)


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
