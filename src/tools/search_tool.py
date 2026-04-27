"""
搜索工具模块。

集成 Tavily Search 和 DuckDuckGo，实现具备 Fallback 机制的搜索功能。
"""

from langchain_community.tools import DuckDuckGoSearchResults
from src.config.settings import settings
import os

# 尝试导入 Tavily
search_tool = None
if settings.TAVILY_API_KEY:
    try:
        # 强制注入环境变量，因为某些版本的 langchain-tavily 内部只读取环境变量
        os.environ["TAVILY_API_KEY"] = settings.TAVILY_API_KEY
        from langchain_tavily import TavilySearch as TavilySearchResults
        search_tool = TavilySearchResults(
            tavily_api_key=settings.TAVILY_API_KEY,
            max_results=8
        )
        print("[OK] 已成功加载 Tavily 搜索引擎组件")
    except ImportError:
        print("[WARN] 检测到 Tavily API Key，但未安装 'langchain-tavily' 库，已回退至 DuckDuckGo")
    except Exception as e:
        print(f"[WARN] Tavily 组件初始化失败: {e}，已回退至 DuckDuckGo")

if not search_tool:
    # 如果没有 Tavily 或初始化失败，回退到 DuckDuckGo
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
        if not search_tool:
            raise ValueError("搜索引擎未就绪")
            
        raw_result = search_tool.invoke(query)
        # 调试日志：查看原始返回内容
        print(f"--- Search Raw Result for '{query[:20]}...' ---")
        print(f"Type: {type(raw_result)}")
        
        # 统一处理结果列表
        results_list = []
        if isinstance(raw_result, list):
            results_list = raw_result
        elif isinstance(raw_result, dict) and "results" in raw_result:
            results_list = raw_result["results"]
        
        if results_list:
            formatted_results = []
            for item in results_list:
                if isinstance(item, dict):
                    # 模拟 DuckDuckGo 的格式，确保 researcher.py 中的正则能匹配到 link:
                    snippet = item.get("content", item.get("snippet", item.get("text", "")))
                    link = item.get("url", item.get("link", ""))
                    title = item.get("title", "")
                    formatted_results.append(f"[snippet: {snippet}, link: {link}, title: {title}]")
                else:
                    formatted_results.append(str(item))
            return ", ".join(formatted_results)
        
        # 如果既不是列表也不是带 results 的字典，则直接转字符串
        return str(raw_result)
    except Exception as e:
        print(f"[ERROR] 搜索执行失败: {e}")
        # 尝试使用 DuckDuckGo 进行兜底
        try:
            print(f"[INFO] 正在尝试使用 DuckDuckGo 兜底搜索: {query}")
            from langchain_community.tools import DuckDuckGoSearchResults
            ddg = DuckDuckGoSearchResults(max_results=10)
            return ddg.invoke(query)
        except Exception as ddg_e:
            return f"搜索彻底失败: {str(e)} | DDG 错误: {str(ddg_e)}"
