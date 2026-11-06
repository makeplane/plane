"""Collections: the workspace-level folders that group pages."""

from __future__ import annotations

from typing import Any, Literal

from fastmcp import FastMCP
from plane.models.collections import (
    AddCollectionPages,
    Collection,
    CollectionMember,
    CollectionPage,
    CollectionPageSearchResult,
    CreateCollection,
    CreateCollectionMember,
    UpdateCollection,
    UpdateCollectionMember,
)
from plane.models.query_params import CollectionPageQueryParams

from plane_mcp.client import get_plane_client_context
from plane_mcp.toolkit import (
    Action,
    as_params,
    build_annotations,
    build_description,
    coerce_list,
    envelope,
    missing,
    needs,
    one_of,
    opt,
)

NAME = "collection"
TITLE = "Page collections"

# 0 is a real level in both, so neither can use the 0 sentinel, and they are
# different scales -- reading one as the other silently grants or denies access.
ACCESS = {"public": 0, "private": 1}
MEMBER_ACCESS = {"view": 0, "comment": 1, "edit": 2}

ACTIONS = (
    Action("list", (), read=True),
    Action("retrieve", ("collection_id",), read=True),
    Action("create", ("name",), ("access",), note="access is fixed at creation and cannot be changed afterwards"),
    Action("update", ("collection_id",), ("name", "sort_order"), note="only the fields you pass are changed"),
    Action(
        "delete",
        ("collection_id",),
        ("archive_pages",),
        note="the pages survive; archive_pages defaults to true, pass false to leave them unfiled instead",
        destructive=True,
    ),
    Action("list_pages", ("collection_id",), ("search", "parent_id", "cursor", "per_page"), read=True),
    Action(
        "search_pages",
        ("collection_id",),
        ("search",),
        note="pages not yet in this collection, to pick ids for add_pages",
        read=True,
    ),
    Action("add_pages", ("collection_id", "page_ids"), note="files existing pages; use page create to make new ones"),
    Action(
        "remove_page",
        ("collection_id", "page_collection_id"),
        note="page_collection_id is the membership id from list_pages, not the page id; the page itself is kept",
        destructive=True,
    ),
    Action("list_members", ("collection_id",), read=True),
    Action("add_member", ("collection_id", "user_id", "member_access")),
    Action("update_member", ("collection_id", "collection_member_id", "member_access")),
    Action(
        "remove_member",
        ("collection_id", "collection_member_id"),
        note="collection_member_id is the membership id from list_members, not the user id",
        destructive=True,
    ),
)

FOOTER = (
    f"access is one of: {', '.join(ACCESS)} -- a private collection is visible only to its members, "
    "and the level cannot be changed once the collection exists. "
    f"member_access is one of: {', '.join(MEMBER_ACCESS)} and is a separate scale from access. "
    "Collections group workspace pages only; a project's pages cannot be filed in one. "
    "To file or move a page, use `page set_collection` -- it works out which collection holds the "
    "page for you, so it needs no membership id."
)

# A new resource: nothing was ever advertised under another name.
LEGACY: dict[str, str] = {}


def register(mcp: FastMCP) -> None:
    @mcp.tool(
        name=NAME,
        description=build_description("Collections grouping workspace pages.", ACTIONS, FOOTER),
        annotations=build_annotations(TITLE, ACTIONS),
    )
    def collection(
        action: Literal[
            "list",
            "retrieve",
            "create",
            "update",
            "delete",
            "list_pages",
            "search_pages",
            "add_pages",
            "remove_page",
            "list_members",
            "add_member",
            "update_member",
            "remove_member",
        ],
        collection_id: str = "",
        name: str = "",
        access: str = "",
        member_access: str = "",
        user_id: str = "",
        collection_member_id: str = "",
        page_ids: str = "",
        page_collection_id: str = "",
        parent_id: str = "",
        search: str = "",
        # Tri-state: the server's own default is true, which is not the same as unset.
        archive_pages: bool | None = None,
        # 0 is a real sort position, so it cannot use the 0 sentinel.
        sort_order: float | None = None,
        cursor: str = "",
        per_page: int = 0,
    ) -> (
        Collection
        | list[Collection]
        | CollectionMember
        | list[CollectionMember]
        | CollectionPage
        | list[CollectionPage]
        | list[CollectionPageSearchResult]
        | dict[str, Any]
        | str
        | None
    ):
        client, workspace_slug = get_plane_client_context()
        collections = client.collections

        if error := one_of("access", access, tuple(ACCESS)):
            return error
        if error := one_of("member_access", member_access, tuple(MEMBER_ACCESS)):
            return error

        if action == "list":
            return collections.list(workspace_slug=workspace_slug)

        if action == "create":
            if not name:
                return missing(action, "name")
            return collections.create(
                workspace_slug=workspace_slug,
                data=CreateCollection(name=name, access=ACCESS.get(access)),
            )

        if not collection_id:
            return missing(action, "collection_id")

        if action == "retrieve":
            return collections.retrieve(workspace_slug=workspace_slug, collection_id=collection_id)

        if action == "update":
            if not name and sort_order is None:
                return missing(action, "name or sort_order")
            return collections.update(
                workspace_slug=workspace_slug,
                collection_id=collection_id,
                data=UpdateCollection(name=opt(name), sort_order=sort_order),
            )

        if action == "delete":
            collections.delete(workspace_slug=workspace_slug, collection_id=collection_id, archive_pages=archive_pages)
            return None

        if action == "list_pages":
            response = collections.pages.list(
                workspace_slug=workspace_slug,
                collection_id=collection_id,
                params=as_params(
                    CollectionPageQueryParams,
                    search=search,
                    parent_id=parent_id,
                    cursor=cursor,
                    per_page=per_page,
                ),
            )
            return envelope(response)

        if action == "search_pages":
            return collections.pages.search(
                workspace_slug=workspace_slug, collection_id=collection_id, search=opt(search)
            )

        if action == "add_pages":
            ids = coerce_list(page_ids)
            if not ids:
                return missing(action, "page_ids")
            return collections.pages.add(
                workspace_slug=workspace_slug, collection_id=collection_id, data=AddCollectionPages(page_ids=ids)
            )

        if action == "remove_page":
            if not page_collection_id:
                return missing(action, "page_collection_id")
            collections.pages.remove(
                workspace_slug=workspace_slug,
                collection_id=collection_id,
                page_collection_id=page_collection_id,
            )
            return None

        if action == "list_members":
            return collections.members.list(workspace_slug=workspace_slug, collection_id=collection_id)

        if action == "add_member":
            if error := needs(action, user_id=user_id, member_access=member_access):
                return error
            return collections.members.add(
                workspace_slug=workspace_slug,
                collection_id=collection_id,
                data=CreateCollectionMember(member=user_id, access=MEMBER_ACCESS[member_access]),
            )

        if not collection_member_id:
            return missing(action, "collection_member_id")

        if action == "update_member":
            if not member_access:
                return missing(action, "member_access")
            return collections.members.update(
                workspace_slug=workspace_slug,
                collection_id=collection_id,
                member_id=collection_member_id,
                data=UpdateCollectionMember(access=MEMBER_ACCESS[member_access]),
            )

        collections.members.remove(
            workspace_slug=workspace_slug, collection_id=collection_id, member_id=collection_member_id
        )
        return None
