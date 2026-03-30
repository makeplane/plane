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
Initiatives API tools for Plane strategic planning operations.
"""

from typing import Dict

from pi.services.actions.tool_generator import generate_tools_for_category
from pi.services.actions.tool_metadata import ToolMetadata
from pi.services.actions.tool_metadata import ToolParameter

# ============================================================================
# INITIATIVES TOOL DEFINITIONS
# ============================================================================

INITIATIVE_TOOL_DEFINITIONS: Dict[str, ToolMetadata] = {
    "create": ToolMetadata(
        name="initiatives_create",
        description="Create a new strategic initiative",
        sdk_method="create_initiative",
        returns_entity_type="initiative",
        parameters=[
            ToolParameter(
                name="name",
                type="str",
                required=True,
                description="Initiative name (required)",
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
                description="HTML description of the initiative",
            ),
            ToolParameter(
                name="start_date",
                type="Optional[str]",
                required=False,
                description="Initiative start date (YYYY-MM-DD)",
            ),
            ToolParameter(
                name="end_date",
                type="Optional[str]",
                required=False,
                description="Initiative end date (YYYY-MM-DD)",
            ),
            ToolParameter(
                name="state",
                type="Optional[str]",
                required=False,
                description="Initiative state. Must be one of: DRAFT, PLANNED, ACTIVE, COMPLETED, CLOSED (uppercase required). Defaults to DRAFT if not provided.",  # noqa: E501
            ),
            ToolParameter(
                name="lead",
                type="Optional[str]",
                required=False,
                description="Initiative lead user ID",
            ),
        ],
    ),
    "update": ToolMetadata(
        name="initiatives_update",
        description="Update initiative details",
        sdk_method="update_initiative",
        returns_entity_type="initiative",
        parameters=[
            ToolParameter(
                name="initiative_id",
                type="str",
                required=True,
                description="Initiative ID (required)",
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
                description="New initiative name",
            ),
            ToolParameter(
                name="description_html",
                type="Optional[str]",
                required=False,
                description="New HTML description",
            ),
            ToolParameter(
                name="start_date",
                type="Optional[str]",
                required=False,
                description="New start date (YYYY-MM-DD)",
            ),
            ToolParameter(
                name="end_date",
                type="Optional[str]",
                required=False,
                description="New end date (YYYY-MM-DD)",
            ),
            ToolParameter(
                name="logo_props",
                type="Optional[dict]",
                required=False,
                description="New logo configuration JSON",
            ),
            ToolParameter(
                name="state",
                type="Optional[str]",
                required=False,
                description="New initiative state. Must be one of: DRAFT, PLANNED, ACTIVE, COMPLETED, CLOSED (uppercase required)",
            ),
            ToolParameter(
                name="lead",
                type="Optional[str]",
                required=False,
                description="New initiative lead user ID",
            ),
        ],
    ),
    "delete": ToolMetadata(
        name="initiatives_delete",
        description="Delete an initiative",
        sdk_method="delete_initiative",
        parameters=[
            ToolParameter(
                name="initiative_id",
                type="str",
                required=True,
                description="Initiative ID (required)",
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
    # Label operations
    "create_label": ToolMetadata(
        name="initiatives_create_label",
        description="Create a workspace-level initiative label (can later be attached to initiatives)",
        sdk_method="create_initiative_label",
        returns_entity_type="initiative_label",
        parameters=[
            ToolParameter(
                name="name",
                type="str",
                required=True,
                description="Label name (required)",
            ),
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (auto-detected from context)",
                auto_fill_from_context=True,
            ),
            ToolParameter(
                name="color",
                type="Optional[str]",
                required=False,
                description="Label color hex code",
            ),
            ToolParameter(
                name="description",
                type="Optional[str]",
                required=False,
                description="Label description",
            ),
        ],
    ),
    "list_labels": ToolMetadata(
        name="initiatives_list_labels",
        description="List all workspace-level initiative labels",
        sdk_method="list_initiative_labels",
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
    "retrieve_label": ToolMetadata(
        name="initiatives_retrieve_label",
        description="Get a single initiative label by ID",
        sdk_method="retrieve_initiative_label",
        parameters=[
            ToolParameter(
                name="label_id",
                type="str",
                required=True,
                description="Label ID (required)",
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
    "update_label": ToolMetadata(
        name="initiatives_update_label",
        description="Update an initiative label",
        sdk_method="update_initiative_label",
        returns_entity_type="initiative_label",
        parameters=[
            ToolParameter(
                name="label_id",
                type="str",
                required=True,
                description="Label ID (required)",
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
                description="New label name",
            ),
            ToolParameter(
                name="color",
                type="Optional[str]",
                required=False,
                description="New label color hex code",
            ),
            ToolParameter(
                name="description",
                type="Optional[str]",
                required=False,
                description="New label description",
            ),
        ],
    ),
    "delete_label": ToolMetadata(
        name="initiatives_delete_label",
        description="Delete an initiative label",
        sdk_method="delete_initiative_label",
        parameters=[
            ToolParameter(
                name="label_id",
                type="str",
                required=True,
                description="Label ID (required)",
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
    "add_labels": ToolMetadata(
        name="initiatives_add_labels",
        description="Attach existing labels to an initiative",
        sdk_method="add_initiative_labels",
        parameters=[
            ToolParameter(
                name="initiative_id",
                type="str",
                required=True,
                description="Initiative ID (required)",
            ),
            ToolParameter(
                name="label_ids",
                type="List[str]",
                required=True,
                description="List of label IDs to attach (required)",
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
    "remove_labels": ToolMetadata(
        name="initiatives_remove_labels",
        description="Detach labels from an initiative",
        sdk_method="remove_initiative_labels",
        parameters=[
            ToolParameter(
                name="initiative_id",
                type="str",
                required=True,
                description="Initiative ID (required)",
            ),
            ToolParameter(
                name="label_ids",
                type="List[str]",
                required=True,
                description="List of label IDs to detach (required)",
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
    # Project operations
    "add_projects": ToolMetadata(
        name="initiatives_add_projects",
        description="Link projects to an initiative",
        sdk_method="add_initiative_projects",
        parameters=[
            ToolParameter(
                name="initiative_id",
                type="str",
                required=True,
                description="Initiative ID (required)",
            ),
            ToolParameter(
                name="project_ids",
                type="List[str]",
                required=True,
                description="List of project IDs to link (required)",
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
    "list_projects": ToolMetadata(
        name="initiatives_list_projects",
        description="List projects linked to an initiative",
        sdk_method="list_initiative_projects",
        parameters=[
            ToolParameter(
                name="initiative_id",
                type="str",
                required=True,
                description="Initiative ID (required)",
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
        name="initiatives_remove_projects",
        description="Unlink projects from an initiative",
        sdk_method="remove_initiative_projects",
        parameters=[
            ToolParameter(
                name="initiative_id",
                type="str",
                required=True,
                description="Initiative ID (required)",
            ),
            ToolParameter(
                name="project_ids",
                type="List[str]",
                required=True,
                description="List of project IDs to unlink (required)",
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
    # Epic operations
    "add_epics": ToolMetadata(
        name="initiatives_add_epics",
        description="Link epics to an initiative",
        sdk_method="add_initiative_epics",
        parameters=[
            ToolParameter(
                name="initiative_id",
                type="str",
                required=True,
                description="Initiative ID (required)",
            ),
            ToolParameter(
                name="epic_ids",
                type="List[str]",
                required=True,
                description="List of epic IDs to link (required)",
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
    "list_epics": ToolMetadata(
        name="initiatives_list_epics",
        description="List epics linked to an initiative",
        sdk_method="list_initiative_epics",
        parameters=[
            ToolParameter(
                name="initiative_id",
                type="str",
                required=True,
                description="Initiative ID (required)",
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
    "remove_epics": ToolMetadata(
        name="initiatives_remove_epics",
        description="Unlink epics from an initiative",
        sdk_method="remove_initiative_epics",
        parameters=[
            ToolParameter(
                name="initiative_id",
                type="str",
                required=True,
                description="Initiative ID (required)",
            ),
            ToolParameter(
                name="epic_ids",
                type="List[str]",
                required=True,
                description="List of epic IDs to unlink (required)",
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


def get_initiative_tools(method_executor, context):
    """Return LangChain tools for the initiatives category using auto-generation from metadata."""
    return generate_tools_for_category(
        category="initiatives",
        method_executor=method_executor,
        context=context,
        tool_definitions=INITIATIVE_TOOL_DEFINITIONS,
    )
