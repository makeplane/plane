"""Pages, at workspace or project scope, their hierarchy, and their links to work items.

Every page action is scoped by whether project_id is supplied: with it the page
is a project page, without it a workspace page. The SDK has a separate endpoint
pair for each, so the branch is explicit rather than a default.
"""

from __future__ import annotations

from typing import Any, Literal

from fastmcp import FastMCP
from plane.models.collections import AddCollectionPages, UpdateCollectionPage
from plane.models.pages import CreatePage, Page, UpdatePage
from plane.models.query_params import PaginatedQueryParams
from plane.models.work_item_pages import CreateWorkItemPage, WorkItemPage

from plane_mcp.client import get_plane_client_context
from plane_mcp.toolkit import Action, as_params, build_annotations, build_description, envelope, missing, needs, opt

NAME = "page"
TITLE = "Pages"

ACTIONS = (
    Action(
        "list", (), ("project_id", "cursor", "per_page"), note="workspace pages unless project_id is given", read=True
    ),
    Action("retrieve", ("page_id",), ("project_id",), read=True),
    Action(
        "create",
        ("name", "description_html"),
        (
            "project_id",
            "parent_id",
            "collection_id",
            "access",
            "color",
            "is_locked",
            "external_source",
            "external_id",
        ),
        note="parent_id nests the new page under an existing one; collection_id files it. "
        "Pass one or the other, never both",
    ),
    Action(
        "update",
        ("page_id",),
        ("project_id", "name", "description_html"),
        note="pass name, description_html, or both; description_html replaces the whole body, "
        "so retrieve the page first when editing part of it; a locked or archived page is refused",
    ),
    Action(
        "archive",
        ("page_id",),
        ("project_id", "archive"),
        note="archive defaults to true; pass archive=false to restore",
    ),
    Action(
        "delete",
        ("page_id",),
        ("project_id",),
        note="requires the page to be archived first",
        destructive=True,
    ),
    Action(
        "set_collection",
        ("page_id", "collection_id"),
        note="files a page into a collection, or moves it out of the one it is in; workspace pages only, "
        "and collection_id comes from the collection tool",
    ),
    Action("list_workitem_pages", ("project_id", "workitem_id"), read=True),
    Action("attach_to_workitem", ("project_id", "workitem_id", "page_id")),
    Action(
        "detach_from_workitem",
        ("project_id", "workitem_id", "workitem_page_id"),
        note="workitem_page_id is the link id from list_workitem_pages, not the page id",
        destructive=True,
    ),
)

FOOTER = (
    "description_html is the page body as HTML. access is the page access level. "
    "update changes only the fields you pass. A page must be archived before it can be deleted. "
    "Omit project_id to work with workspace-level pages. "
    "A page's parent is fixed at creation -- pass parent_id to create to build a hierarchy, since "
    "nothing can reparent it afterwards. list and retrieve both report a page's parent_id and the "
    "collection_id it is filed in, so neither needs looking up. "
    "Collections themselves live in the collection tool; here, create files a new page into one and "
    "set_collection files or moves an existing page."
)

LEGACY = {
    "list_pages": "list",
    "retrieve_page": "retrieve",
    "create_page": "create",
    "list_work_item_pages": "list_workitem_pages",
    "attach_page_to_work_item": "attach_to_workitem",
    "detach_page_from_work_item": "detach_from_workitem",
}


def register(mcp: FastMCP) -> None:
    @mcp.tool(
        name=NAME,
        description=build_description("Pages at workspace or project scope.", ACTIONS, FOOTER),
        annotations=build_annotations(TITLE, ACTIONS),
    )
    def page(
        action: Literal[
            "list",
            "retrieve",
            "create",
            "update",
            "archive",
            "delete",
            "set_collection",
            "list_workitem_pages",
            "attach_to_workitem",
            "detach_from_workitem",
        ],
        project_id: str = "",
        page_id: str = "",
        parent_id: str = "",
        collection_id: str = "",
        workitem_id: str = "",
        workitem_page_id: str = "",
        name: str = "",
        description_html: str = "",
        # Left unset rather than defaulted: 0 is a real access level.
        access: int | None = None,
        color: str = "",
        is_locked: bool | None = None,
        archive: bool | None = None,
        external_source: str = "",
        external_id: str = "",
        cursor: str = "",
        per_page: int = 0,
    ) -> Page | WorkItemPage | list[WorkItemPage] | dict[str, Any] | str | None:
        client, workspace_slug = get_plane_client_context()

        if action == "list":
            params = as_params(PaginatedQueryParams, cursor=cursor, per_page=per_page)
            if project_id:
                response = client.pages.list_project_pages(
                    workspace_slug=workspace_slug, project_id=project_id, params=params
                )
            else:
                response = client.pages.list_workspace_pages(workspace_slug=workspace_slug, params=params)
            return envelope(response)

        if action == "retrieve":
            if not page_id:
                return missing(action, "page_id")
            if project_id:
                return client.pages.retrieve_project_page(
                    workspace_slug=workspace_slug, project_id=project_id, page_id=page_id
                )
            return client.pages.retrieve_workspace_page(workspace_slug=workspace_slug, page_id=page_id)

        if action == "archive":
            if not page_id:
                return missing(action, "page_id")
            archiving = archive is not False
            if project_id:
                mover = client.pages.archive_project_page if archiving else client.pages.unarchive_project_page
                mover(workspace_slug=workspace_slug, project_id=project_id, page_id=page_id)
            else:
                mover = client.pages.archive_workspace_page if archiving else client.pages.unarchive_workspace_page
                mover(workspace_slug=workspace_slug, page_id=page_id)
            # Plane answers nothing, and delete depends on this having happened.
            return {"page_id": page_id, "archived": archiving}

        if action in ("update", "delete"):
            if not page_id:
                return missing(action, "page_id")
            scope = {"project_id": project_id} if project_id else {}
            if action == "delete":
                deleter = client.pages.delete_project_page if project_id else client.pages.delete_workspace_page
                deleter(workspace_slug=workspace_slug, page_id=page_id, **scope)
                return None
            if not (name or description_html):
                return missing(action, "name or description_html")
            updater = client.pages.update_project_page if project_id else client.pages.update_workspace_page
            return updater(
                workspace_slug=workspace_slug,
                page_id=page_id,
                **scope,
                data=UpdatePage(name=opt(name), description_html=opt(description_html)),
            )

        if action == "create":
            if error := needs(action, name=name, description_html=description_html):
                return error
            if parent_id and collection_id:
                return "Error: pass parent_id or collection_id, not both. A nested page takes its parent's collection."
            if collection_id and project_id:
                return "Error: collections hold workspace pages only. Omit project_id, or omit collection_id."
            data = CreatePage(
                name=name,
                description_html=description_html,
                access=access,
                color=opt(color),
                is_locked=is_locked,
                parent_id=opt(parent_id),
                collection_id=opt(collection_id),
                external_id=opt(external_id),
                external_source=opt(external_source),
            )
            if project_id:
                return client.pages.create_project_page(workspace_slug=workspace_slug, project_id=project_id, data=data)
            return client.pages.create_workspace_page(workspace_slug=workspace_slug, data=data)

        if action == "set_collection":
            if error := needs(action, page_id=page_id, collection_id=collection_id):
                return error

            filed = client.pages.retrieve_workspace_page(workspace_slug=workspace_slug, page_id=page_id)

            if not filed.collection_id:
                added = client.collections.pages.add(
                    workspace_slug=workspace_slug,
                    collection_id=collection_id,
                    data=AddCollectionPages(page_ids=[page_id]),
                )
                if not added:
                    return None
                membership_id = added[0].id
            elif str(filed.collection_id) == collection_id:
                membership_id = filed.page_collection_id
            else:
                membership_id = client.collections.pages.update(
                    workspace_slug=workspace_slug,
                    collection_id=str(filed.collection_id),
                    page_collection_id=str(filed.page_collection_id),
                    data=UpdateCollectionPage(collection=collection_id),
                ).id

            return {
                "page_id": page_id,
                "collection_id": collection_id,
                "page_collection_id": str(membership_id),
            }

        if error := needs(action, project_id=project_id, workitem_id=workitem_id):
            return error

        if action == "list_workitem_pages":
            response = client.work_items.pages.list(
                workspace_slug=workspace_slug, project_id=project_id, work_item_id=workitem_id
            )
            return response.results

        if action == "attach_to_workitem":
            if not page_id:
                return missing(action, "page_id")
            return client.work_items.pages.create(
                workspace_slug=workspace_slug,
                project_id=project_id,
                work_item_id=workitem_id,
                data=CreateWorkItemPage(page_id=page_id),
            )

        if not workitem_page_id:
            return missing(action, "workitem_page_id")
        client.work_items.pages.delete(
            workspace_slug=workspace_slug,
            project_id=project_id,
            work_item_id=workitem_id,
            work_item_page_id=workitem_page_id,
        )
        return None
