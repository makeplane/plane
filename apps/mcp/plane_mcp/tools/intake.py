"""The intake (triage) queue for a project.

Intake items wrap an ordinary work item. Every action here takes the *work item*
id -- the `issue` field of an intake record -- not the intake record's own id.
"""

from __future__ import annotations

from typing import Any, Literal

from fastmcp import FastMCP
from plane.models.intake import CreateIntakeWorkItem, IntakeWorkItem, UpdateIntakeWorkItem
from plane.models.query_params import PaginatedQueryParams, RetrieveQueryParams
from plane.models.work_items import WorkItemForIntakeRequest

from plane_mcp.client import get_plane_client_context
from plane_mcp.toolkit import Action, as_params, build_annotations, build_description, envelope, missing, one_of, opt

NAME = "intake"
TITLE = "Intake queue"

PRIORITIES = ("urgent", "high", "medium", "low", "none")

ACTIONS = (
    Action("list", ("project_id",), ("cursor", "per_page"), read=True),
    Action("retrieve", ("project_id", "workitem_id"), read=True),
    Action("create", ("project_id", "name"), ("description_html", "priority")),
    Action(
        "update",
        ("project_id", "workitem_id"),
        ("status", "snoozed_till", "duplicate_to", "source", "source_email"),
        note="pass status to make a triage decision",
    ),
    Action("delete", ("project_id", "workitem_id"), destructive=True),
)

FOOTER = (
    "workitem_id is the `issue` field of an intake record, not the record's own id. "
    "status: -2 pending, -1 declined, 0 snoozed (needs snoozed_till), 1 accepted, "
    "2 duplicate (needs duplicate_to). "
    f"priority is one of: {', '.join(PRIORITIES)}."
)

LEGACY = {
    "list_intake_work_items": "list",
    "retrieve_intake_work_item": "retrieve",
    "create_intake_work_item": "create",
    "update_intake_work_item": "update",
    "delete_intake_work_item": "delete",
}


def register(mcp: FastMCP) -> None:
    @mcp.tool(
        name=NAME,
        description=build_description("The intake (triage) queue for a project.", ACTIONS, FOOTER),
        annotations=build_annotations(TITLE, ACTIONS),
    )
    def intake(
        action: Literal["list", "retrieve", "create", "update", "delete"],
        project_id: str = "",
        workitem_id: str = "",
        name: str = "",
        description_html: str = "",
        priority: str = "",
        # -2 is a real status, so status uses an explicit unset rather than 0.
        status: int | None = None,
        snoozed_till: str = "",
        duplicate_to: str = "",
        source: str = "",
        source_email: str = "",
        cursor: str = "",
        per_page: int = 0,
    ) -> IntakeWorkItem | dict[str, Any] | str | None:
        client, workspace_slug = get_plane_client_context()

        if not project_id:
            return missing(action, "project_id")

        if action == "list":
            response = client.intake.list(
                workspace_slug=workspace_slug,
                project_id=project_id,
                params=as_params(PaginatedQueryParams, cursor=cursor, per_page=per_page),
            )
            return envelope(response)

        if action == "create":
            if not name:
                return missing(action, "name")
            if error := one_of("priority", priority, PRIORITIES):
                return error
            return client.intake.create(
                workspace_slug=workspace_slug,
                project_id=project_id,
                # The SDK requires the work item nested under `issue`; a flat payload is rejected.
                data=CreateIntakeWorkItem(
                    issue=WorkItemForIntakeRequest(
                        name=name,
                        description_html=opt(description_html),
                        priority=opt(priority),
                    )
                ),
            )

        if not workitem_id:
            return missing(action, "workitem_id")

        if action == "retrieve":
            return client.intake.retrieve(
                workspace_slug=workspace_slug,
                project_id=project_id,
                work_item_id=workitem_id,
                params=as_params(RetrieveQueryParams),
            )

        if action == "update":
            if status == 0 and not snoozed_till:
                return "Error: snoozed_till is required when status=0 (snoozed)."
            if status == 2 and not duplicate_to:
                return "Error: duplicate_to is required when status=2 (duplicate)."
            if status is None and not (snoozed_till or duplicate_to or source or source_email):
                return missing(action, "status (or a source field to edit)")
            data = UpdateIntakeWorkItem(
                status=status,
                snoozed_till=opt(snoozed_till),
                duplicate_to=opt(duplicate_to),
                source=opt(source),
                source_email=opt(source_email),
            )
            # Triage fields go through the status endpoint; source metadata alone does not.
            if status is not None or snoozed_till or duplicate_to:
                return client.intake.update_status(
                    workspace_slug=workspace_slug,
                    project_id=project_id,
                    work_item_id=workitem_id,
                    data=data,
                )
            return client.intake.update(
                workspace_slug=workspace_slug,
                project_id=project_id,
                work_item_id=workitem_id,
                data=data,
            )

        client.intake.delete(workspace_slug=workspace_slug, project_id=project_id, work_item_id=workitem_id)
        return None
