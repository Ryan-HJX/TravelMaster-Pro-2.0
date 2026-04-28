"""Bailian (DashScope) Responses API client with MCP tool support."""

from __future__ import annotations

import logging
import time
from typing import Any

from openai import AsyncOpenAI

from src.config.settings import settings

logger = logging.getLogger(__name__)


class BailianClient:
    """Thin wrapper around the OpenAI-compatible DashScope Responses API."""

    def __init__(
        self,
        api_key: str | None = None,
        base_url: str | None = None,
        main_model: str | None = None,
        flash_model: str | None = None,
    ) -> None:
        self._api_key = api_key or settings.DASHSCOPE_API_KEY
        self._base_url = base_url or settings.BAILIAN_BASE_URL
        self.main_model = main_model or settings.BAILIAN_MAIN_MODEL
        self.flash_model = flash_model or settings.BAILIAN_FLASH_MODEL

        self._client = AsyncOpenAI(
            api_key=self._api_key,
            base_url=self._base_url,
        )

    # ── Core call ────────────────────────────────────────────────

    async def create(
        self,
        *,
        model: str | None = None,
        input: str | list[dict[str, Any]],  # noqa: A002
        tools: list[dict[str, Any]] | None = None,
        instructions: str | None = None,
        temperature: float = 0.7,
        max_output_tokens: int = 8192,
        extra_params: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Call Responses API and return parsed result.

        Returns a dict with keys:
            output_text: str
            tool_calls: list[dict]  — MCP / function calls made
            usage: dict
            latency_ms: int
        """
        model = model or self.main_model
        start = time.monotonic()

        kwargs: dict[str, Any] = {
            "model": model,
            "input": input,
            "temperature": temperature,
            "max_output_tokens": max_output_tokens,
        }
        if tools:
            kwargs["tools"] = tools
        if instructions:
            kwargs["instructions"] = instructions
        if extra_params:
            kwargs.update(extra_params)

        response = await self._client.responses.create(**kwargs)
        latency_ms = int((time.monotonic() - start) * 1000)

        # Parse output ─ the response object has .output list
        output_text = getattr(response, "output_text", "")

        # Collect tool calls
        tool_calls: list[dict[str, Any]] = []
        for item in getattr(response, "output", []):
            item_type = getattr(item, "type", "")
            if item_type in ("mcp_call", "function_call", "mcp_list_tools"):
                tool_calls.append({
                    "type": item_type,
                    "name": getattr(item, "name", ""),
                    "arguments": getattr(item, "arguments", ""),
                    "server_label": getattr(item, "server_label", ""),
                })
            elif item_type in ("mcp_call_output", "function_call_output"):
                tool_calls.append({
                    "type": item_type,
                    "output": getattr(item, "output", ""),
                })

        usage_obj = getattr(response, "usage", None)
        usage = {
            "input_tokens": getattr(usage_obj, "input_tokens", 0),
            "output_tokens": getattr(usage_obj, "output_tokens", 0),
            "total_tokens": getattr(usage_obj, "total_tokens", 0),
        } if usage_obj else {}

        logger.info(
            "bailian response: model=%s latency=%dms tokens=%s tools=%d",
            model, latency_ms, usage.get("total_tokens", "?"), len(tool_calls),
        )

        return {
            "output_text": output_text,
            "tool_calls": tool_calls,
            "usage": usage,
            "latency_ms": latency_ms,
            "model": model,
        }

    # ── Convenience: main model with MCP ─────────────────────────

    async def plan_with_mcp(
        self,
        *,
        prompt: str,
        mcp_tools: list[dict[str, Any]],
        instructions: str | None = None,
    ) -> dict[str, Any]:
        """Shortcut for main-model planning with MCP tools attached."""
        return await self.create(
            model=self.main_model,
            input=prompt,
            tools=mcp_tools,
            instructions=instructions,
        )

    # ── Convenience: flash model for lightweight extraction ──────

    async def extract(
        self,
        *,
        prompt: str,
        instructions: str | None = None,
    ) -> dict[str, Any]:
        """Shortcut for flash-model lightweight extraction / summarization."""
        return await self.create(
            model=self.flash_model,
            input=prompt,
            instructions=instructions,
            max_output_tokens=4096,
        )
