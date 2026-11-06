"""Change history for a work item."""

from __future__ import annotations

from typing import Any, Literal

from fastmcp import FastMCP
from plane.models.work_items import PaginatedWorkItemActivityResponse, WorkItemActivity

from plane_mcp.client import get_plane_client_context
from plane_mcp.toolkit import Action, build_annotations, build_description, envelope, missing, needs, page_params

NAME = "workitem_activity"
TITLE = "Work item activity"

ACTIONS = (
    Action("list", ("project_id", "workitem_id"), ("cursor", "per_page"), read=True),
    Action("retrieve", ("project_id", "workitem_id", "activity_id"), read=True),
)

LEGACY = {
    "list_work_item_activities": "list",
    "retrieve_work_item_activity": "retrieve",
}


def register(mcp: FastMCP) -> None:
    @mcp.tool(
        name=NAME,
        description=build_description("Change history for a work item.", ACTIONS),
        annotations=build_annotations(TITLE, ACTIONS),
    )
    def workitem_activity(
        action: Literal["list", "retrieve"],
        project_id: str = "",
        workitem_id: str = "",
        activity_id: str = "",
        cursor: str = "",
        per_page: int = 0,
    ) -> WorkItemActivity | dict[str, Any] | str:
        client, workspace_slug = get_plane_client_context()

        if error := needs(action, project_id=project_id, workitem_id=workitem_id):
            return error

        if action == "list":
            response: PaginatedWorkItemActivityResponse = client.work_items.activities.list(
                workspace_slug=workspace_slug,
                project_id=project_id,
                work_item_id=workitem_id,
                params=page_params(cursor, per_page),
            )
            return envelope(response)

        if not activity_id:
            return missing(action, "activity_id")
        return client.work_items.activities.retrieve(
            workspace_slug=workspace_slug,
            project_id=project_id,
            work_item_id=workitem_id,
            activity_id=activity_id,
        )
