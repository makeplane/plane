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
Types API tools for Plane issue type management.
"""

from typing import Dict

from pi.services.actions.tool_generator import generate_tools_for_category
from pi.services.actions.tool_metadata import ToolMetadata
from pi.services.actions.tool_metadata import ToolParameter

# ============================================================================
# TYPES TOOL DEFINITIONS
# ============================================================================

TYPE_TOOL_DEFINITIONS: Dict[str, ToolMetadata] = {
    "create": ToolMetadata(
        name="types_create",
        description="Create a new work item type",
        sdk_method="create_issue_type",
        parameters=[
            ToolParameter(name="name", type="str", required=True, description="Name of the work item type (required)"),
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (auto-detected from context)",
                auto_fill_from_context=True,
            ),
            ToolParameter(
                name="project_id",
                type="Optional[str]",
                required=False,
                description="Project ID (auto-detected from context)",
                auto_fill_from_context=True,
            ),
            ToolParameter(name="description", type="Optional[str]", required=False, description="Optional description of the type"),
            ToolParameter(
                name="project_ids", type="Optional[List[str]]", required=False, description="List of project IDs to associate with this type"
            ),
            ToolParameter(name="is_epic", type="Optional[bool]", required=False, description="Flag to mark this type as an epic type"),
            ToolParameter(name="is_active", type="Optional[bool]", required=False, description="Activation status of the type"),
            ToolParameter(
                name="external_source", type="Optional[str]", required=False, description="External integration source (e.g., 'jira', 'github')"
            ),
            ToolParameter(name="external_id", type="Optional[str]", required=False, description="External system identifier for this type"),
        ],
        returns_entity_type="type",
    ),
    "update": ToolMetadata(
        name="types_update",
        description="Update work item type details",
        sdk_method="update_issue_type",
        parameters=[
            ToolParameter(name="type_id", type="str", required=True, description="UUID of the work item type to update (required)"),
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (auto-detected from context)",
                auto_fill_from_context=True,
            ),
            ToolParameter(
                name="project_id",
                type="Optional[str]",
                required=False,
                description="Project ID (auto-detected from context)",
                auto_fill_from_context=True,
            ),
            ToolParameter(name="name", type="Optional[str]", required=False, description="Updated name of the type"),
            ToolParameter(name="description", type="Optional[str]", required=False, description="Updated description"),
            ToolParameter(
                name="project_ids", type="Optional[list[str]]", required=False, description="Updated list of project IDs to associate with this type"
            ),
            ToolParameter(name="is_epic", type="Optional[bool]", required=False, description="Updated epic type flag"),
            ToolParameter(name="is_active", type="Optional[bool]", required=False, description="Updated activation status"),
            ToolParameter(name="external_source", type="Optional[str]", required=False, description="Updated external integration source"),
            ToolParameter(name="external_id", type="Optional[str]", required=False, description="Updated external system identifier"),
        ],
        returns_entity_type="type",
    ),
    "delete": ToolMetadata(
        name="types_delete",
        description="Delete a type",
        sdk_method="delete_issue_type",
        parameters=[
            ToolParameter(name="type_id", type="str", required=True, description="Type ID (required)"),
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (auto-detected from context)",
                auto_fill_from_context=True,
            ),
            ToolParameter(
                name="project_id",
                type="Optional[str]",
                required=False,
                description="Project ID (auto-detected from context)",
                auto_fill_from_context=True,
            ),
        ],
        returns_entity_type="type",
    ),
}


# ============================================================================
# TOOL FACTORY
# ============================================================================


def get_type_tools(method_executor, context):
    """Return LangChain tools for the types category using auto-generation from metadata."""
    return generate_tools_for_category(
        category="types",
        method_executor=method_executor,
        context=context,
        tool_definitions=TYPE_TOOL_DEFINITIONS,
    )
