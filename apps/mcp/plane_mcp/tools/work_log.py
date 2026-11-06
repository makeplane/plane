"""Time logged against a work item."""

from __future__ import annotations

from typing import Literal

from fastmcp import FastMCP
from plane.models.work_items import WorkItemWorkLog

from plane_mcp.client import get_plane_client_context
from plane_mcp.toolkit import Action, build_annotations, build_description, missing, needs, plan_gated

NAME = "work_log"
TITLE = "Work logs"

ACTIONS = (
    # No cursor/per_page: the endpoint returns every row and the SDK gives back a plain list.
    Action("list", ("project_id", "workitem_id"), read=True),
    Action("create", ("project_id", "workitem_id", "duration"), ("description",)),
    Action("update", ("project_id", "workitem_id", "work_log_id"), ("duration", "description")),
    Action("delete", ("project_id", "workitem_id", "work_log_id"), destructive=True),
)

FOOTER = "duration is in minutes."

LEGACY = {
    "list_work_logs": "list",
    "create_work_log": "create",
    "update_work_log": "update",
    "delete_work_log": "delete",
}


def register(mcp: FastMCP) -> None:
    @mcp.tool(
        name=NAME,
        description=build_description("Time logged against a work item.", ACTIONS, FOOTER),
        annotations=build_annotations(TITLE, ACTIONS),
    )
    @plan_gated("Time tracking")
    def work_log(
        action: Literal["list", "create", "update", "delete"],
        project_id: str = "",
        workitem_id: str = "",
        work_log_id: str = "",
        duration: int = 0,
        description: str = "",
    ) -> WorkItemWorkLog | list[WorkItemWorkLog] | str | None:
        client, workspace_slug = get_plane_client_context()

        if error := needs(action, project_id=project_id, workitem_id=workitem_id):
            return error

        if action == "list":
            return client.work_items.work_logs.list(
                workspace_slug=workspace_slug,
                project_id=project_id,
                work_item_id=workitem_id,
            )

        payload: dict[str, object] = {}
        if duration:
            payload["duration"] = duration
        if description:
            payload["description"] = description

        if action == "create":
            if not duration:
                return missing(action, "duration")
            return client.work_items.work_logs.create(
                workspace_slug=workspace_slug,
                project_id=project_id,
                work_item_id=workitem_id,
                data=payload,
            )

        if not work_log_id:
            return missing(action, "work_log_id")

        if action == "update":
            return client.work_items.work_logs.update(
                workspace_slug=workspace_slug,
                project_id=project_id,
                work_item_id=workitem_id,
                work_log_id=work_log_id,
                data=payload,
            )

        client.work_items.work_logs.delete(
            workspace_slug=workspace_slug,
            project_id=project_id,
            work_item_id=workitem_id,
            work_log_id=work_log_id,
        )
        return None
