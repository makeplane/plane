"""The workspace release-label palette, and which labels a release carries.

The palette actions (create, update, delete) define labels for the whole
workspace. attach and detach only change what one release carries.
"""

from __future__ import annotations

from typing import Literal

from fastmcp import FastMCP
from plane.models.releases import (
    AddReleaseItemLabel,
    CreateReleaseLabel,
    PaginatedReleaseLabelResponse,
    ReleaseLabel,
    RemoveReleaseItemLabel,
    UpdateReleaseLabel,
)

from plane_mcp.client import get_plane_client_context
from plane_mcp.toolkit import (
    Action,
    build_annotations,
    build_description,
    coerce_list,
    missing,
    needs,
    opt,
    page_params,
)

NAME = "release_label"
TITLE = "Release labels"

ACTIONS = (
    Action(
        "list",
        (),
        ("release_id", "cursor", "per_page"),
        note="the workspace palette unless release_id is given",
        read=True,
    ),
    Action("create", ("name",), ("color", "sort_order"), note="adds to the workspace palette"),
    Action("update", ("label_id",), ("name", "color", "sort_order")),
    Action("delete", ("label_id",), note="removes it from the palette entirely", destructive=True),
    Action("attach", ("release_id", "label_ids"), note="returns nothing, read back with list"),
    Action("detach", ("release_id", "label_ids"), note="returns nothing, read back with list", destructive=True),
)

FOOTER = (
    "color is a hex code such as #4E5355. label_ids takes palette label ids. Detaching a label "
    "leaves it in the palette; delete removes it for everyone."
)

LEGACY = {
    "list_release_labels": "list",
    "create_release_label": "create",
    "update_release_label": "update",
    "delete_release_label": "delete",
}

LEGACY_UNMAPPED = {
    "manage_release_labels": "took action='attach'|'detach', which collides with the dispatch "
    "key: use attach or detach",
}


def register(mcp: FastMCP) -> None:
    @mcp.tool(
        name=NAME,
        description=build_description("Release labels, workspace palette and per release.", ACTIONS, FOOTER),
        annotations=build_annotations(TITLE, ACTIONS),
    )
    def release_label(
        action: Literal["list", "create", "update", "delete", "attach", "detach"],
        release_id: str = "",
        label_id: str = "",
        label_ids: str = "",
        name: str = "",
        color: str = "",
        # 0 is a real sort position, so it cannot use the 0 sentinel.
        sort_order: int | None = None,
        cursor: str = "",
        per_page: int = 0,
    ) -> ReleaseLabel | PaginatedReleaseLabelResponse | str | None:
        client, workspace_slug = get_plane_client_context()
        labels = client.releases.labels
        item_labels = client.releases.item_labels

        if action == "list":
            params = page_params(cursor, per_page)
            if release_id:
                return item_labels.list(workspace_slug=workspace_slug, release_id=release_id, params=params)
            return labels.list(workspace_slug=workspace_slug, params=params)

        if action == "create":
            if not name:
                return missing(action, "name")
            return labels.create(
                workspace_slug=workspace_slug,
                data=CreateReleaseLabel(name=name, color=opt(color), sort_order=sort_order),
            )

        if action in ("update", "delete"):
            if not label_id:
                return missing(action, "label_id")
            if action == "update":
                return labels.update(
                    workspace_slug=workspace_slug,
                    label_id=label_id,
                    data=UpdateReleaseLabel(name=opt(name), color=opt(color), sort_order=sort_order),
                )
            labels.delete(workspace_slug=workspace_slug, label_id=label_id)
            return None

        ids = coerce_list(label_ids)
        if error := needs(action, release_id=release_id, label_ids=label_ids):
            return error

        if action == "attach":
            item_labels.create(
                workspace_slug=workspace_slug,
                release_id=release_id,
                data=AddReleaseItemLabel(label_ids=ids),
            )
        else:
            item_labels.delete(
                workspace_slug=workspace_slug,
                release_id=release_id,
                data=RemoveReleaseItemLabel(label_ids=ids),
            )
        return None
