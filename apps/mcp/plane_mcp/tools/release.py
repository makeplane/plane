"""Releases in the workspace: the release itself, its changelog and its work items."""

from __future__ import annotations

from html import escape
from typing import Any, Literal

from fastmcp import FastMCP
from plane.models.releases import (
    AddReleaseWorkItems,
    CreateRelease,
    PaginatedReleaseResponse,
    PaginatedReleaseWorkItemResponse,
    Release,
    ReleaseChangelog,
    RemoveReleaseWorkItems,
    UpdateRelease,
    UpdateReleaseChangelog,
)

from plane_mcp.client import get_plane_client_context
from plane_mcp.toolkit import (
    Action,
    build_annotations,
    build_description,
    coerce_list,
    missing,
    one_of,
    opt,
    page_params,
)

NAME = "release"
TITLE = "Releases"

STATUSES = ("unreleased", "released", "cancelled")

ACTIONS = (
    Action("list", (), ("cursor", "per_page"), read=True),
    Action("retrieve", ("release_id",), read=True),
    Action(
        "create",
        ("name",),
        (
            "description_html",
            "status",
            "release_date",
            "target_date",
            "tag_id",
            "lead_id",
            "is_prerelease",
            "external_source",
            "external_id",
        ),
    ),
    Action(
        "update",
        ("release_id",),
        (
            "name",
            "description_html",
            "status",
            "release_date",
            "target_date",
            "tag_id",
            "lead_id",
            "is_prerelease",
        ),
        note="only the fields you pass are changed",
    ),
    Action("delete", ("release_id",), destructive=True),
    Action("get_changelog", ("release_id",), read=True),
    Action("update_changelog", ("release_id",), ("description_html", "description_stripped")),
    Action("list_workitems", ("release_id",), ("cursor", "per_page"), read=True),
    Action(
        "manage_workitems",
        ("release_id",),
        ("add_ids", "remove_ids"),
        note="pass at least one of add_ids or remove_ids; returns nothing, read back with list_workitems",
    ),
)

FOOTER = (
    f"status is one of: {', '.join(STATUSES)}, defaulting to unreleased. "
    'release_date is what the Plane UI labels "Target date" (YYYY-MM-DD); target_date is a '
    "separate stored date that the UI does not show. tag_id comes from `release_tag list`, "
    "lead_id from `member list_workspace`. For the changelog pass description_html, or description_stripped "
    "for plain text. A changelog is created empty with the release, so get_changelog always "
    "returns one."
)

LEGACY = {
    "list_releases": "list",
    "retrieve_release": "retrieve",
    "create_release": "create",
    "update_release": "update",
    "delete_release": "delete",
    "get_release_changelog": "get_changelog",
    "update_release_changelog": "update_changelog",
    "list_release_work_items": "list_workitems",
}

LEGACY_UNMAPPED = {
    "manage_release_work_items": "took action='add'|'remove', which collides with the dispatch "
    "key: use manage_workitems with add_ids or remove_ids",
}


def _prosemirror(text: str) -> dict[str, Any]:
    """A minimal ProseMirror doc, one paragraph per line."""
    paragraphs: list[dict[str, Any]] = []
    for line in text.split("\n"):
        paragraph: dict[str, Any] = {"type": "paragraph"}
        if line:
            paragraph["content"] = [{"type": "text", "text": line}]
        paragraphs.append(paragraph)
    return {"type": "doc", "content": paragraphs}


def register(mcp: FastMCP) -> None:
    @mcp.tool(
        name=NAME,
        description=build_description("Releases in the workspace.", ACTIONS, FOOTER),
        annotations=build_annotations(TITLE, ACTIONS),
    )
    def release(
        action: Literal[
            "list",
            "retrieve",
            "create",
            "update",
            "delete",
            "get_changelog",
            "update_changelog",
            "list_workitems",
            "manage_workitems",
        ],
        release_id: str = "",
        name: str = "",
        description_html: str = "",
        description_stripped: str = "",
        status: str = "",
        release_date: str = "",
        target_date: str = "",
        tag_id: str = "",
        lead_id: str = "",
        add_ids: str = "",
        remove_ids: str = "",
        is_prerelease: bool | None = None,
        external_source: str = "",
        external_id: str = "",
        cursor: str = "",
        per_page: int = 0,
    ) -> Release | PaginatedReleaseResponse | PaginatedReleaseWorkItemResponse | ReleaseChangelog | str | None:
        client, workspace_slug = get_plane_client_context()

        if error := one_of("status", status, STATUSES):
            return error

        releases = client.releases

        if action == "list":
            return releases.list(workspace_slug=workspace_slug, params=page_params(cursor, per_page))

        if action == "create":
            if not name:
                return missing(action, "name")
            return releases.create(
                workspace_slug=workspace_slug,
                data=CreateRelease(
                    name=name,
                    description_html=opt(description_html),
                    status=opt(status),
                    target_date=opt(target_date),
                    release_date=opt(release_date),
                    tag=opt(tag_id),
                    lead=opt(lead_id),
                    is_prerelease=is_prerelease,
                    external_source=opt(external_source),
                    external_id=opt(external_id),
                ),
            )

        if not release_id:
            return missing(action, "release_id")

        if action == "retrieve":
            return releases.retrieve(workspace_slug=workspace_slug, release_id=release_id)

        if action == "update":
            return releases.update(
                workspace_slug=workspace_slug,
                release_id=release_id,
                data=UpdateRelease(
                    name=opt(name),
                    description_html=opt(description_html),
                    status=opt(status),
                    target_date=opt(target_date),
                    release_date=opt(release_date),
                    tag=opt(tag_id),
                    lead=opt(lead_id),
                    is_prerelease=is_prerelease,
                ),
            )

        if action == "delete":
            releases.delete(workspace_slug=workspace_slug, release_id=release_id)
            return None

        if action == "get_changelog":
            return releases.changelog.retrieve(workspace_slug=workspace_slug, release_id=release_id)

        if action == "update_changelog":
            if not description_html and not description_stripped:
                return missing(action, "description_html or description_stripped")
            # The changelog editor renders description_json, so a plain-text write
            # has to emit a matching doc or the body appears empty.
            body = description_html or "<p>" + escape(description_stripped).replace("\n", "<br/>") + "</p>"
            return releases.changelog.update(
                workspace_slug=workspace_slug,
                release_id=release_id,
                data=UpdateReleaseChangelog(
                    description_html=body,
                    description_json=None if description_html else _prosemirror(description_stripped),
                ),
            )

        work_items = releases.work_items

        if action == "list_workitems":
            return work_items.list(
                workspace_slug=workspace_slug, release_id=release_id, params=page_params(cursor, per_page)
            )

        add = coerce_list(add_ids)
        remove = coerce_list(remove_ids)
        if not add and not remove:
            return missing(action, "add_ids or remove_ids")
        if add:
            work_items.create(
                workspace_slug=workspace_slug,
                release_id=release_id,
                data=AddReleaseWorkItems(work_item_ids=add),
            )
        if remove:
            work_items.delete(
                workspace_slug=workspace_slug,
                release_id=release_id,
                data=RemoveReleaseWorkItems(work_item_ids=remove),
            )
        return None
