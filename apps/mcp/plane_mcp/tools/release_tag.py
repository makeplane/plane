"""Release tags -- the version markers a release can be attached to."""

from __future__ import annotations

from typing import Literal

from fastmcp import FastMCP
from plane.models.releases import (
    CreateReleaseTag,
    PaginatedReleaseTagResponse,
    ReleaseTag,
    UpdateReleaseTag,
)

from plane_mcp.client import get_plane_client_context
from plane_mcp.toolkit import Action, build_annotations, build_description, missing, opt, page_params

NAME = "release_tag"
TITLE = "Release tags"

ACTIONS = (
    Action("list", (), ("cursor", "per_page"), read=True),
    Action("retrieve", ("tag_id",), read=True),
    Action("create", ("version",), ("description", "commit_hash", "git_tag")),
    Action(
        "update",
        ("tag_id",),
        ("version", "description", "commit_hash", "git_tag"),
        note="only the fields you pass are changed",
    ),
    Action("delete", ("tag_id",), destructive=True),
)

FOOTER = 'version is a version string such as "v1.2.0". A tag id is what release takes as tag_id.'

LEGACY = {
    "list_release_tags": "list",
    "retrieve_release_tag": "retrieve",
    "create_release_tag": "create",
    "update_release_tag": "update",
    "delete_release_tag": "delete",
}


def register(mcp: FastMCP) -> None:
    @mcp.tool(
        name=NAME,
        description=build_description("Release tags (version markers).", ACTIONS, FOOTER),
        annotations=build_annotations(TITLE, ACTIONS),
    )
    def release_tag(
        action: Literal["list", "retrieve", "create", "update", "delete"],
        tag_id: str = "",
        version: str = "",
        description: str = "",
        commit_hash: str = "",
        git_tag: str = "",
        cursor: str = "",
        per_page: int = 0,
    ) -> ReleaseTag | PaginatedReleaseTagResponse | str | None:
        client, workspace_slug = get_plane_client_context()
        tags = client.releases.tags

        if action == "list":
            return tags.list(workspace_slug=workspace_slug, params=page_params(cursor, per_page))

        if action == "create":
            if not version:
                return missing(action, "version")
            return tags.create(
                workspace_slug=workspace_slug,
                data=CreateReleaseTag(
                    version=version,
                    description=opt(description),
                    commit_hash=opt(commit_hash),
                    git_tag=opt(git_tag),
                ),
            )

        if not tag_id:
            return missing(action, "tag_id")

        if action == "retrieve":
            return tags.retrieve(workspace_slug=workspace_slug, tag_id=tag_id)

        if action == "update":
            return tags.update(
                workspace_slug=workspace_slug,
                tag_id=tag_id,
                data=UpdateReleaseTag(
                    version=opt(version),
                    description=opt(description),
                    commit_hash=opt(commit_hash),
                    git_tag=opt(git_tag),
                ),
            )

        tags.delete(workspace_slug=workspace_slug, tag_id=tag_id)
        return None
