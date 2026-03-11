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
Activity API tools for Plane activity tracking operations.
"""

from typing import Any
from typing import Dict

from pi import logger
from pi.services.actions.tool_generator import generate_tools_for_category
from pi.services.actions.tool_metadata import ToolMetadata
from pi.services.actions.tool_metadata import ToolParameter

# ============================================================================
# ACTIVITY-SPECIFIC HANDLER FUNCTIONS
# ============================================================================
log = logger.getChild("activity")


async def _activity_pre_handler(
    metadata: ToolMetadata,
    kwargs: Dict[str, Any],
    context: Dict[str, Any],
    category: str,
    method_key: str,
    method_executor: Any = None,
) -> Dict[str, Any]:
    """Pre-processing handler for activity tools.

    Handles:
    - Auto-detect project_id from issue_id if missing
    """
    # If project_id is missing but we have issue_id, look it up in the database
    if kwargs.get("issue_id") and not kwargs.get("project_id"):
        issue_id = kwargs["issue_id"]
        log.debug(f"project_id missing for activity_{method_key}, looking up issue_id={issue_id}")

        try:
            from pi.app.api.v1.helpers.plane_sql_queries import get_issue_identifier_for_artifact

            work_item = await get_issue_identifier_for_artifact(issue_id)
            if work_item and work_item.get("project_id"):
                kwargs["project_id"] = work_item["project_id"]
                log.debug(f"Auto-filled project_id={kwargs['project_id']} from work item lookup")
            else:
                log.warning(f"Could not find project_id for issue_id={issue_id}")
        except Exception as e:
            log.error(f"Failed to lookup work item for project_id: {e}")
            # Don't fail the entire operation, let the SDK call fail with proper error

    return kwargs


# ============================================================================
# ACTIVITY TOOL DEFINITIONS
# ============================================================================

ACTIVITY_TOOL_DEFINITIONS: Dict[str, ToolMetadata] = {
    "list": ToolMetadata(
        name="activity_list",
        description="List activity for a specific work item",
        sdk_method="list_work_item_activities",
        pre_handler=_activity_pre_handler,
        parameters=[
            ToolParameter(
                name="issue_id",
                type="str",
                required=True,
                description="Work item ID (required) - activities are specific to individual work items",
            ),
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
    ),
    "retrieve": ToolMetadata(
        name="activity_retrieve",
        description="Get a single activity by ID",
        sdk_method="retrieve_work_item_activity",
        pre_handler=_activity_pre_handler,
        parameters=[
            ToolParameter(
                name="activity_id",
                type="str",
                required=True,
                description="Activity ID (required)",
            ),
            ToolParameter(
                name="issue_id",
                type="str",
                required=True,
                description="Work item ID (required)",
            ),
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
    ),
}


# ============================================================================
# TOOL FACTORY
# ============================================================================


def get_activity_tools(method_executor, context):
    """Return LangChain tools for the activity category using auto-generation from metadata."""
    return generate_tools_for_category(
        category="activity",
        method_executor=method_executor,
        context=context,
        tool_definitions=ACTIVITY_TOOL_DEFINITIONS,
    )
