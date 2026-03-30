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
Comments API tools for Plane issue comments operations.
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
            # Best effort, proceed without resolution if it fails
            pass

    return kwargs


COMMENTS_TOOL_DEFINITIONS = {
    "create": ToolMetadata(
        name="comments_create",
        description="Create a comment on an issue.",
        sdk_method="create_work_item_comment",
        parameters=[
            ToolParameter(name="issue_id", description="Issue ID", required=True, type="str"),
            ToolParameter(name="comment_html", description="Comment content in HTML format", required=True, type="str"),
            ToolParameter(
                name="project_id", description="Project ID (optional, auto-filled)", required=False, type="Optional[str]", auto_fill_from_context=True
            ),
            ToolParameter(
                name="workspace_slug",
                description="Workspace slug (optional, auto-filled)",
                required=False,
                type="Optional[str]",
                auto_fill_from_context=True,
            ),
            ToolParameter(name="external_source", description="External source identifier (e.g., 'jira')", required=False, type="Optional[str]"),
            ToolParameter(name="external_id", description="External system ID", required=False, type="Optional[str]"),
        ],
        pre_handler=_resolve_project_pre_handler,
        returns_entity_type="comment",
    ),
    "update": ToolMetadata(
        name="comments_update",
        description="Update comment details.",
        sdk_method="update_work_item_comment",
        parameters=[
            ToolParameter(name="comment_id", description="Comment ID", required=True, type="str"),
            ToolParameter(name="issue_id", description="Issue ID", required=True, type="str"),
            ToolParameter(name="comment_html", description="Comment content in HTML format", required=False, type="Optional[str]"),
            ToolParameter(
                name="project_id", description="Project ID (optional, auto-filled)", required=False, type="Optional[str]", auto_fill_from_context=True
            ),
            ToolParameter(
                name="workspace_slug",
                description="Workspace slug (optional, auto-filled)",
                required=False,
                type="Optional[str]",
                auto_fill_from_context=True,
            ),
            ToolParameter(name="external_source", description="External source identifier", required=False, type="Optional[str]"),
            ToolParameter(name="external_id", description="External system ID", required=False, type="Optional[str]"),
        ],
        pre_handler=_resolve_project_pre_handler,
        returns_entity_type="comment",
    ),
    "delete": ToolMetadata(
        name="comments_delete",
        description="Delete a comment.",
        sdk_method="delete_work_item_comment",
        parameters=[
            ToolParameter(name="comment_id", description="Comment ID", required=True, type="str"),
            ToolParameter(name="issue_id", description="Issue ID", required=True, type="str"),
            ToolParameter(
                name="project_id", description="Project ID (optional, auto-filled)", required=False, type="Optional[str]", auto_fill_from_context=True
            ),
            ToolParameter(
                name="workspace_slug",
                description="Workspace slug (optional, auto-filled)",
                required=False,
                type="Optional[str]",
                auto_fill_from_context=True,
            ),
        ],
        pre_handler=_resolve_project_pre_handler,
        returns_entity_type="comment",
    ),
}


def get_comment_tools(method_executor, context):
    """Return LangChain tools for the comments category using method_executor and context."""
    return generate_tools_for_category("comments", method_executor, context, COMMENTS_TOOL_DEFINITIONS)
