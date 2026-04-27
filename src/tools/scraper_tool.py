"""
网页抓取工具。

使用 trafilatura 提取网页正文内容，支持深度搜索。
"""
import trafilatura
import httpx
from typing import Optional

def clean_text(text: str) -> str:
    """
    暴力清洗网页内容，剔除常见的导航、页脚、广告语等噪音。
    """
    if not text:
        return ""
    
    noise_keywords = [
        "登录", "注册", "我的订单", "关于我们", "隐私政策", "服务协议", 
        "联系我们", "下载App", "关注我们", "版权所有", "Copyright", 
        "商务合作", "招聘", "友情链接", "手机版", "电脑版", "返回顶部"
    ]
    
    lines = text.split("\n")
    cleaned_lines = []
    for line in lines:
        line = line.strip()
        # 长度过滤：太短的行通常是导航标签
        if len(line) < 5:
            continue
        # 关键词过滤
        if any(keyword in line for keyword in noise_keywords):
            continue
        cleaned_lines.append(line)
    
    return "\n".join(cleaned_lines)


async def scrape_url(url: str) -> Optional[str]:
    """
    抓取指定 URL 的网页正文内容并进行深度清洗。
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
                    # 深度清洗
                    cleaned_result = clean_text(result)
                    # 截断过长的内容，避免 Token 溢出
                    return cleaned_result[:1500]
    except Exception as e:
        print(f"⚠️ 抓取 URL 失败 ({url}): {e}")
    
    return None
