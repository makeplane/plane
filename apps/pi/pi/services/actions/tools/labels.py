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
Labels API tools for Plane labeling operations.

MIGRATED TO AUTO-GENERATED TOOLS
Tool metadata defined in this file (LABEL_TOOL_DEFINITIONS) for modularity.
Old manual definitions kept below for comparison/rollback safety.
"""

from typing import Dict

from pi.services.actions.tool_generator import generate_tools_for_category

# Import tool metadata models
from pi.services.actions.tool_metadata import ToolMetadata
from pi.services.actions.tool_metadata import ToolParameter

# Tool metadata for labels category - single source of truth
LABEL_TOOL_DEFINITIONS: Dict[str, ToolMetadata] = {
    "create": ToolMetadata(
        name="labels_create",
        description="Create a new label",
        sdk_method="create_label",
        returns_entity_type="label",
        parameters=[
            ToolParameter(name="name", type="str", required=True, description="Label name (required)"),
            ToolParameter(name="color", type="str", required=True, description="Label color in hex format (required)"),
            ToolParameter(
                name="project_id",
                type="Optional[str]",
                required=False,
                description="Project ID (required - provide from conversation context or previous actions)",
                auto_fill_from_context=True,
            ),
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (provide if known, otherwise auto-detected)",
                auto_fill_from_context=True,
            ),
            ToolParameter(name="description", type="Optional[str]", required=False, description="Label description"),
            ToolParameter(name="parent", type="Optional[str]", required=False, description="Parent label ID for nested labels"),
            ToolParameter(name="sort_order", type="Optional[float]", required=False, description="Sort order for display (float)"),
            ToolParameter(
                name="external_source",
                type="Optional[str]",
                required=False,
                description='External source identifier (e.g., "jira")',
            ),
            ToolParameter(name="external_id", type="Optional[str]", required=False, description="External system ID"),
        ],
    ),
    "update": ToolMetadata(
        name="labels_update",
        description="Update an existing label",
        sdk_method="update_label",
        returns_entity_type="label",
        parameters=[
            ToolParameter(name="label_id", type="str", required=True, description="Label ID (required)"),
            ToolParameter(
                name="project_id",
                type="Optional[str]",
                required=False,
                description="Project ID (required - provide from conversation context or previous actions)",
                auto_fill_from_context=True,
            ),
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (provide if known, otherwise auto-detected)",
                auto_fill_from_context=True,
            ),
            ToolParameter(name="name", type="Optional[str]", required=False, description="New label name"),
            ToolParameter(name="color", type="Optional[str]", required=False, description="New label color"),
            ToolParameter(name="description", type="Optional[str]", required=False, description="New label description"),
            ToolParameter(name="parent", type="Optional[str]", required=False, description="Parent label ID for nested labels"),
            ToolParameter(name="sort_order", type="Optional[float]", required=False, description="Sort order for display (float)"),
            ToolParameter(
                name="external_source",
                type="Optional[str]",
                required=False,
                description='External source identifier (e.g., "jira")',
            ),
            ToolParameter(name="external_id", type="Optional[str]", required=False, description="External system ID"),
        ],
    ),
}

# Factory wired via CATEGORY_TO_PROVIDER in tools/__init__.py


def get_label_tools(method_executor, context):
    """Return LangChain tools for the labels category using auto-generation from metadata."""

    # Generate all label tools from local metadata
    label_tools = generate_tools_for_category(
        category="labels",
        method_executor=method_executor,
        context=context,
        tool_definitions=LABEL_TOOL_DEFINITIONS,
    )

    return label_tools
