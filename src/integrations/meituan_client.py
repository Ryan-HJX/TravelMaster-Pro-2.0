"""美团旅行 CLI 客户端 — 通过 mttravel 命令行获取酒店/餐厅/景点数据."""

from __future__ import annotations

import asyncio
import json
import logging
import shutil
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

CONFIG_PATH = Path.home() / ".config" / "meituan-travel" / "config.json"


class MeituanClient:
    """通过 mttravel CLI 获取美团酒旅数据."""

    def __init__(self) -> None:
        self._cli_available: bool | None = None

    @property
    def enabled(self) -> bool:
        if self._cli_available is not None:
            return self._cli_available
        self._cli_available = (
            shutil.which("mttravel") is not None
            and CONFIG_PATH.exists()
        )
        if not self._cli_available:
            logger.debug("mttravel CLI not available or config missing")
        return self._cli_available

    async def query(self, city: str, query_text: str) -> str | None:
        """调用 mttravel CLI，返回原始文本结果."""
        if not self.enabled:
            return None

        try:
            proc = await asyncio.create_subprocess_exec(
                "mttravel", city, query_text,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await asyncio.wait_for(
                proc.communicate(), timeout=120
            )
            output = stdout.decode("utf-8", errors="replace").strip()
            if proc.returncode != 0:
                err = stderr.decode("utf-8", errors="replace").strip()
                logger.warning("mttravel returned %d: %s", proc.returncode, err[:200])
                return None
            return output
        except asyncio.TimeoutError:
            logger.warning("mttravel timed out for city=%s", city)
            return None
        except Exception as exc:
            logger.warning("mttravel failed: %s", exc)
            return None

    async def search_restaurants(self, city: str) -> str | None:
        """搜索餐厅推荐."""
        return await self.query(city, "推荐几家评分高的餐厅，包含人均消费和评分")

    async def search_attractions(self, city: str) -> str | None:
        """搜索景点推荐."""
        return await self.query(city, "推荐必去的景点，包含门票价格和评分")

    async def search_hotels(self, city: str) -> str | None:
        """搜索酒店推荐."""
        return await self.query(city, "推荐几家酒店，包含价格和评分")

    async def close(self) -> None:
        pass


# Global instance
meituan_client = MeituanClient()
