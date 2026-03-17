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

"""Utilities for Claude prompt caching.

There are two independent caching mechanisms with different SDK compatibility:

1. **Message-level caching** — ``cache_control`` inside content blocks of a
   SystemMessage.  This is payload data, not an SDK kwarg.  Anthropic-compatible
   endpoints use it for caching; other OpenAI-compatible APIs silently ignore
   unknown fields in content blocks.  Safe to include for any eligible model.
   Controlled by :func:`should_cache_messages`.

2. **Tool-level caching** — ``cache_control`` passed as a kwarg to
   ``bind_tools()``.  ``ChatAnthropic`` adds it to each tool definition.
   ``ChatOpenAI`` forwards it to ``AsyncCompletions.create()`` which rejects
   the unknown kwarg.  Only safe with native ``ChatAnthropic``.
   Controlled by :func:`should_cache_tool_bindings`.

Callers should use the appropriate function for each context.
"""

from langchain_core.messages import SystemMessage

from pi import settings
from pi.services.llm.llms import _is_custom_model


def _is_eligible_model(llm_model: str | None) -> bool:
    """Check if the model is in ANTHROPIC_CACHE_ELIGIBLE_MODELS."""
    eligible = settings.llm_config.ANTHROPIC_CACHE_ELIGIBLE_MODELS
    if llm_model in eligible:
        return True
    if llm_model is None:
        return settings.llm_model.DEFAULT in eligible
    return False


def should_cache_messages(llm_model: str | None) -> bool:
    """Whether to add cache_control to message content blocks.

    cache_control inside content blocks is payload data — Anthropic-compatible
    endpoints use it for prompt caching, while standard OpenAI-compatible APIs
    silently ignore unknown fields.  Safe for both direct Anthropic SDK and
    custom models behind any OpenAI-compatible proxy.
    """
    return _is_eligible_model(llm_model)


def should_cache_tool_bindings(llm_model: str | None) -> bool:
    """Whether to pass cache_control as a bind_tools() kwarg.

    Only safe with native ChatAnthropic.  Custom models use ChatOpenAI which
    forwards the kwarg to AsyncCompletions.create() — the OpenAI SDK rejects
    unknown kwargs with a hard error.
    """
    if llm_model and _is_custom_model(llm_model):
        return False
    return _is_eligible_model(llm_model)


def create_claude_cached_system_message(content: str) -> SystemMessage:
    """Create a SystemMessage with cache_control on the content block.

    Works with ChatAnthropic (native prompt caching) and any OpenAI-compatible
    proxy — the field is either used for caching or silently ignored.
    """
    return SystemMessage(
        content=[
            {
                "type": "text",
                "text": content,
                "cache_control": {"type": "ephemeral"},
            }
        ]
    )


def get_claude_bind_kwargs_with_cache() -> dict:
    """Get bind_tools kwargs with Claude cache control enabled.

    Only use when should_cache_tool_bindings() returns True (direct Anthropic).
    """
    return {"cache_control": {"type": "ephemeral"}}
