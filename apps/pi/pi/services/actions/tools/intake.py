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
Intake API tools for Plane work item triage operations.
"""

from pi.services.actions.tool_generator import generate_tools_for_category
from pi.services.actions.tool_metadata import ToolMetadata
from pi.services.actions.tool_metadata import ToolParameter

# ============================================================================
# POST-PROCESSING HANDLERS
# ============================================================================


async def _intake_create_post_processor(metadata, result, kwargs, context, method_executor, category, method_key):
    """Post-process intake creation to also store the underlying work item entity.

    When an intake is created, the API returns both the intake ID and the underlying
    work item (issue) ID. We store both entities so placeholders can reference either.
    """
    if not result.get("success"):
        return result

    data = result.get("data", {})
    if not data:
        return result

    work_item_id = data.get("issue")
    if not work_item_id:
        return result

    intake_name = kwargs.get("name")
    if not intake_name:
        return result

    # Create workitem entity for placeholder resolution
    result["workitem_entity"] = {
        "entity_type": "intake_issue",
        "entity_name": intake_name,
        "entity_id": str(work_item_id),
        "entity_identifier": data.get("identifier"),
    }

    return result


async def _intake_list_post_processor(metadata, result, kwargs, context, method_executor, category, method_key):
    """
    Post-process intake list response to make IDs explicit.
    Replaces the raw nested structure with a flattened view that clearly distinguishes
    'intake_id' (the wrapper) from 'issue_id' (the actual work item).
    """
    if not result.get("success"):
        return result

    data = result.get("data", {})
    if isinstance(data, dict) and "results" in data:
        raw_results = data.get("results", [])
        formatted_results = []
        for item in raw_results:
            issue = item.get("issue_detail", {})
            formatted_item = {
                "intake_id": item.get("id"),
                "issue_id": issue.get("id"),  # Explicitly labeled for LLM
                "title": issue.get("name"),
                "identifier": issue.get("identifier"),
                "priority": issue.get("priority"),
                "state": issue.get("state"),
                "status": item.get("status"),  # Intake status (Pending/Snoozed/etc)
            }
            formatted_results.append(formatted_item)
        data["results"] = formatted_results
        result["data"] = data
    return result


# ============================================================================
# TOOL METADATA DEFINITIONS
# ============================================================================

INTAKE_TOOL_DEFINITIONS = {
    "create": ToolMetadata(
        name="intake_create",
        description="Submit work item to intake queue for triage. Creates a new intake item that can be reviewed and converted to a work item. Note: Assignees, dates, and comments are not supported via this specific tool/API (even if supported in the UI).",  # noqa: E501
        sdk_method="create_intake",
        parameters=[
            ToolParameter(name="name", type="str", required=True, description="Work item title (required)"),
            ToolParameter(name="project_id", type="Optional[str]", required=False, description="Project ID", auto_fill_from_context=True),
            ToolParameter(name="workspace_slug", type="Optional[str]", required=False, description="Workspace slug", auto_fill_from_context=True),
            ToolParameter(name="description_html", type="Optional[str]", required=False, description="Description in HTML format"),
            ToolParameter(name="priority", type="Optional[str]", required=False, description="Priority level (high, medium, low, urgent, none)"),
        ],
        returns_entity_type="intake",
        post_handler=_intake_create_post_processor,
    ),
    "list": ToolMetadata(
        name="intake_list",
        description="List intake items awaiting triage for a project.",
        sdk_method="list_intake",
        parameters=[
            ToolParameter(name="project_id", type="Optional[str]", required=False, description="Project ID", auto_fill_from_context=True),
            ToolParameter(name="workspace_slug", type="Optional[str]", required=False, description="Workspace slug", auto_fill_from_context=True),
            ToolParameter(name="per_page", type="Optional[int]", required=False, description="Number of results per page (default: 20)"),
            ToolParameter(name="cursor", type="Optional[str]", required=False, description="Pagination cursor"),
        ],
        returns_entity_type="intake",
        post_handler=_intake_list_post_processor,
    ),
    "retrieve": ToolMetadata(
        name="intake_retrieve",
        description="Get a single intake work item by ID.",
        sdk_method="retrieve_intake",
        parameters=[
            ToolParameter(
                name="intake_issue_id",
                type="str",
                required=True,
                description="The issue ID from the intake response (the 'issue' field, not the intake's own 'id' field)",
            ),
            ToolParameter(name="project_id", type="Optional[str]", required=False, description="Project ID", auto_fill_from_context=True),
            ToolParameter(name="workspace_slug", type="Optional[str]", required=False, description="Workspace slug", auto_fill_from_context=True),
        ],
    ),
    "update": ToolMetadata(
        name="intake_update",
        description="Update intake work item details before triage. Note: Assignees, dates, and comments are not supported via this specific tool/API.",  # noqa: E501
        sdk_method="update_intake",
        parameters=[
            ToolParameter(
                name="intake_issue_id",
                type="str",
                required=True,
                description="The issue ID from the intake response (the 'issue' field, not the intake's own 'id' field)",
            ),
            ToolParameter(name="project_id", type="Optional[str]", required=False, description="Project ID", auto_fill_from_context=True),
            ToolParameter(name="workspace_slug", type="Optional[str]", required=False, description="Workspace slug", auto_fill_from_context=True),
            # Issue fields (nested in WorkItemForIntakeRequest)
            ToolParameter(name="name", type="Optional[str]", required=False, description="Work item title"),
            ToolParameter(name="description_html", type="Optional[str]", required=False, description="Description in HTML format"),
            ToolParameter(name="priority", type="Optional[str]", required=False, description="Priority level (high, medium, low, urgent, none)"),
            # Intake-specific fields
            ToolParameter(
                name="status",
                type="Optional[int]",
                required=False,
                description="Intake status: 0=Pending, 1=Snoozed, 2=Accepted, 3=Declined, 4=Duplicate",
            ),
            ToolParameter(
                name="snoozed_till", type="Optional[str]", required=False, description="ISO datetime string to snooze until (use with status=snoozed)"
            ),
            ToolParameter(
                name="duplicate_to",
                type="Optional[str]",
                required=False,
                description="Work item ID to mark as duplicate of (use with status=duplicate)",
            ),
        ],
        returns_entity_type="intake",
    ),
    "delete": ToolMetadata(
        name="intake_delete",
        description="Remove an intake work item from the triage queue.",
        sdk_method="delete_intake",
        parameters=[
            ToolParameter(
                name="intake_issue_id",
                type="str",
                required=True,
                description="The issue ID from the intake response (the 'issue' field, not the intake's own 'id' field)",
            ),
            ToolParameter(name="project_id", type="Optional[str]", required=False, description="Project ID", auto_fill_from_context=True),
            ToolParameter(name="workspace_slug", type="Optional[str]", required=False, description="Workspace slug", auto_fill_from_context=True),
        ],
        returns_entity_type="intake",
    ),
}


# ============================================================================
# TOOL FACTORY
# ============================================================================


def get_intake_tools(method_executor, context):
    """Return LangChain tools for the intake category using auto-generation from metadata."""
    return generate_tools_for_category("intake", method_executor, context, INTAKE_TOOL_DEFINITIONS)
