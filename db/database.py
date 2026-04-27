"""
数据库初始化与管理模块。

使用 aiosqlite 实现异步 SQLite 操作，负责创建表结构及提供基础的读写接口。
"""

import aiosqlite
import os
from config.settings import settings

# 获取数据库文件的绝对路径
db_path = settings.DATABASE_URL.replace("sqlite:///", "")
if not os.path.isabs(db_path):
    # 如果是相对路径，则基于当前工作目录解析
    db_path = os.path.join(os.getcwd(), db_path)


async def init_db():
    """
    初始化数据库表结构。

    如果表不存在，则创建 Users 和 Itineraries 表。
    - Users: 存储用户 ID 及其偏好设置（JSON 格式）。
    - Itineraries: 存储生成的行程单内容。
    """
    async with aiosqlite.connect(db_path) as db:
        # 创建用户表
        await db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id TEXT PRIMARY KEY,
                preferences TEXT,  -- 存储 JSON 格式的偏好，如：{"budget": "high", "likes": ["history"]}
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 创建行程表
        await db.execute("""
            CREATE TABLE IF NOT EXISTS itineraries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                title TEXT,
                content TEXT,      -- 存储 Markdown 格式的行程单
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (user_id)
            )
        """)
        
        await db.commit()
        print("[OK] 数据库初始化完成")


async def get_user_preferences(user_id: str) -> dict:
    """
    从数据库获取用户偏好。
    
    Args:
        user_id: 用户唯一标识。
        
    Returns:
        dict: 用户偏好字典，若不存在则返回空字典。
    """
    async with aiosqlite.connect(db_path) as db:
        cursor = await db.execute("SELECT preferences FROM users WHERE user_id = ?", (user_id,))
        row = await cursor.fetchone()
        if row:
            import json
            return json.loads(row[0]) if row[0] else {}
        return {}


async def save_itinerary(user_id: str, title: str, content: str):
    """
    保存生成的行程单到数据库。
    
    Args:
        user_id: 用户唯一标识。
        title: 行程标题。
        content: 行程内容（Markdown）。
    """
    async with aiosqlite.connect(db_path) as db:
        await db.execute(
            "INSERT INTO itineraries (user_id, title, content) VALUES (?, ?, ?)",
            (user_id, title, content)
        )
        await db.commit()
