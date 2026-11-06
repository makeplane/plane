"""Milestones within a project, and the work items assigned to them."""

from __future__ import annotations

from typing import Any, Literal

from fastmcp import FastMCP
from plane.models.milestones import (
    CreateMilestone,
    Milestone,
    PaginatedMilestoneResponse,
    PaginatedMilestoneWorkItemResponse,
    UpdateMilestone,
)

from plane_mcp.client import get_plane_client_context
from plane_mcp.toolkit import (
    Action,
    build_annotations,
    build_description,
    coerce_list,
    envelope,
    missing,
    opt,
    page_params,
)

NAME = "milestone"
TITLE = "Milestones"

ACTIONS = (
    Action("list", ("project_id",), ("cursor", "per_page"), read=True),
    Action("retrieve", ("project_id", "milestone_id"), read=True),
    Action("create", ("project_id", "title"), ("target_date", "external_source", "external_id")),
    Action(
        "update",
        ("project_id", "milestone_id"),
        ("title", "target_date", "external_source", "external_id"),
        note="only the fields you pass are changed",
    ),
    Action("delete", ("project_id", "milestone_id"), destructive=True),
    Action("list_workitems", ("project_id", "milestone_id"), ("cursor", "per_page"), read=True),
    Action(
        "manage_workitems",
        ("project_id", "milestone_id"),
        ("add_ids", "remove_ids"),
        note="pass at least one of add_ids or remove_ids; returns nothing, read back with list_workitems",
    ),
)

FOOTER = "target_date is ISO 8601 (YYYY-MM-DD). add_ids and remove_ids take work item UUIDs."

LEGACY = {
    "list_milestones": "list",
    "retrieve_milestone": "retrieve",
    "create_milestone": "create",
    "update_milestone": "update",
    "delete_milestone": "delete",
    "list_milestone_work_items": "list_workitems",
    "manage_milestone_work_items": "manage_workitems",
}


def register(mcp: FastMCP) -> None:
    @mcp.tool(
        name=NAME,
        description=build_description("Milestones within a project.", ACTIONS, FOOTER),
        annotations=build_annotations(TITLE, ACTIONS),
    )
    def milestone(
        action: Literal[
            "list",
            "retrieve",
            "create",
            "update",
            "delete",
            "list_workitems",
            "manage_workitems",
        ],
        project_id: str = "",
        milestone_id: str = "",
        title: str = "",
        target_date: str = "",
        add_ids: str = "",
        remove_ids: str = "",
        external_source: str = "",
        external_id: str = "",
        cursor: str = "",
        per_page: int = 0,
    ) -> Milestone | dict[str, Any] | str | None:
        client, workspace_slug = get_plane_client_context()

        if not project_id:
            return missing(action, "project_id")

        if action == "list":
            response: PaginatedMilestoneResponse = client.milestones.list(
                workspace_slug=workspace_slug,
                project_id=project_id,
                params=page_params(cursor, per_page),
            )
            return envelope(response)

        if action == "create":
            if not title:
                return missing(action, "title")
            return client.milestones.create(
                workspace_slug=workspace_slug,
                project_id=project_id,
                data=CreateMilestone(
                    title=title,
                    target_date=opt(target_date),
                    external_source=opt(external_source),
                    external_id=opt(external_id),
                ),
            )

        if not milestone_id:
            return missing(action, "milestone_id")

        if action == "retrieve":
            return client.milestones.retrieve(
                workspace_slug=workspace_slug, project_id=project_id, milestone_id=milestone_id
            )

        if action == "update":
            return client.milestones.update(
                workspace_slug=workspace_slug,
                project_id=project_id,
                milestone_id=milestone_id,
                data=UpdateMilestone(
                    title=opt(title),
                    target_date=opt(target_date),
                    external_source=opt(external_source),
                    external_id=opt(external_id),
                ),
            )

        if action == "delete":
            client.milestones.delete(workspace_slug=workspace_slug, project_id=project_id, milestone_id=milestone_id)
            return None

        if action == "list_workitems":
            items: PaginatedMilestoneWorkItemResponse = client.milestones.list_work_items(
                workspace_slug=workspace_slug,
                project_id=project_id,
                milestone_id=milestone_id,
                params=page_params(cursor, per_page),
            )
            return envelope(items)

        add = coerce_list(add_ids)
        remove = coerce_list(remove_ids)
        if not add and not remove:
            return missing(action, "add_ids or remove_ids")
        if add:
            client.milestones.add_work_items(
                workspace_slug=workspace_slug,
                project_id=project_id,
                milestone_id=milestone_id,
                issue_ids=add,
            )
        if remove:
            client.milestones.remove_work_items(
                workspace_slug=workspace_slug,
                project_id=project_id,
                milestone_id=milestone_id,
                issue_ids=remove,
            )
        return None
