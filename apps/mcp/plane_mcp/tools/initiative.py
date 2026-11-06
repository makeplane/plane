"""Workspace initiatives, and the projects rolled up under them.

Native initiatives exist only when the workspace feature is enabled. When it is
off, initiatives are modelled as "Initiative" work items, so every action here
redirects to that path rather than failing with a bare API error.
"""

from __future__ import annotations

from typing import Any, Literal

from fastmcp import FastMCP
from fastmcp.exceptions import ToolError
from plane.models.initiatives import (
    CreateInitiative,
    Initiative,
    InitiativeState,
    PaginatedInitiativeResponse,
    UpdateInitiative,
)
from plane.models.projects import PaginatedProjectResponse
from plane.models.work_items import PaginatedWorkItemResponse

from plane_mcp.client import get_plane_client_context
from plane_mcp.toolkit import (
    Action,
    build_annotations,
    build_description,
    coerce_list,
    envelope,
    missing,
    one_of,
    opt,
    page_params,
    require,
)

NAME = "initiative"
TITLE = "Initiatives"

STATES = ("DRAFT", "PLANNED", "ACTIVE", "COMPLETED", "CLOSED")

_WORK_ITEM_FALLBACK = (
    'Initiatives are stored as "Initiative" work items in this workspace. '
    'Call `workitem_type resolve` with project_id and name="Initiative" to get the type id, '
    "then `workitem list` with pql='type = \"<type id>\"' to read them, or "
    "`workitem create` with that type_id to add one. Work items belong to a project -- "
    "ask which project if none was named."
)
_PROJECTS_NEED_NATIVE = (
    "Linking projects to an initiative requires the native initiatives feature; "
    "there is no work-item equivalent. Enable it in workspace settings."
)
_WORKITEMS_NEED_NATIVE = (
    "Linking work items to an initiative requires the native initiatives feature. Enable it in workspace settings."
)

ACTIONS = (
    Action("list", (), note="returns every initiative; this endpoint does not paginate", read=True),
    Action("retrieve", ("initiative_id",), read=True),
    Action("create", ("name",), ("description_html", "start_date", "end_date", "state", "lead")),
    Action(
        "update",
        ("initiative_id",),
        ("name", "description_html", "start_date", "end_date", "state", "lead"),
        note="only the fields you pass are changed",
    ),
    Action("delete", ("initiative_id",), destructive=True),
    Action("list_projects", ("initiative_id",), ("cursor", "per_page"), read=True),
    Action("add_projects", ("initiative_id", "project_ids"), note="returns nothing, read back with list_projects"),
    Action(
        "remove_projects",
        ("initiative_id", "project_ids"),
        note="returns nothing, read back with list_projects",
        destructive=True,
    ),
    Action("list_workitems", ("initiative_id",), ("cursor", "per_page"), read=True),
    Action(
        "manage_workitems",
        ("initiative_id",),
        ("add_ids", "remove_ids"),
        note="pass at least one of add_ids or remove_ids; each takes one id or several, "
        "and removals apply first; returns nothing, read back with list_workitems",
    ),
)

FOOTER = (
    f"state is one of: {', '.join(STATES)}. Dates are ISO 8601 (YYYY-MM-DD). "
    "lead is a member id. project_ids takes project UUIDs, add_ids and remove_ids "
    "work item UUIDs. A work item of any type can be linked to an initiative."
)

LEGACY = {
    "list_initiatives": "list",
    "retrieve_initiative": "retrieve",
    "create_initiative": "create",
    "update_initiative": "update",
    "delete_initiative": "delete",
    "list_initiative_projects": "list_projects",
}

LEGACY_UNMAPPED = {
    "manage_initiative_projects": "took action='add'|'remove', which collides with the dispatch "
    "key: use add_projects or remove_projects",
}


def _require_native(client: Any, workspace_slug: str, fallback: str) -> None:
    """Native endpoints 404 when the feature is off; say what to do instead."""
    features = client.workspaces.get_features(workspace_slug=workspace_slug)
    if not features.model_dump().get("initiatives"):
        raise ToolError(f"The initiatives feature is disabled for this workspace. {fallback}")


def register(mcp: FastMCP) -> None:
    @mcp.tool(
        name=NAME,
        description=build_description("Workspace initiatives.", ACTIONS, FOOTER),
        annotations=build_annotations(TITLE, ACTIONS),
    )
    def initiative(
        action: Literal[
            "list",
            "retrieve",
            "create",
            "update",
            "delete",
            "list_projects",
            "add_projects",
            "remove_projects",
            "list_workitems",
            "manage_workitems",
        ],
        initiative_id: str = "",
        name: str = "",
        description_html: str = "",
        start_date: str = "",
        end_date: str = "",
        state: str = "",
        lead: str = "",
        project_ids: str = "",
        add_ids: str = "",
        remove_ids: str = "",
        cursor: str = "",
        per_page: int = 0,
    ) -> Initiative | list[Initiative] | dict[str, Any] | str | None:
        client, workspace_slug = get_plane_client_context()

        if error := one_of("state", state, STATES):
            return error
        initiative_state: InitiativeState | None = state or None  # type: ignore[assignment]

        # Validated before the feature probe below, which costs a request.
        absent = require(ACTIONS, action, initiative_id=initiative_id, name=name, project_ids=project_ids)
        if absent:
            return absent

        if action in ("list_projects", "add_projects", "remove_projects"):
            _require_native(client, workspace_slug, _PROJECTS_NEED_NATIVE)
        elif action in ("list_workitems", "manage_workitems"):
            _require_native(client, workspace_slug, _WORKITEMS_NEED_NATIVE)
        else:
            _require_native(client, workspace_slug, _WORK_ITEM_FALLBACK)

        if action == "list":
            # No cursor or per_page: PaginatedInitiativeResponse carries `results`
            # and nothing else, so a page size could only truncate the answer with
            # no way to ask for the rest.
            response: PaginatedInitiativeResponse = client.initiatives.list(workspace_slug=workspace_slug)
            return response.results

        if action == "create":
            return client.initiatives.create(
                workspace_slug=workspace_slug,
                data=CreateInitiative(
                    name=name,
                    description_html=opt(description_html),
                    start_date=opt(start_date),
                    end_date=opt(end_date),
                    state=initiative_state,
                    lead=opt(lead),
                ),
            )

        if action == "retrieve":
            return client.initiatives.retrieve(workspace_slug=workspace_slug, initiative_id=initiative_id)

        if action == "update":
            return client.initiatives.update(
                workspace_slug=workspace_slug,
                initiative_id=initiative_id,
                data=UpdateInitiative(
                    name=opt(name),
                    description_html=opt(description_html),
                    start_date=opt(start_date),
                    end_date=opt(end_date),
                    state=initiative_state,
                    lead=opt(lead),
                ),
            )

        if action == "delete":
            client.initiatives.delete(workspace_slug=workspace_slug, initiative_id=initiative_id)
            return None

        if action in ("list_workitems", "manage_workitems"):
            work_items = client.initiatives.work_items

            if action == "list_workitems":
                linked_workitems: PaginatedWorkItemResponse = work_items.list(
                    workspace_slug=workspace_slug,
                    initiative_id=initiative_id,
                    params=page_params(cursor, per_page),
                )
                return envelope(linked_workitems)

            add = coerce_list(add_ids)
            remove = coerce_list(remove_ids)
            if not add and not remove:
                return missing(action, "add_ids or remove_ids")
            # Removals first, so one call can swap an id out for another.
            if remove:
                work_items.remove(workspace_slug=workspace_slug, initiative_id=initiative_id, work_item_ids=remove)
            if add:
                work_items.add(workspace_slug=workspace_slug, initiative_id=initiative_id, work_item_ids=add)
            return None

        projects = client.initiatives.projects

        if action == "list_projects":
            linked: PaginatedProjectResponse = projects.list(
                workspace_slug=workspace_slug,
                initiative_id=initiative_id,
                params=page_params(cursor, per_page),
            )
            return envelope(linked)

        ids = coerce_list(project_ids)
        mutate = projects.add if action == "add_projects" else projects.remove
        mutate(workspace_slug=workspace_slug, initiative_id=initiative_id, project_ids=ids)
        return None
