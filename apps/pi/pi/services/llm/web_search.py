# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

from __future__ import annotations

from dataclasses import dataclass
from typing import Any
from typing import Optional

from pi import logger
from pi import settings
from pi.services.llm.llms import _is_custom_model

log = logger.getChild(__name__)

# Web search constants - accessed from settings for consistency
OPENAI_SEARCH_MODEL = settings.llm_model.GPT_4O_SEARCH_PREVIEW
ANTHROPIC_TOOL_TYPE = settings.llm_config.ANTHROPIC_WEB_SEARCH_TOOL_TYPE
DEFAULT_MAX_RESULTS = settings.llm_config.WEB_SEARCH_MAX_RESULTS


@dataclass
class WebSearchResult:
    content: str
    provider: str
    model: str
    input_tokens: int = 0
    output_tokens: int = 0
    cached_input_tokens: int = 0


class WebSearchService:
    def __init__(self, model: str | None) -> None:
        self.model = model or settings.llm_model.DEFAULT

    async def search(self, query: str, *, workspace_in_context: bool, max_results: int = DEFAULT_MAX_RESULTS) -> Optional[WebSearchResult]:
        cleaned_query = (query or "").strip()
        if not cleaned_query:
            return None

        # Custom self-hosted models don't support built-in web search
        if _is_custom_model(self.model):
            log.info("Web search skipped: custom self-hosted model does not support web search")
            return None

        if _is_anthropic_model(self.model):
            return await _anthropic_web_search(cleaned_query, workspace_in_context, max_results, self.model)

        return await _openai_web_search(cleaned_query, workspace_in_context, max_results)


def _is_anthropic_model(model: str) -> bool:
    model_lower = (model or "").lower()
    return "claude" in model_lower or "anthropic" in model_lower


def _normalize_anthropic_model(model: str) -> str:
    if model == settings.llm_model.LITE_LLM_CLAUDE_SONNET_4:
        return settings.llm_model.CLAUDE_SONNET_4_5
    if model.startswith("us.anthropic."):
        return settings.llm_model.CLAUDE_SONNET_4_5
    return model


def _build_web_search_prompts(query: str, workspace_in_context: bool, max_results: int) -> tuple[str, str]:
    context_hint = (
        "Workspace context is enabled. Focus on public external sources that complement internal Plane data."
        if workspace_in_context
        else "Workspace context is disabled. Treat this as a general web query."
    )

    system_prompt = (
        "You are a web research assistant. Use web search capabilities to fetch current, reliable information. "
        "Return only search results and do not answer the user's question."
    )
    user_prompt = (
        f"Search query: {query}\n"
        f"Context: {context_hint}\n"
        f"Return up to {max_results} results as a bullet list.\n"
        "Each bullet must include: Title - URL - 1-2 sentence snippet.\n"
        "Do not include analysis or a final answer."
    )
    return system_prompt, user_prompt


def _truncate_text(text: str, max_chars: int = 4000) -> str:
    trimmed = text.strip()
    if len(trimmed) <= max_chars:
        return trimmed
    return trimmed[: max_chars - 3].rstrip() + "..."


def _safe_get(obj: Any, key: str, default: Any = None) -> Any:
    if isinstance(obj, dict):
        return obj.get(key, default)
    return getattr(obj, key, default)


def _extract_anthropic_text(response: Any) -> str:
    content = getattr(response, "content", None)
    if not isinstance(content, list):
        if isinstance(content, str):
            return content.strip()
        return ""

    text_parts: list[str] = []
    for block in content:
        block_type = _safe_get(block, "type")
        if block_type == "text":
            block_text = _safe_get(block, "text")
            if isinstance(block_text, str) and block_text.strip():
                text_parts.append(block_text.strip())

    return "\n".join(text_parts).strip()


def _extract_anthropic_usage(response: Any) -> tuple[int, int, int]:
    usage = getattr(response, "usage", None)
    if usage:
        input_tokens = _safe_get(usage, "input_tokens", 0)
        output_tokens = _safe_get(usage, "output_tokens", 0)
        cached_input_tokens = _safe_get(usage, "cache_read_input_tokens", 0)
        return int(input_tokens or 0), int(output_tokens or 0), int(cached_input_tokens or 0)
    return 0, 0, 0


async def _openai_web_search(query: str, workspace_in_context: bool, max_results: int) -> Optional[WebSearchResult]:
    """OpenAI web search using the shared LLM factory from llms.py.

    Uses gpt-4o-search-preview which has built-in web search capabilities.
    Note: This model doesn't support temperature parameter.
    """
    if not settings.llm_config.OPENAI_API_KEY:
        log.warning("OpenAI API key missing; skipping web search.")
        return None

    try:
        from langchain_core.messages import HumanMessage
        from langchain_core.messages import SystemMessage

        from pi.services.llm.llms import LLMConfig
        from pi.services.llm.llms import create_openai_llm
    except Exception as exc:  # pragma: no cover - import guard
        log.warning(f"LangChain/LLM factory unavailable for web search: {exc}")
        return None

    system_prompt, user_prompt = _build_web_search_prompts(query, workspace_in_context, max_results)
    messages = [SystemMessage(content=system_prompt), HumanMessage(content=user_prompt)]

    try:
        # gpt-4o-search-preview doesn't support temperature - create config without it
        config = LLMConfig(
            model=OPENAI_SEARCH_MODEL,
            temperature=0.0,  # Will be ignored by the model but required by config
            max_completion_tokens=800,
        )
        # Use track_tokens=False since we handle tracking separately via TokenTracker
        llm = create_openai_llm(config, track_tokens=False)
        response = await llm.ainvoke(messages)

        text = response.content if hasattr(response, "content") else ""
        if text and isinstance(text, str) and text.strip():
            # Extract token usage from LangChain response metadata
            input_tokens = 0
            output_tokens = 0
            if hasattr(response, "response_metadata"):
                usage = response.response_metadata.get("token_usage", {})
                input_tokens = usage.get("prompt_tokens", 0)
                output_tokens = usage.get("completion_tokens", 0)

            return WebSearchResult(
                content=_truncate_text(text.strip()),
                provider="openai",
                model=OPENAI_SEARCH_MODEL,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                cached_input_tokens=0,
            )
    except Exception as exc:  # pragma: no cover - network/SDK errors
        log.warning(f"OpenAI web search failed: {exc}")

    return None


async def _anthropic_web_search(
    query: str,
    workspace_in_context: bool,
    max_results: int,
    model: str,
) -> Optional[WebSearchResult]:
    """Anthropic web search using the direct Anthropic SDK.

    NOTE: We use the direct Anthropic SDK here instead of LangChain because:
    - Anthropic's web_search is a "server-side tool" (type: web_search_20250305)
    - LangChain's ChatAnthropic.bind_tools() is designed for user-defined function-calling tools
    - Server-side tools require passing a special 'tools' parameter format that LangChain doesn't support
    - See: https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/web-search-tool
    """
    if not settings.llm_config.CLAUDE_API_KEY:
        log.warning("Anthropic API key missing; skipping web search.")
        return None

    try:
        from anthropic import AsyncAnthropic
    except Exception as exc:  # pragma: no cover - import guard
        log.warning(f"Anthropic SDK unavailable for web search: {exc}")
        return None

    normalized_model = _normalize_anthropic_model(model)
    candidate_models = list(
        dict.fromkeys(
            [
                normalized_model,
                settings.llm_model.CLAUDE_SONNET_4_6,
                settings.llm_model.CLAUDE_SONNET_4_5,
                settings.llm_model.CLAUDE_SONNET_4_0,
            ]
        )
    )

    system_prompt, user_prompt = _build_web_search_prompts(query, workspace_in_context, max_results)

    # Only pass base_url if it is actually set (not None / not empty string)
    client_kwargs: dict[str, Any] = {
        "api_key": settings.llm_config.CLAUDE_API_KEY,
    }

    base_url = getattr(settings.llm_config, "CLAUDE_BASE_URL", None)
    if base_url:
        client_kwargs["base_url"] = base_url

    client = AsyncAnthropic(**client_kwargs)

    last_error: Exception | None = None

    for candidate_model in candidate_models:
        try:
            response = await client.messages.create(
                model=candidate_model,
                max_tokens=800,
                temperature=0.2,
                system=system_prompt,
                messages=[{"role": "user", "content": user_prompt}],
                tools=[{"type": ANTHROPIC_TOOL_TYPE, "name": "web_search"}],  # type: ignore[misc,list-item]
            )

            text = _extract_anthropic_text(response)
            if text:
                input_tokens, output_tokens, cached_input_tokens = _extract_anthropic_usage(response)
                return WebSearchResult(
                    content=_truncate_text(text),
                    provider="anthropic",
                    model=candidate_model,
                    input_tokens=input_tokens,
                    output_tokens=output_tokens,
                    cached_input_tokens=cached_input_tokens,
                )

        except Exception as exc:  # pragma: no cover - network/SDK errors
            last_error = exc
            continue

    if last_error:
        log.warning(f"Anthropic web search failed: {last_error}")

    return None
