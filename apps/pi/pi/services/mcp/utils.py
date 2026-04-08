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

"""
MCP Utilities.

Single source of truth for MCP tool name parsing and formatting.
Used by: artifact creation, execution, analytics.
"""

import re
from typing import Tuple

from pi import logger

log = logger.getChild(__name__)


# =============================================================================
# Constants
# =============================================================================

MCP_TOOL_PREFIX = "mcp_"

# Action verb mappings for tool classification
_CREATE_VERBS = {"create", "write", "add", "insert", "new", "post"}
_DELETE_VERBS = {"delete", "remove", "destroy", "drop"}
_UPDATE_VERBS = {"update", "edit", "modify", "patch", "put", "set"}
_GET_VERBS = {"get", "fetch", "read", "retrieve", "show", "find"}
_SEARCH_VERBS = {"search", "list", "query", "filter", "browse"}


# =============================================================================
# Parsing Functions
# =============================================================================


def is_mcp_tool(tool_name: str) -> bool:
    """Check if a tool name is an MCP tool."""
    return bool(tool_name and isinstance(tool_name, str) and tool_name.startswith(MCP_TOOL_PREFIX))


def parse_tool_name(tool_name: str) -> Tuple[str, str]:
    """
    Parse MCP tool name into connector slug and base tool name.

    Tool names use ``__`` (double underscore) to separate the connector slug
    from the tool name, which is set by ``client.py`` during tool loading.
    Falls back to single ``_`` for legacy names.

    Examples:
        "mcp_github-mcp__issue_write" -> ("github-mcp", "issue_write")
        "mcp_slack__send_message" -> ("slack", "send_message")
        "mcp_slack_send_message" -> ("slack", "send_message")  # legacy

    Returns:
        Tuple of (connector_slug, tool_base_name)
    """
    if not is_mcp_tool(tool_name):
        return ("external", tool_name)

    name_without_prefix = tool_name[len(MCP_TOOL_PREFIX) :]

    # Try double underscore first (canonical format from client.py)
    if "__" in name_without_prefix:
        connector_slug, tool_base = name_without_prefix.split("__", 1)
        return (connector_slug, tool_base)

    # Fallback: single underscore (legacy tool names)
    if "_" in name_without_prefix:
        connector_slug, tool_base = name_without_prefix.split("_", 1)
        return (connector_slug, tool_base)

    return ("external", name_without_prefix)


# =============================================================================
# Formatting Functions
# =============================================================================


def strip_slug_suffix(connector_slug: str) -> str:
    """
    Strip the random hex collision suffix that ``generate_unique_slug`` appends.
    """
    return re.sub(r"-[0-9a-f]{6}$", "", connector_slug) if connector_slug else connector_slug


def format_connector_display(connector_slug: str) -> str:
    """
    Format connector slug for display, stripping the random hex suffix first.
    """
    if not connector_slug:
        return "MCP"

    cleaned = strip_slug_suffix(connector_slug)
    display = cleaned.replace("-", " ").replace("_", " ")
    return " ".join(word.capitalize() for word in display.split())


def extract_action(tool_base: str) -> str:
    """
    Extract action verb from tool name.

    "issue_write" -> "create"
    "delete_issue" -> "delete"
    """
    if not tool_base:
        return "execute"

    lower = tool_base.lower()

    for verb in _CREATE_VERBS:
        if verb in lower:
            return "create"

    for verb in _DELETE_VERBS:
        if verb in lower:
            return "delete"

    for verb in _UPDATE_VERBS:
        if verb in lower:
            return "update"

    for verb in _GET_VERBS:
        if verb in lower:
            return "get"

    for verb in _SEARCH_VERBS:
        if verb in lower:
            return "search"

    return "execute"
