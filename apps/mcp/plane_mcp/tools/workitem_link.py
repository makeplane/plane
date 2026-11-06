"""External links attached to a work item."""

from __future__ import annotations

from typing import Literal

from fastmcp import FastMCP
from plane.models.work_items import CreateWorkItemLink, UpdateWorkItemLink, WorkItemLink

from plane_mcp.client import get_plane_client_context
from plane_mcp.toolkit import Action, build_annotations, build_description, missing, needs, opt, page_params

NAME = "workitem_link"
TITLE = "Work item links"

ACTIONS = (
    Action("list", ("project_id", "workitem_id"), ("cursor", "per_page"), read=True),
    Action("retrieve", ("project_id", "workitem_id", "link_id"), read=True),
    Action("create", ("project_id", "workitem_id", "url"), ("title",)),
    Action(
        "update",
        ("project_id", "workitem_id", "link_id"),
        ("url", "title"),
        note="pass at least one of url or title; only the fields you pass are changed",
    ),
    Action("delete", ("project_id", "workitem_id", "link_id"), destructive=True),
)

FOOTER = (
    "url must be http:// or https://. title is the text Plane shows in place of the URL, "
    "e.g. title='Design spec' for a long Figma link; without one the URL itself is shown."
)

LEGACY = {
    "list_work_item_links": "list",
    "retrieve_work_item_link": "retrieve",
    "create_work_item_link": "create",
    "update_work_item_link": "update",
    "delete_work_item_link": "delete",
}


def register(mcp: FastMCP) -> None:
    @mcp.tool(
        name=NAME,
        description=build_description("External links attached to a work item.", ACTIONS, FOOTER),
        annotations=build_annotations(TITLE, ACTIONS),
    )
    def workitem_link(
        action: Literal["list", "retrieve", "create", "update", "delete"],
        project_id: str = "",
        workitem_id: str = "",
        link_id: str = "",
        url: str = "",
        title: str = "",
        cursor: str = "",
        per_page: int = 0,
    ) -> WorkItemLink | list[WorkItemLink] | str | None:
        client, workspace_slug = get_plane_client_context()

        if error := needs(action, project_id=project_id, workitem_id=workitem_id):
            return error

        if action == "list":
            return client.work_items.links.list(
                workspace_slug=workspace_slug,
                project_id=project_id,
                work_item_id=workitem_id,
                params=page_params(cursor, per_page),
            )

        if action == "create":
            if not url:
                return missing(action, "url")
            return client.work_items.links.create(
                workspace_slug=workspace_slug,
                project_id=project_id,
                work_item_id=workitem_id,
                data=CreateWorkItemLink(url=url, title=opt(title)),
            )

        if not link_id:
            return missing(action, "link_id")

        if action == "retrieve":
            return client.work_items.links.retrieve(
                workspace_slug=workspace_slug,
                project_id=project_id,
                work_item_id=workitem_id,
                link_id=link_id,
            )

        if action == "update":
            if not url and not title:
                return missing(action, "url or title")
            return client.work_items.links.update(
                workspace_slug=workspace_slug,
                project_id=project_id,
                work_item_id=workitem_id,
                link_id=link_id,
                data=UpdateWorkItemLink(url=opt(url), title=opt(title)),
            )

        client.work_items.links.delete(
            workspace_slug=workspace_slug,
            project_id=project_id,
            work_item_id=workitem_id,
            link_id=link_id,
        )
        return None
