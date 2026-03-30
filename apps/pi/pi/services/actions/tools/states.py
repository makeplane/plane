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
States API tools for Plane workflow state management.

MIGRATED TO AUTO-GENERATED TOOLS
Tool metadata defined in this file (STATE_TOOL_DEFINITIONS) for modularity.
Old manual definitions kept below for comparison/rollback safety.
"""

from typing import Dict

from pi.services.actions.tool_generator import generate_tools_for_category
from pi.services.actions.tool_metadata import ToolMetadata
from pi.services.actions.tool_metadata import ToolParameter

# Tool metadata for states category
STATE_TOOL_DEFINITIONS: Dict[str, ToolMetadata] = {
    "create": ToolMetadata(
        name="states_create",
        description="Create a new workflow state",
        sdk_method="create_state",
        returns_entity_type="state",
        parameters=[
            ToolParameter(name="name", type="str", required=True, description="State name (required)"),
            ToolParameter(name="color", type="str", required=True, description="State color in hex format (required)"),
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
            ToolParameter(name="description", type="Optional[str]", required=False, description="State description"),
            ToolParameter(
                name="group",
                type="Optional[str]",
                required=False,
                description="State group (backlog, unstarted, started, completed, cancelled)",
            ),
            ToolParameter(name="sequence", type="Optional[int]", required=False, description="Display sequence order"),
            ToolParameter(name="is_triage", type="Optional[bool]", required=False, description="Whether this is a triage state"),
            ToolParameter(name="default", type="Optional[bool]", required=False, description="Whether this is the default state"),
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
        name="states_update",
        description="Update an existing workflow state",
        sdk_method="update_state",
        returns_entity_type="state",
        parameters=[
            ToolParameter(name="state_id", type="str", required=True, description="State ID (required)"),
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
            ToolParameter(name="name", type="Optional[str]", required=False, description="New state name"),
            ToolParameter(name="color", type="Optional[str]", required=False, description="New state color"),
            ToolParameter(name="description", type="Optional[str]", required=False, description="New state description"),
            ToolParameter(name="sequence", type="Optional[int]", required=False, description="Display sequence order"),
            ToolParameter(
                name="group",
                type="Optional[str]",
                required=False,
                description="State group (backlog, unstarted, started, completed, cancelled)",
            ),
            ToolParameter(name="is_triage", type="Optional[bool]", required=False, description="Whether this is a triage state"),
            ToolParameter(name="default", type="Optional[bool]", required=False, description="Whether this is the default state"),
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


def get_state_tools(method_executor, context):
    """Return LangChain tools for the states category using auto-generation from metadata."""

    state_tools = generate_tools_for_category(
        category="states",
        method_executor=method_executor,
        context=context,
        tool_definitions=STATE_TOOL_DEFINITIONS,
    )

    return state_tools
