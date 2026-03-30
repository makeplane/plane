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
Links API tools for Plane issue link management.
"""

import uuid
from typing import Any
from typing import Dict

from pi.services.actions.tool_generator import generate_tools_for_category
from pi.services.actions.tool_metadata import ToolMetadata
from pi.services.actions.tool_metadata import ToolParameter


# Pre-handler to resolve project_id from issue_id if missing
async def _resolve_project_pre_handler(
    metadata: ToolMetadata,
    kwargs: Dict[str, Any],
    context: Dict[str, Any],
    category: str,
    method_key: str,
    method_executor: Any,
) -> Dict[str, Any]:
    """Resolve project_id from issue_id if it is missing or invalid."""
    issue_id = kwargs.get("issue_id")
    project_id = kwargs.get("project_id")

    should_resolve = False
    if issue_id and not project_id:
        should_resolve = True
    elif issue_id and project_id:
        try:
            uuid.UUID(str(project_id))
        except (ValueError, AttributeError):
            should_resolve = True

    if should_resolve:
        try:
            from pi.app.api.v1.helpers.plane_sql_queries import get_issue_identifier_for_artifact

            issue_info = await get_issue_identifier_for_artifact(str(issue_id))
            if issue_info and issue_info.get("project_id"):
                kwargs["project_id"] = issue_info["project_id"]
        except Exception:
            # Best effort, proceed without resolution
            pass

    return kwargs


LINKS_TOOL_DEFINITIONS = {
    "create": ToolMetadata(
        name="links_create",
        description="Create a link for an issue.",
        sdk_method="create_work_item_link",
        parameters=[
            ToolParameter(name="issue_id", description="UUID of the work item", required=True, type="str"),
            ToolParameter(name="url", description="The URL of the link", required=True, type="str"),
            ToolParameter(name="title", description="Title/label for the link", required=False, type="Optional[str]"),
            ToolParameter(name="project_id", description="UUID of the project", required=False, type="Optional[str]", auto_fill_from_context=True),
            ToolParameter(name="workspace_slug", description="Workspace slug", required=False, type="Optional[str]", auto_fill_from_context=True),
            ToolParameter(name="metadata", description="Link metadata", required=False, type="Optional[dict]"),
        ],
        pre_handler=_resolve_project_pre_handler,
        returns_entity_type="link",
    ),
    "update": ToolMetadata(
        name="links_update",
        description="Update link details.",
        sdk_method="update_issue_link",
        parameters=[
            ToolParameter(name="link_id", description="UUID of the link", required=True, type="str"),
            ToolParameter(name="issue_id", description="UUID of the work item", required=True, type="str"),
            ToolParameter(name="url", description="New URL", required=False, type="Optional[str]"),
            ToolParameter(name="title", description="New title", required=False, type="Optional[str]"),
            ToolParameter(name="project_id", description="UUID of the project", required=False, type="Optional[str]", auto_fill_from_context=True),
            ToolParameter(name="workspace_slug", description="Workspace slug", required=False, type="Optional[str]", auto_fill_from_context=True),
            ToolParameter(name="metadata", description="Link metadata", required=False, type="Optional[dict]"),
        ],
        pre_handler=_resolve_project_pre_handler,
        returns_entity_type="link",
    ),
    "delete": ToolMetadata(
        name="links_delete",
        description="Delete a link.",
        sdk_method="delete_work_item_link",
        parameters=[
            ToolParameter(name="link_id", description="UUID of the link", required=True, type="str"),
            ToolParameter(name="issue_id", description="UUID of the work item", required=True, type="str"),
            ToolParameter(name="project_id", description="UUID of the project", required=False, type="Optional[str]", auto_fill_from_context=True),
            ToolParameter(name="workspace_slug", description="Workspace slug", required=False, type="Optional[str]", auto_fill_from_context=True),
        ],
        pre_handler=_resolve_project_pre_handler,
        returns_entity_type="link",
    ),
}


def get_link_tools(method_executor, context):
    """Return LangChain tools for the links category using method_executor and context."""
    return generate_tools_for_category("links", method_executor, context, LINKS_TOOL_DEFINITIONS)
