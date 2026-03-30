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
Cycles API tools for Plane project cycle management operations.
"""

from typing import Dict

from pi.services.actions.tool_generator import generate_tools_for_category
from pi.services.actions.tool_metadata import ToolMetadata
from pi.services.actions.tool_metadata import ToolParameter

# ============================================================================
# CYCLES TOOL DEFINITIONS
# ============================================================================

CYCLES_TOOL_DEFINITIONS: Dict[str, ToolMetadata] = {
    "create": ToolMetadata(
        name="cycles_create",
        description="Create a new cycle. Note: Both start_date and end_date must be provided together, or neither.",
        sdk_method="create_cycle",
        returns_entity_type="cycle",
        parameters=[
            ToolParameter(name="name", type="str", required=True, description="Cycle name (required)"),
            ToolParameter(name="project_id", type="Optional[str]", required=False, description="Project ID (required)", auto_fill_from_context=True),
            ToolParameter(name="workspace_slug", type="Optional[str]", required=False, description="Workspace slug", auto_fill_from_context=True),
            ToolParameter(
                name="start_date", type="Optional[str]", required=False, description="Start date (YYYY-MM-DD). Must be paired with end_date."
            ),
            ToolParameter(
                name="end_date", type="Optional[str]", required=False, description="End date (YYYY-MM-DD). Must be paired with start_date."
            ),
            ToolParameter(name="description", type="Optional[str]", required=False, description="Cycle description"),
            ToolParameter(name="owned_by", type="Optional[str]", required=False, description="User ID who owns the cycle"),
            ToolParameter(name="external_id", type="Optional[str]", required=False, description="External system identifier"),
            ToolParameter(name="external_source", type="Optional[str]", required=False, description="External system source name"),
        ],
    ),
    "update": ToolMetadata(
        name="cycles_update",
        description="Update cycle details.",
        sdk_method="update_cycle",
        returns_entity_type="cycle",
        parameters=[
            ToolParameter(name="cycle_id", type="str", required=True, description="Cycle ID (required)"),
            ToolParameter(name="project_id", type="str", required=True, description="Project ID (required)"),
            ToolParameter(name="workspace_slug", type="Optional[str]", required=False, description="Workspace slug", auto_fill_from_context=True),
            ToolParameter(name="name", type="Optional[str]", required=False, description="New cycle name"),
            ToolParameter(name="description", type="Optional[str]", required=False, description="New description"),
            ToolParameter(name="start_date", type="Optional[str]", required=False, description="New start date (YYYY-MM-DD)"),
            ToolParameter(name="end_date", type="Optional[str]", required=False, description="New end date (YYYY-MM-DD)"),
            ToolParameter(name="owned_by", type="Optional[str]", required=False, description="New owner user ID"),
            ToolParameter(name="external_id", type="Optional[str]", required=False, description="External identifier"),
            ToolParameter(name="external_source", type="Optional[str]", required=False, description="External source name"),
        ],
    ),
    "archive": ToolMetadata(
        name="cycles_archive",
        description="Archive a cycle.",
        sdk_method="archive_cycle",
        parameters=[
            ToolParameter(name="cycle_id", type="str", required=True, description="Cycle ID (required)"),
            ToolParameter(name="project_id", type="str", required=True, description="Project ID (required)"),
            ToolParameter(name="workspace_slug", type="Optional[str]", required=False, description="Workspace slug", auto_fill_from_context=True),
        ],
    ),
    "unarchive": ToolMetadata(
        name="cycles_unarchive",
        description="Unarchive (restore) a cycle.",
        sdk_method="unarchive_cycle",
        parameters=[
            ToolParameter(name="cycle_id", type="str", required=True, description="Cycle ID (required)"),
            ToolParameter(name="project_id", type="str", required=True, description="Project ID (required)"),
            ToolParameter(name="workspace_slug", type="Optional[str]", required=False, description="Workspace slug", auto_fill_from_context=True),
        ],
    ),
    "list_archived": ToolMetadata(
        name="cycles_list_archived",
        description="List archived cycles in a project.",
        sdk_method="list_archived_cycles",
        parameters=[
            ToolParameter(name="project_id", type="str", required=True, description="Project ID (required)"),
            ToolParameter(name="workspace_slug", type="Optional[str]", required=False, description="Workspace slug", auto_fill_from_context=True),
        ],
    ),
    "add_work_items": ToolMetadata(
        name="cycles_add_work_items",
        description="Add work items to a cycle.",
        sdk_method="add_cycle_work_items",
        parameters=[
            ToolParameter(name="cycle_id", type="str", required=True, description="Cycle ID (required)"),
            ToolParameter(name="issues", type="list", required=True, description="List of issue IDs to add to the cycle"),
            ToolParameter(name="project_id", type="str", required=True, description="Project ID (required)"),
            ToolParameter(name="workspace_slug", type="Optional[str]", required=False, description="Workspace slug", auto_fill_from_context=True),
        ],
    ),
    "list_work_items": ToolMetadata(
        name="cycles_list_work_items",
        description="List work items in a cycle.",
        sdk_method="list_cycle_work_items",
        parameters=[
            ToolParameter(name="cycle_id", type="str", required=True, description="Cycle ID (required)"),
            ToolParameter(name="project_id", type="str", required=True, description="Project ID (required)"),
            ToolParameter(name="workspace_slug", type="Optional[str]", required=False, description="Workspace slug", auto_fill_from_context=True),
        ],
    ),
    "retrieve_work_item": ToolMetadata(
        name="cycles_retrieve_work_item",
        description="Get a specific work item in a cycle.",
        sdk_method="retrieve_cycle_work_item",
        parameters=[
            ToolParameter(name="cycle_id", type="str", required=True, description="Cycle ID (required)"),
            ToolParameter(name="issue_id", type="str", required=True, description="Issue ID (required)"),
            ToolParameter(name="project_id", type="str", required=True, description="Project ID (required)"),
            ToolParameter(name="workspace_slug", type="Optional[str]", required=False, description="Workspace slug", auto_fill_from_context=True),
        ],
    ),
    "remove_work_item": ToolMetadata(
        name="cycles_remove_work_item",
        description="Remove a work item from a cycle.",
        sdk_method="remove_cycle_work_item",
        parameters=[
            ToolParameter(name="cycle_id", type="str", required=True, description="Cycle ID (required)"),
            ToolParameter(name="issue_id", type="str", required=True, description="Issue ID to remove (required)"),
            ToolParameter(name="project_id", type="str", required=True, description="Project ID (required)"),
            ToolParameter(name="workspace_slug", type="Optional[str]", required=False, description="Workspace slug", auto_fill_from_context=True),
        ],
    ),
    "transfer_work_items": ToolMetadata(
        name="cycles_transfer_work_items",
        description="Transfer work items between cycles.",
        sdk_method="transfer_cycle_work_items",
        parameters=[
            ToolParameter(name="cycle_id", type="str", required=True, description="Source cycle ID (required)"),
            ToolParameter(name="new_cycle_id", type="str", required=True, description="Destination cycle ID (required)"),
            ToolParameter(name="project_id", type="str", required=True, description="Project ID (required)"),
            ToolParameter(name="workspace_slug", type="Optional[str]", required=False, description="Workspace slug", auto_fill_from_context=True),
        ],
    ),
}


# ============================================================================
# TOOL FACTORY
# ============================================================================


def get_cycle_tools(method_executor, context):
    """Return LangChain tools for the cycles category using auto-generation from metadata."""
    return generate_tools_for_category("cycles", method_executor, context, CYCLES_TOOL_DEFINITIONS)
