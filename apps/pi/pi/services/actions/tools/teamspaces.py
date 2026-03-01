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
Teamspaces API tools for Plane team collaboration operations.
"""

from typing import Dict

from pi.services.actions.tool_generator import generate_tools_for_category
from pi.services.actions.tool_metadata import ToolMetadata
from pi.services.actions.tool_metadata import ToolParameter

# ============================================================================
# TEAMSPACES TOOL DEFINITIONS
# ============================================================================

TEAMSPACE_TOOL_DEFINITIONS: Dict[str, ToolMetadata] = {
    "create": ToolMetadata(
        name="teamspaces_create",
        description="Create a new teamspace for team collaboration",
        sdk_method="create_teamspace",
        returns_entity_type="teamspace",
        parameters=[
            ToolParameter(
                name="name",
                type="str",
                required=True,
                description="Teamspace name (required)",
            ),
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (auto-detected from context)",
                auto_fill_from_context=True,
            ),
            ToolParameter(
                name="description_html",
                type="Optional[str]",
                required=False,
                description="HTML description of the teamspace",
            ),
            ToolParameter(
                name="logo_props",
                type="Optional[dict]",
                required=False,
                description="Logo configuration JSON",
            ),
            ToolParameter(
                name="lead",
                type="str",
                required=False,
                description="Team lead user ID (optional)",
            ),
        ],
    ),
    "list": ToolMetadata(
        name="teamspaces_list",
        description="List teamspaces in the workspace",
        sdk_method="list_teamspaces",
        parameters=[
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (auto-detected from context)",
                auto_fill_from_context=True,
            ),
        ],
    ),
    "retrieve": ToolMetadata(
        name="teamspaces_retrieve",
        description="Retrieve a single teamspace by ID",
        sdk_method="retrieve_teamspace",
        parameters=[
            ToolParameter(
                name="teamspace_id",
                type="str",
                required=True,
                description="Teamspace ID (required)",
            ),
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (auto-detected from context)",
                auto_fill_from_context=True,
            ),
        ],
    ),
    "update": ToolMetadata(
        name="teamspaces_update",
        description="Update teamspace details",
        sdk_method="update_teamspace",
        returns_entity_type="teamspace",
        parameters=[
            ToolParameter(
                name="teamspace_id",
                type="str",
                required=True,
                description="Teamspace ID (required)",
            ),
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (auto-detected from context)",
                auto_fill_from_context=True,
            ),
            ToolParameter(
                name="name",
                type="Optional[str]",
                required=False,
                description="New teamspace name",
            ),
            ToolParameter(
                name="description_html",
                type="Optional[str]",
                required=False,
                description="New HTML description",
            ),
            ToolParameter(
                name="logo_props",
                type="Optional[dict]",
                required=False,
                description="New logo configuration JSON",
            ),
            ToolParameter(
                name="lead",
                type="str",
                required=False,
                description="Team lead user ID (use empty string to remove the lead)",
            ),
        ],
    ),
    "delete": ToolMetadata(
        name="teamspaces_delete",
        description="Delete a teamspace",
        sdk_method="delete_teamspace",
        parameters=[
            ToolParameter(
                name="teamspace_id",
                type="str",
                required=True,
                description="Teamspace ID (required)",
            ),
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (auto-detected from context)",
                auto_fill_from_context=True,
            ),
        ],
    ),
    "add_members": ToolMetadata(
        name="teamspaces_add_members",
        description="Add members to a teamspace",
        sdk_method="add_teamspace_members",
        parameters=[
            ToolParameter(
                name="teamspace_id",
                type="str",
                required=True,
                description="Teamspace ID (required)",
            ),
            ToolParameter(
                name="member_ids",
                type="List[str]",
                required=True,
                description="List of member (user) IDs to add (required)",
            ),
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (auto-detected from context)",
                auto_fill_from_context=True,
            ),
        ],
    ),
    "list_members": ToolMetadata(
        name="teamspaces_list_members",
        description="List members in a teamspace",
        sdk_method="list_teamspace_members",
        parameters=[
            ToolParameter(
                name="teamspace_id",
                type="str",
                required=True,
                description="Teamspace ID (required)",
            ),
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (auto-detected from context)",
                auto_fill_from_context=True,
            ),
        ],
    ),
    "remove_members": ToolMetadata(
        name="teamspaces_remove_members",
        description="Remove members from a teamspace",
        sdk_method="remove_teamspace_members",
        parameters=[
            ToolParameter(
                name="teamspace_id",
                type="str",
                required=True,
                description="Teamspace ID (required)",
            ),
            ToolParameter(
                name="member_ids",
                type="List[str]",
                required=True,
                description="List of member (user) IDs to remove (required)",
            ),
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (auto-detected from context)",
                auto_fill_from_context=True,
            ),
        ],
    ),
    "add_projects": ToolMetadata(
        name="teamspaces_add_projects",
        description="Add projects to a teamspace",
        sdk_method="add_teamspace_projects",
        parameters=[
            ToolParameter(
                name="teamspace_id",
                type="str",
                required=True,
                description="Teamspace ID (required)",
            ),
            ToolParameter(
                name="project_ids",
                type="List[str]",
                required=True,
                description="List of project IDs to add (required)",
            ),
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (auto-detected from context)",
                auto_fill_from_context=True,
            ),
        ],
        returns_entity_type="teamspace",
    ),
    "list_projects": ToolMetadata(
        name="teamspaces_list_projects",
        description="List projects in a teamspace",
        sdk_method="list_teamspace_projects",
        parameters=[
            ToolParameter(
                name="teamspace_id",
                type="str",
                required=True,
                description="Teamspace ID (required)",
            ),
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (auto-detected from context)",
                auto_fill_from_context=True,
            ),
        ],
    ),
    "remove_projects": ToolMetadata(
        name="teamspaces_remove_projects",
        description="Remove projects from a teamspace",
        sdk_method="remove_teamspace_projects",
        parameters=[
            ToolParameter(
                name="teamspace_id",
                type="str",
                required=True,
                description="Teamspace ID (required)",
            ),
            ToolParameter(
                name="project_ids",
                type="List[str]",
                required=True,
                description="List of project IDs to remove (required)",
            ),
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (auto-detected from context)",
                auto_fill_from_context=True,
            ),
        ],
    ),
}


# ============================================================================
# TOOL FACTORY
# ============================================================================


def get_teamspace_tools(method_executor, context):
    """Return LangChain tools for the teamspaces category using auto-generation from metadata."""
    return generate_tools_for_category(
        category="teamspaces",
        method_executor=method_executor,
        context=context,
        tool_definitions=TEAMSPACE_TOOL_DEFINITIONS,
    )
