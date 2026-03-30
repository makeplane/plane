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
Modules API tools for Plane module management operations.
"""

from typing import Dict

from pi.services.actions.tool_generator import generate_tools_for_category
from pi.services.actions.tool_metadata import ToolMetadata
from pi.services.actions.tool_metadata import ToolParameter

# ============================================================================
# MODULES TOOL DEFINITIONS
# ============================================================================

MODULES_TOOL_DEFINITIONS: Dict[str, ToolMetadata] = {
    "create": ToolMetadata(
        name="modules_create",
        description="Create a new module.",
        sdk_method="create_module",
        returns_entity_type="module",
        parameters=[
            ToolParameter(name="name", type="str", required=True, description="Module name (required)"),
            ToolParameter(name="project_id", type="Optional[str]", required=False, description="Project ID (required)", auto_fill_from_context=True),
            ToolParameter(name="workspace_slug", type="Optional[str]", required=False, description="Workspace slug", auto_fill_from_context=True),
            ToolParameter(name="description", type="Optional[str]", required=False, description="Module description"),
            ToolParameter(name="start_date", type="Optional[str]", required=False, description="Start date (YYYY-MM-DD format)"),
            ToolParameter(name="target_date", type="Optional[str]", required=False, description="Target completion date (YYYY-MM-DD format)"),
            ToolParameter(
                name="status", type="Optional[str]", required=False, description="Status: backlog, planned, in-progress, paused, completed, cancelled"
            ),
            ToolParameter(name="lead", type="Optional[str]", required=False, description="Module lead user ID"),
            ToolParameter(name="members", type="Optional[list]", required=False, description="List of member user IDs"),
            ToolParameter(name="external_id", type="Optional[str]", required=False, description="External identifier"),
            ToolParameter(name="external_source", type="Optional[str]", required=False, description="External source name"),
        ],
    ),
    "update": ToolMetadata(
        name="modules_update",
        description="Update module details.",
        sdk_method="update_module",
        returns_entity_type="module",
        parameters=[
            ToolParameter(name="module_id", type="str", required=True, description="Module ID (required)"),
            ToolParameter(name="project_id", type="Optional[str]", required=False, description="Project ID (required)", auto_fill_from_context=True),
            ToolParameter(name="workspace_slug", type="Optional[str]", required=False, description="Workspace slug", auto_fill_from_context=True),
            ToolParameter(name="name", type="Optional[str]", required=False, description="New module name"),
            ToolParameter(name="description", type="Optional[str]", required=False, description="New description"),
            ToolParameter(name="start_date", type="Optional[str]", required=False, description="New start date (YYYY-MM-DD)"),
            ToolParameter(name="target_date", type="Optional[str]", required=False, description="New target date (YYYY-MM-DD)"),
            ToolParameter(name="status", type="Optional[str]", required=False, description="New status"),
            ToolParameter(name="lead", type="Optional[str]", required=False, description="New lead user ID"),
            ToolParameter(name="members", type="Optional[list]", required=False, description="New members list"),
            ToolParameter(name="external_id", type="Optional[str]", required=False, description="External identifier"),
            ToolParameter(name="external_source", type="Optional[str]", required=False, description="External source name"),
        ],
    ),
    "archive": ToolMetadata(
        name="modules_archive",
        description="Archive a module.",
        sdk_method="archive_module",
        parameters=[
            ToolParameter(name="module_id", type="str", required=True, description="Module ID (required)"),
            ToolParameter(name="project_id", type="Optional[str]", required=False, description="Project ID (required)", auto_fill_from_context=True),
            ToolParameter(name="workspace_slug", type="Optional[str]", required=False, description="Workspace slug", auto_fill_from_context=True),
        ],
    ),
    "unarchive": ToolMetadata(
        name="modules_unarchive",
        description="Unarchive (restore) a module.",
        sdk_method="unarchive_module",
        parameters=[
            ToolParameter(name="module_id", type="str", required=True, description="Module ID (required)"),
            ToolParameter(name="project_id", type="Optional[str]", required=False, description="Project ID (required)", auto_fill_from_context=True),
            ToolParameter(name="workspace_slug", type="Optional[str]", required=False, description="Workspace slug", auto_fill_from_context=True),
        ],
    ),
    "add_work_items": ToolMetadata(
        name="modules_add_work_items",
        description="Add work items to a module.",
        sdk_method="add_module_work_items",
        parameters=[
            ToolParameter(name="module_id", type="str", required=True, description="Module ID (required)"),
            ToolParameter(name="issues", type="list", required=True, description="List of issue IDs to add"),
            ToolParameter(name="project_id", type="Optional[str]", required=False, description="Project ID (required)", auto_fill_from_context=True),
            ToolParameter(name="workspace_slug", type="Optional[str]", required=False, description="Workspace slug", auto_fill_from_context=True),
        ],
    ),
    "remove_work_item": ToolMetadata(
        name="modules_remove_work_item",
        description="Remove a work item from a module.",
        sdk_method="remove_module_work_item",
        parameters=[
            ToolParameter(name="module_id", type="str", required=True, description="Module ID (required)"),
            ToolParameter(name="issue_id", type="str", required=True, description="Issue ID to remove (required)"),
            ToolParameter(name="project_id", type="Optional[str]", required=False, description="Project ID (required)", auto_fill_from_context=True),
            ToolParameter(name="workspace_slug", type="Optional[str]", required=False, description="Workspace slug", auto_fill_from_context=True),
        ],
    ),
}


# ============================================================================
# TOOL FACTORY
# ============================================================================


def get_module_tools(method_executor, context):
    """Return LangChain tools for the modules category using auto-generation from metadata."""
    return generate_tools_for_category("modules", method_executor, context, MODULES_TOOL_DEFINITIONS)
