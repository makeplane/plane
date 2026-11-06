"""The connected workspace, and its feature flags."""

from __future__ import annotations

from typing import Any, Literal

from fastmcp import FastMCP
from plane.models.workspaces import WorkspaceFeature

from plane_mcp.client import current_workspace, get_plane_client_context
from plane_mcp.toolkit import Action, build_annotations, build_description

NAME = "workspace"
TITLE = "Workspace settings"

ACTIONS = (
    Action(
        "retrieve",
        note="the workspace this connection is bound to: slug, id, name and how it connected. "
        "id and name are known only on an OAuth connection and are null otherwise",
        read=True,
    ),
    Action("get_features", note="feature flags for the current workspace", read=True),
    Action(
        "update_features",
        optional=("project_grouping", "initiatives", "teams", "customers", "wiki", "pi"),
        note="only the flags you pass are changed",
    ),
)

FOOTER = "For a project's feature flags use `project get_features` and `project update_features`."

LEGACY = {
    "get_features": "get_features",
    "update_workspace_features": "update_features",
}


def register(mcp: FastMCP) -> None:
    @mcp.tool(
        name=NAME,
        description=build_description("The connected workspace, and its feature flags.", ACTIONS, FOOTER),
        annotations=build_annotations(TITLE, ACTIONS),
    )
    def workspace(
        action: Literal["retrieve", "get_features", "update_features"],
        # Tri-state throughout: False disables a feature, unset leaves it alone.
        project_grouping: bool | None = None,
        initiatives: bool | None = None,
        teams: bool | None = None,
        customers: bool | None = None,
        wiki: bool | None = None,
        pi: bool | None = None,
    ) -> WorkspaceFeature | dict[str, Any]:
        if action == "retrieve":
            return current_workspace()

        client, workspace_slug = get_plane_client_context()

        if action == "get_features":
            return client.workspaces.get_features(workspace_slug=workspace_slug)

        flags = {
            "project_grouping": project_grouping,
            "initiatives": initiatives,
            "teams": teams,
            "customers": customers,
            "wiki": wiki,
            "pi": pi,
        }
        data = WorkspaceFeature(**{k: v for k, v in flags.items() if v is not None})
        return client.workspaces.update_features(workspace_slug=workspace_slug, data=data)
