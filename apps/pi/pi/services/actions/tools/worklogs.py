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
Worklogs API tools for Plane time tracking operations.
"""

import contextlib
import re
import uuid
from typing import Any
from typing import Dict

from pi.services.actions.tool_generator import generate_tools_for_category
from pi.services.actions.tool_metadata import ToolMetadata
from pi.services.actions.tool_metadata import ToolParameter


# Pre-handler combining project resolution AND duration parsing
async def _worklog_pre_handler(
    metadata: ToolMetadata,
    kwargs: Dict[str, Any],
    context: Dict[str, Any],
    category: str,
    method_key: str,
    method_executor: Any,
) -> Dict[str, Any]:
    """Resolve project_id and parse duration string to minutes."""

    # 1. Project ID Resolution
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
            pass

    # 2. Duration Parsing (e.g., "1h 30m" -> 90)
    duration = kwargs.get("duration")
    if duration is not None:
        if isinstance(duration, str):
            # Try to parse string format "Xh Ym" or just "Xm"
            total_minutes = 0

            # Simple regex for parsing
            # Matches "1h", "1.5h", "30m", "1h 30m"
            hours_match = re.search(r"(\d+(?:\.\d+)?)\s*h", duration.lower())
            minutes_match = re.search(r"(\d+(?:\.\d+)?)\s*m", duration.lower())

            if hours_match:
                with contextlib.suppress(ValueError):
                    hours = int(float(hours_match.group(1)) * 60)
                    total_minutes += hours

            if minutes_match:
                with contextlib.suppress(ValueError):
                    mins = int(float(minutes_match.group(1)))
                    total_minutes += mins

            # If regex matched nothing but it's a digit string, treat as minutes
            if not hours_match and not minutes_match:
                if duration.isdigit():
                    total_minutes = int(duration)

            # If we found something, update kwargs
            if total_minutes > 0:
                kwargs["duration"] = total_minutes

        # If int/float passed directly, ensure int
        elif isinstance(duration, (int, float)):
            kwargs["duration"] = int(duration)
    return kwargs


WORKLOGS_TOOL_DEFINITIONS = {
    "get_summary": ToolMetadata(
        name="worklogs_get_summary",
        description=(
            "Get a project-level worklog summary (total logged time and any available breakdowns) "
            "for the entire project. This returns an aggregate summary, not individual worklog entries."
        ),
        sdk_method="get_project_worklog_summary",
        parameters=[
            ToolParameter(name="project_id", description="Project ID", required=True, type="str"),
            ToolParameter(
                name="workspace_slug",
                description="Workspace slug (optional, auto-filled)",
                required=False,
                type="Optional[str]",
                auto_fill_from_context=True,
            ),
        ],
    ),
    "create": ToolMetadata(
        name="worklogs_create",
        description="Create a new worklog (time entry).",
        sdk_method="create_issue_worklog",
        parameters=[
            ToolParameter(name="issue_id", description="Issue ID", required=True, type="str"),
            ToolParameter(name="description", description="Worklog description/note", required=True, type="str"),
            ToolParameter(
                name="duration", description="Duration (e.g., '1h 30m' or minutes as int)", required=True, type="Any"
            ),  # Accepting Any to allow string
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
        pre_handler=_worklog_pre_handler,
        returns_entity_type="worklog",
    ),
    "update": ToolMetadata(
        name="worklogs_update",
        description="Update time entry.",
        sdk_method="update_issue_worklog",
        parameters=[
            ToolParameter(name="worklog_id", description="Worklog ID", required=True, type="str"),
            ToolParameter(name="issue_id", description="Issue ID", required=True, type="str"),
            ToolParameter(name="description", description="Worklog description", required=False, type="Optional[str]"),
            ToolParameter(name="duration", description="Duration (e.g., '1h 30m')", required=False, type="Any"),
            ToolParameter(name="project_id", description="Project ID", required=False, type="Optional[str]", auto_fill_from_context=True),
            ToolParameter(name="workspace_slug", description="Workspace slug", required=False, type="Optional[str]", auto_fill_from_context=True),
            ToolParameter(name="created_by", description="User ID who created", required=False, type="Optional[str]"),
            ToolParameter(name="updated_by", description="User ID who updated", required=False, type="Optional[str]"),
        ],
        pre_handler=_worklog_pre_handler,
        returns_entity_type="worklog",
    ),
    "delete": ToolMetadata(
        name="worklogs_delete",
        description="Delete time entry.",
        sdk_method="delete_issue_worklog",
        parameters=[
            ToolParameter(name="worklog_id", description="Worklog ID", required=True, type="str"),
            ToolParameter(name="issue_id", description="Issue ID", required=True, type="str"),
            ToolParameter(name="project_id", description="Project ID", required=False, type="Optional[str]", auto_fill_from_context=True),
            ToolParameter(name="workspace_slug", description="Workspace slug", required=False, type="Optional[str]", auto_fill_from_context=True),
        ],
        pre_handler=_worklog_pre_handler,
        returns_entity_type="worklog",
    ),
}


def get_worklog_tools(method_executor, context):
    """Return LangChain tools for the worklogs category using method_executor and context."""
    return generate_tools_for_category("worklogs", method_executor, context, WORKLOGS_TOOL_DEFINITIONS)
