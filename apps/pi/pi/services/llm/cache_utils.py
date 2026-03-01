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

"""Utilities for Claude prompt caching."""

from langchain_core.messages import SystemMessage

from pi import settings


def should_enable_claude_caching(llm_model: str | None) -> bool:
    """Check if Claude prompt caching should be enabled for the given model.

    Args:
        llm_model: Model name to check. If None, checks the default model.

    Returns:
        True if the model is a Claude model that supports caching, False otherwise.
    """
    # Check if the model is a Claude model that supports caching
    if llm_model in [settings.llm_model.CLAUDE_SONNET_4_0, settings.llm_model.CLAUDE_SONNET_4_5, settings.llm_model.CLAUDE_SONNET_4_6]:
        return True

    # Also check default model if llm_model is None
    if llm_model is None:
        default_model = settings.llm_model.DEFAULT
        if default_model in [settings.llm_model.CLAUDE_SONNET_4_0, settings.llm_model.CLAUDE_SONNET_4_5, settings.llm_model.CLAUDE_SONNET_4_6]:
            return True

    return False


def create_claude_cached_system_message(content: str) -> SystemMessage:
    """Create a SystemMessage with Claude cache control enabled.

    Args:
        content: The system message content.

    Returns:
        SystemMessage with cache_control set to ephemeral for Claude.

    Note: For system messages, Claude requires a specific format where the content
    is a list of text blocks, with the last block having cache_control.
    LangChain's ChatAnthropic will properly convert this format to the Anthropic API.
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

    Returns:
        Dictionary with cache_control for use in bind_tools() with Claude models.
    """
    return {"cache_control": {"type": "ephemeral"}}
