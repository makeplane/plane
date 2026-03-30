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
Members API tools for Plane workspace and project member management.

MIGRATED TO AUTO-GENERATED TOOLS
Tool metadata defined in this file (MEMBER_TOOL_DEFINITIONS) for modularity.
Bot filtering handled via custom post_handler function.
Old manual definitions kept below for comparison/rollback safety.
"""

from typing import Any
from typing import Dict

from pi import logger
from pi.services.actions.tool_generator import generate_tools_for_category
from pi.services.actions.tool_metadata import ToolMetadata
from pi.services.actions.tool_metadata import ToolParameter

log = logger.getChild(__name__)


# ============================================================================
# MEMBERS-SPECIFIC HANDLER FUNCTIONS
# ============================================================================


async def _filter_bots_handler(
    metadata: ToolMetadata,
    result: Dict[str, Any],
    kwargs: Dict[str, Any],
    context: Dict[str, Any],
    method_executor: Any,
    category: str,
    method_key: str,
) -> Dict[str, Any]:
    """Post-processing handler to filter bot users from member lists."""

    if result["success"]:
        members_data = result.get("data")
        if isinstance(members_data, list):
            filtered_members = [
                member
                for member in members_data
                if not (member.get("is_bot", False) or (isinstance(member.get("email"), str) and "_bot@plane.so" in member.get("email", "").lower()))
            ]
            result["data"] = filtered_members
            log.debug(f"Filtered {len(members_data) - len(filtered_members)} bot users from {metadata.name}")

    return result


# Tool metadata for members category
MEMBER_TOOL_DEFINITIONS: Dict[str, ToolMetadata] = {
    "get_workspace_members": ToolMetadata(
        name="members_get_workspace_members",
        description="Get all workspace members (excludes bot users)",
        sdk_method="get_workspace_members",
        post_handler=_filter_bots_handler,
        parameters=[
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (auto-filled from context)",
                auto_fill_from_context=True,
            ),
        ],
    ),
    "get_project_members": ToolMetadata(
        name="members_get_project_members",
        description="Get all project members (excludes bot users)",
        sdk_method="get_project_members",
        post_handler=_filter_bots_handler,
        parameters=[
            ToolParameter(
                name="project_id",
                type="Optional[str]",
                required=False,
                description="Project UUID (auto-filled from context if in project chat)",
                auto_fill_from_context=True,
            ),
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (auto-filled from context)",
                auto_fill_from_context=True,
            ),
        ],
    ),
}


def get_member_tools(method_executor, context):
    """Return LangChain tools for the members category using auto-generation from metadata."""

    member_tools = generate_tools_for_category(
        category="members",
        method_executor=method_executor,
        context=context,
        tool_definitions=MEMBER_TOOL_DEFINITIONS,
    )

    return member_tools


# ============================================================================
# OLD MANUAL TOOL DEFINITIONS (COMMENTED OUT - KEPT FOR COMPARISON)
# To rollback: uncomment below and comment out the auto-generation code above
# ============================================================================

# [102 lines of old code omitted for brevity]
