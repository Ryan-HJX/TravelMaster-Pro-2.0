"""Bailian (DashScope) client with extreme timeout and retry logic."""

from __future__ import annotations

import logging
import time
import asyncio
from typing import Any

import httpx
from src.config.settings import settings

logger = logging.getLogger(__name__)


class BailianClient:
    """Wrapper for DashScope Generation API with extreme reliability."""

    def __init__(self) -> None:
        self._api_key = settings.DASHSCOPE_API_KEY
        self._url = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation"
        self.main_model = settings.BAILIAN_MAIN_MODEL
        self.flash_model = settings.BAILIAN_FLASH_MODEL

    async def create(
        self,
        *,
        model: str | None = None,
        input: str,
        tools: list[dict[str, Any]] | None = None,
        instructions: str | None = None,
        temperature: float = 0.7,
        retries: int = 2
    ) -> dict[str, Any]:
        """Call DashScope with retries and massive timeout."""
        model = model or self.main_model

        messages: list[dict[str, str]] = []
        if instructions:
            messages.append({"role": "system", "content": instructions})
        messages.append({"role": "user", "content": input})

        payload: dict[str, Any] = {
            "model": model,
            "input": {"messages": messages},
            "parameters": {"result_format": "message", "temperature": temperature}
        }

        if tools:
            payload["tools"] = tools

        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
            "X-DashScope-SSE": "disable"
        }

        # Use an even larger timeout (5 minutes) for extremely poor network conditions
        timeout = httpx.Timeout(300.0, connect=30.0, read=300.0)

        for attempt in range(retries):
            start = time.monotonic()
            async with httpx.AsyncClient(timeout=timeout, trust_env=True) as client:
                try:
                    logger.info(">>> [LLM] Attempt %d/%d calling DashScope (%s)...", attempt + 1, retries, model)
                    response = await client.post(self._url, json=payload, headers=headers)

                    if response.status_code == 429:  # Rate limit
                        logger.warning(">>> [LLM] Rate limited, waiting 10s...")
                        await asyncio.sleep(10)
                        continue

                    response.raise_for_status()
                    data = response.json()

                    output = data.get("output", {})
                    choices = output.get("choices", [])
                    output_text = ""
                    tool_calls = []

                    if choices:
                        message = choices[0].get("message", {})
                        output_text = message.get("content", "")
                        if "tool_calls" in message:
                            for tc in message["tool_calls"]:
                                tool_calls.append({
                                    "type": tc.get("type", "function"),
                                    "name": tc.get("function", {}).get("name", "") if "function" in tc else tc.get("name", ""),
                                    "arguments": tc.get("function", {}).get("arguments", "") if "function" in tc else tc.get("arguments", ""),
                                    "server_label": tc.get("server_label", "")
                                })

                    latency = int((time.monotonic() - start) * 1000)
                    logger.info(">>> [LLM SUCCESS] Latency: %dms", latency)

                    return {
                        "output_text": output_text,
                        "tool_calls": tool_calls,
                        "usage": data.get("usage", {}),
                        "latency_ms": latency,
                        "model": model,
                    }

                except httpx.ReadTimeout:
                    logger.error("!!! [LLM TIMEOUT] Read timeout on attempt %d. Network is very slow.", attempt + 1)
                    if attempt == retries - 1:
                        raise
                    await asyncio.sleep(5)
                except Exception as e:
                    logger.error("!!! [LLM ERROR] %s: %s", type(e).__name__, str(e))
                    if attempt == retries - 1:
                        raise
                    await asyncio.sleep(5)

        raise Exception("Failed after maximum retries")

    async def plan_with_mcp(self, prompt: str, mcp_tools: list[dict], instructions: str | None = None) -> dict[str, Any]:
        return await self.create(input=prompt, tools=mcp_tools, instructions=instructions)

    async def extract(self, prompt: str, instructions: str | None = None) -> dict[str, Any]:
        return await self.create(model=self.flash_model, input=prompt, instructions=instructions)
