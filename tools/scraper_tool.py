"""
网页抓取工具。

使用 trafilatura 提取网页正文内容，支持深度搜索。
"""
import trafilatura
import httpx
from typing import Optional

async def scrape_url(url: str) -> Optional[str]:
    """
    抓取指定 URL 的网页正文内容。
    """
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=10.0) as client:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
            response = await client.get(url, headers=headers)
            if response.status_code == 200:
                # 使用 trafilatura 提取正文
                downloaded = response.text
                result = trafilatura.extract(downloaded, include_comments=False, include_tables=True)
                if result:
                    # 截断过长的内容，避免 Token 溢出 (由于现在抓取 10 个链接，每篇限制在 1500 字以内)
                    return result[:1500]
    except Exception as e:
        print(f"⚠️ 抓取 URL 失败 ({url}): {e}")
    
    return None
