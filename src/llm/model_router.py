"""Model router: selects cloud (Bailian) or local (Ollama) based on config and availability."""

from __future__ import annotations

import logging
from typing import Any

from src.config.settings import settings
from src.llm.bailian_client import BailianClient

logger = logging.getLogger(__name__)

# Lazy singleton
_bailian: BailianClient | None = None
_ollama_chat: Any = None


def get_bailian() -> BailianClient:
    global _bailian
    if _bailian is None:
        _bailian = BailianClient()
    return _bailian


async def _get_ollama():
    """Lazy-load langchain-ollama ChatOllama."""
    global _ollama_chat
    if _ollama_chat is None:
        from langchain_ollama import ChatOllama
        _ollama_chat = ChatOllama(
            base_url=settings.OLLAMA_BASE_URL,
            model=settings.OLLAMA_MODEL,
            temperature=0.7,
        )
    return _ollama_chat


class ModelRouter:
    """Routes LLM calls to the appropriate backend."""

    async def call_main(
        self,
        *,
        prompt: str,
        mcp_tools: list[dict[str, Any]] | None = None,
        instructions: str | None = None,
    ) -> dict[str, Any]:
        """Call the main planning model (cloud-first, local-fallback)."""
        if settings.MODEL_PRIORITY == "cloud" and settings.DASHSCOPE_API_KEY:
            try:
                client = get_bailian()
                if mcp_tools:
                    return await client.plan_with_mcp(
                        prompt=prompt,
                        mcp_tools=mcp_tools,
                        instructions=instructions,
                    )
                return await client.create(
                    input=prompt,
                    instructions=instructions,
                )
            except Exception as exc:
                logger.warning("bailian call failed, falling back to ollama: %s", exc)

        # Fallback to Ollama
        return await self._call_ollama(prompt)

    async def call_flash(
        self,
        *,
        prompt: str,
        instructions: str | None = None,
    ) -> dict[str, Any]:
        """Call the flash model for lightweight extraction."""
        if settings.MODEL_PRIORITY == "cloud" and settings.DASHSCOPE_API_KEY:
            try:
                client = get_bailian()
                return await client.extract(prompt=prompt, instructions=instructions)
            except Exception as exc:
                logger.warning("bailian flash failed, falling back to ollama: %s", exc)

        return await self._call_ollama(prompt)

    async def _call_ollama(self, prompt: str) -> dict[str, Any]:
        """Call local Ollama model as fallback."""
        import time
        start = time.monotonic()
        chat = await _get_ollama()
        response = await chat.ainvoke(prompt)
        latency_ms = int((time.monotonic() - start) * 1000)

        return {
            "output_text": response.content if hasattr(response, "content") else str(response),
            "tool_calls": [],
            "usage": {},
            "latency_ms": latency_ms,
            "model": f"ollama/{settings.OLLAMA_MODEL}",
        }


# Global singleton
router = ModelRouter()
