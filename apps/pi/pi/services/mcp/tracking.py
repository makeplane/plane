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
MCP Tracking Utilities.

Used for analytics and monitoring of MCP tool executions.
"""

from typing import Any
from typing import Dict
from typing import Optional

from pi import logger
from pi.services.mcp.utils import is_mcp_tool
from pi.services.mcp.utils import parse_tool_name

log = logger.getChild(__name__)


def build_mcp_metadata(
    tool_name: str,
    execution_time_ms: int,
    error_type: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Build MCP metadata for analytics storage.

    Args:
        tool_name: Full MCP tool name (e.g. "mcp_github__issue_write")
        execution_time_ms: Execution time in milliseconds
        error_type: Optional error class name if the call failed

    Returns:
        Metadata dict for analytics
    """
    connector_slug: Optional[str] = None
    original_tool_name: Optional[str] = None

    if is_mcp_tool(tool_name):
        connector_slug, original_tool_name = parse_tool_name(tool_name)

    metadata: Dict[str, Any] = {
        "connector_slug": connector_slug,
        "original_tool_name": original_tool_name,
        "execution_time_ms": execution_time_ms,
    }

    if error_type:
        metadata["error_type"] = error_type

    return metadata
