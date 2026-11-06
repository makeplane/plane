"""Workspace and project members, and the role definitions they can hold."""

from __future__ import annotations

from typing import Literal

from fastmcp import FastMCP
from plane.models.query_params import MemberListQueryParams

from plane_mcp.client import get_plane_client_context
from plane_mcp.toolkit import Action, build_annotations, build_description, missing, opt

NAME = "member"
TITLE = "Members and roles"

ACTIONS = (
    Action("me", note="the authenticated user", read=True),
    Action(
        "list_workspace",
        optional=(
            "first_name",
            "last_name",
            "email",
            "display_name",
            "role_slug",
            "is_active",
            "is_bot",
            "cursor",
            "per_page",
            "order_by",
        ),
        note="name filters match case-insensitively and combine with AND",
        read=True,
    ),
    Action("list_project", ("project_id",), read=True),
    Action("list_roles", optional=("namespace", "cursor", "per_page"), read=True),
    Action("retrieve_role", ("role_id",), read=True),
)

FOOTER = (
    "namespace is 'workspace' (Owner/Admin/Member/Guest) or 'project' "
    "(Admin/Contributor/Commenter/Guest); omit for both. A role slug is stable but not "
    "globally unique -- key on (namespace, slug)."
)

LEGACY = {
    "get_me": "me",
    "get_workspace_members": "list_workspace",
    "get_project_members": "list_project",
    "list_roles": "list_roles",
    "retrieve_role": "retrieve_role",
}


def register(mcp: FastMCP) -> None:
    @mcp.tool(
        name=NAME,
        description=build_description("Workspace and project members, and role definitions.", ACTIONS, FOOTER),
        annotations=build_annotations(TITLE, ACTIONS),
    )
    def member(
        action: Literal["me", "list_workspace", "list_project", "list_roles", "retrieve_role"],
        project_id: str = "",
        role_id: str = "",
        namespace: str = "",
        first_name: str = "",
        last_name: str = "",
        email: str = "",
        display_name: str = "",
        role_slug: str = "",
        # Tri-state: False filters for inactive/non-bot members, unset filters neither.
        is_active: bool | None = None,
        is_bot: bool | None = None,
        order_by: str = "",
        cursor: str = "",
        per_page: int = 0,
    ):
        client, workspace_slug = get_plane_client_context()

        if action == "me":
            return client.users.get_me()

        if action == "list_workspace":
            return client.workspaces.get_members_lite(
                workspace_slug=workspace_slug,
                params=MemberListQueryParams(
                    first_name=opt(first_name),
                    last_name=opt(last_name),
                    email=opt(email),
                    display_name=opt(display_name),
                    role_slug=opt(role_slug),
                    is_active=is_active,
                    is_bot=is_bot,
                    cursor=opt(cursor),
                    per_page=per_page or 100,
                    order_by=opt(order_by),
                ),
            )

        if action == "list_project":
            if not project_id:
                return missing(action, "project_id")
            return client.projects.get_members(workspace_slug=workspace_slug, project_id=project_id)

        if action == "list_roles":
            return client.roles.list(
                workspace_slug=workspace_slug,
                namespace=opt(namespace),
                per_page=opt(per_page),
                cursor=opt(cursor),
            )

        if not role_id:
            return missing(action, "role_id")
        return client.roles.retrieve(workspace_slug=workspace_slug, role_id=role_id)
