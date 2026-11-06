"""Workflow states, at project or workspace scope."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal, get_args

from fastmcp import FastMCP
from plane.models.enums import CatalogGroupEnum, GroupEnum
from plane.models.states import (
    CreateState,
    CreateWorkspaceState,
    PaginatedStateResponse,
    State,
    UpdateState,
    UpdateWorkspaceState,
)

from plane_mcp.client import get_plane_client_context
from plane_mcp.toolkit import (
    Action,
    build_annotations,
    build_description,
    envelope,
    missing,
    needs,
    one_of,
    opt,
    page_params,
    scoped,
)

NAME = "state"
TITLE = "Workflow states"

TRIAGE = "triage"
SETTABLE_GROUPS = tuple(group for group in get_args(GroupEnum) if group != TRIAGE)
assert SETTABLE_GROUPS == get_args(CatalogGroupEnum)

ACTIONS = (
    Action(
        "list", (), ("project_id", "cursor", "per_page"), note="workspace scope when project_id is omitted", read=True
    ),
    Action("retrieve", ("state_id",), ("project_id",), read=True),
    Action(
        "create",
        ("name", "color"),
        ("project_id", "description", "sequence", "group", "default", "external_source", "external_id"),
        note="group is required at workspace scope",
    ),
    Action(
        "update",
        ("state_id",),
        ("project_id", "name", "color", "description", "sequence", "group", "default"),
        note="only the fields you pass are changed",
    ),
    Action("delete", ("state_id",), ("project_id",), destructive=True),
)

FOOTER = (
    f"group is one of: {', '.join(SETTABLE_GROUPS)}. color is a hex code such as #EF4444. "
    "A project also has a triage state, but Plane owns it: it cannot be created here and is "
    "not listed, and Triage is a reserved name. "
    "Omit project_id to work with the workspace catalogue, which is where states live once the "
    "workspace owns them; sequence and default apply to a project's states only."
)

LEGACY = {
    "list_states": "list",
    "retrieve_state": "retrieve",
    "create_state": "create",
    "update_state": "update",
    "delete_state": "delete",
}


@dataclass(frozen=True, slots=True)
class _Scope:
    """Where a state lives, resolved once from project_id."""

    namespace: Any
    kwargs: dict[str, Any]
    create: type
    update: type


def _scope_of(client: Any, project_id: str) -> _Scope:
    """project_id selects the project's states; without it, the workspace catalogue."""
    if project_id:
        return _Scope(
            namespace=client.states,
            kwargs={"project_id": project_id},
            create=CreateState,
            update=UpdateState,
        )
    return _Scope(
        namespace=client.workspace_states,
        kwargs={},
        create=CreateWorkspaceState,
        update=UpdateWorkspaceState,
    )


def register(mcp: FastMCP) -> None:
    @mcp.tool(
        name=NAME,
        description=build_description("Workflow states within a project.", ACTIONS, FOOTER),
        annotations=build_annotations(TITLE, ACTIONS),
    )
    @scoped("states")
    def state(
        action: Literal["list", "retrieve", "create", "update", "delete"],
        project_id: str = "",
        state_id: str = "",
        name: str = "",
        color: str = "",
        description: str = "",
        # 0 is a real sequence value, so it cannot use the 0 sentinel.
        sequence: float | None = None,
        group: str = "",
        # Tri-state: False is a meaningful value distinct from "not supplied".
        default: bool | None = None,
        external_source: str = "",
        external_id: str = "",
        cursor: str = "",
        per_page: int = 0,
    ) -> State | dict[str, Any] | str | None:
        client, workspace_slug = get_plane_client_context()
        scope = _scope_of(client, project_id)

        if not project_id:
            elsewhere = [field for field, value in (("sequence", sequence), ("default", default)) if value is not None]
            if elsewhere:
                return f"Error: {', '.join(elsewhere)} apply to a project's states only, not the workspace catalogue."
        if error := one_of("group", group, SETTABLE_GROUPS):
            return error

        def payload(model: type) -> Any:
            """The fields this scope's model actually declares, minus the unset ones."""
            fields = {
                "name": opt(name),
                "color": opt(color),
                "group": opt(group),
                "description": opt(description),
                "sequence": sequence,
                "default": default,
                "external_source": opt(external_source),
                "external_id": opt(external_id),
            }
            return model(**{k: v for k, v in fields.items() if v is not None and k in model.model_fields})

        if action == "list":
            response: PaginatedStateResponse = scope.namespace.list(
                workspace_slug=workspace_slug, **scope.kwargs, params=page_params(cursor, per_page)
            )
            return envelope(response)

        if action == "create":
            if error := needs(action, name=name, color=color):
                return error
            if not project_id and not group:
                # The catalogue endpoint requires a group; the project one defaults it.
                return missing(action, "group")
            return scope.namespace.create(workspace_slug=workspace_slug, **scope.kwargs, data=payload(scope.create))

        if not state_id:
            return missing(action, "state_id")

        if action == "retrieve":
            return scope.namespace.retrieve(workspace_slug=workspace_slug, **scope.kwargs, state_id=state_id)

        if action == "update":
            return scope.namespace.update(
                workspace_slug=workspace_slug, **scope.kwargs, state_id=state_id, data=payload(scope.update)
            )

        scope.namespace.delete(workspace_slug=workspace_slug, **scope.kwargs, state_id=state_id)
        return None
