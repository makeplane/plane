"""Work item types, at project or workspace scope.

Plane runs types in one of two modes: owned by the workspace and imported into
projects, or created per project. `resolve` hides that split -- prefer it over
create when all you need is a usable type id.
"""

from __future__ import annotations

from typing import Any, Literal

from fastmcp import FastMCP
from plane.errors.errors import HttpError
from plane.models.projects import ProjectFeature
from plane.models.work_item_types import CreateWorkItemType, UpdateWorkItemType, WorkItemType

from plane_mcp.client import get_plane_client_context
from plane_mcp.toolkit import (
    WORK_ITEM_TYPES,
    Action,
    build_annotations,
    build_description,
    coerce_list,
    missing,
    needs,
    opt,
    plan_gated,
    scoped,
    workspace_owns,
    workspace_owns_resource,
)

NAME = "workitem_type"
TITLE = "Work item types"

ACTIONS = (
    Action("list", (), ("project_id",), note="workspace scope when project_id is omitted", read=True),
    Action("retrieve", ("workitem_type_id",), ("project_id",), read=True),
    Action(
        "resolve",
        ("project_id", "name"),
        note="finds or creates a named type usable in the project; never duplicates",
    ),
    Action(
        "create",
        ("name",),
        ("project_id", "description", "project_ids", "is_active", "external_source", "external_id"),
    ),
    Action(
        "update",
        ("workitem_type_id",),
        ("project_id", "name", "description", "project_ids", "is_active", "external_source", "external_id"),
        note="only the fields you pass are changed",
    ),
    Action("delete", ("workitem_type_id",), ("project_id",), destructive=True),
    Action("import_to_project", ("project_id", "workitem_type_ids"), note="links workspace types to a project"),
)

FOOTER = (
    "Omit project_id to work at workspace scope. A type's id is the type_id for `workitem create` "
    "and the workitem_type_id for `workitem_property list`. "
    "Prefer resolve over create when you just need a usable type such as Epic or Initiative: it "
    "handles both modes, matches exactly (case-sensitive, whitespace-stripped) and never "
    "duplicates. Where the workspace owns the vocabulary, creating a type on a project is "
    "rejected and importing is the only valid path -- resolve does that for you."
)

LEGACY = {
    "list_work_item_types": "list",
    "retrieve_work_item_type": "retrieve",
    "resolve_work_item_type": "resolve",
    "create_work_item_type": "create",
    "update_work_item_type": "update",
    "delete_work_item_type": "delete",
    "import_work_item_types_to_project": "import_to_project",
}


def _scope_of(client: Any, project_id: str) -> tuple[Any, dict[str, Any], str]:
    """The namespace, scope kwargs and SDK id keyword that project_id selects."""
    if project_id:
        return client.work_item_types, {"project_id": project_id}, "work_item_type_id"
    return client.workspace_work_item_types, {}, "type_id"


def _named(types, target: str):
    return next((t for t in types if (t.name or "").strip() == target), None)


# Read out of a features dict and echoed as the refusal's key, so nothing type-checks it.
PROJECT_TYPES_FEATURE = "work_item_types"


def _adopt_from_workspace(client, workspace_slug: str, project_id: str, name: str, target: str) -> WorkItemType:
    """Find or create the type in the workspace catalogue, then import it into the project."""
    at_workspace = _named(client.workspace_work_item_types.list(workspace_slug=workspace_slug), target)
    if at_workspace is None:
        at_workspace = client.workspace_work_item_types.create(
            workspace_slug=workspace_slug, data=CreateWorkItemType(name=name)
        )
    client.work_item_types.import_to_project(
        workspace_slug=workspace_slug, project_id=project_id, work_item_type_ids=[at_workspace.id]
    )
    return at_workspace


def _resolve(client, workspace_slug: str, project_id: str, name: str) -> WorkItemType:
    """Find or create `name` so it is usable in the project, whichever scope owns types."""
    target = name.strip()

    # Correct in both scopes: the project endpoint lists whatever is joined to it.
    in_project = _named(client.work_item_types.list(workspace_slug=workspace_slug, project_id=project_id), target)
    if in_project is not None:
        return in_project

    # Ask which scope owns types before attempting a write the workspace would refuse.
    if workspace_owns_resource(client, workspace_slug, WORK_ITEM_TYPES):
        return _adopt_from_workspace(client, workspace_slug, project_id, name, target)

    project_features = client.projects.get_features(workspace_slug=workspace_slug, project_id=project_id)
    if not project_features.model_dump().get(PROJECT_TYPES_FEATURE):
        try:
            client.projects.update_features(
                workspace_slug=workspace_slug, project_id=project_id, data=ProjectFeature(work_item_types=True)
            )
        except HttpError as exc:
            # The flag is cached and the lockout outlives it, so the refusal still decides.
            if not workspace_owns(exc, PROJECT_TYPES_FEATURE):
                raise
            return _adopt_from_workspace(client, workspace_slug, project_id, name, target)

    return client.work_item_types.create(
        workspace_slug=workspace_slug, project_id=project_id, data=CreateWorkItemType(name=name)
    )


def register(mcp: FastMCP) -> None:
    @mcp.tool(
        name=NAME,
        description=build_description("Work item types, at project or workspace scope.", ACTIONS, FOOTER),
        annotations=build_annotations(TITLE, ACTIONS),
    )
    @plan_gated("Work item types")
    @scoped("work item types", PROJECT_TYPES_FEATURE)
    def workitem_type(
        action: Literal["list", "retrieve", "resolve", "create", "update", "delete", "import_to_project"],
        project_id: str = "",
        workitem_type_id: str = "",
        workitem_type_ids: str = "",
        name: str = "",
        description: str = "",
        project_ids: str = "",
        is_active: bool | None = None,
        external_source: str = "",
        external_id: str = "",
    ) -> WorkItemType | list[WorkItemType] | str | None:
        client, workspace_slug = get_plane_client_context()
        types, scope, id_kwarg = _scope_of(client, project_id)

        if action == "list":
            # Neither endpoint pages: both return every type as a plain list.
            return types.list(workspace_slug=workspace_slug, **scope)

        if action == "resolve":
            if error := needs(action, project_id=project_id, name=name):
                return error
            return _resolve(client, workspace_slug, project_id, name)

        if action == "import_to_project":
            ids = coerce_list(workitem_type_ids)
            if error := needs(action, project_id=project_id, workitem_type_ids=workitem_type_ids):
                return error
            client.work_item_types.import_to_project(
                workspace_slug=workspace_slug, project_id=project_id, work_item_type_ids=ids
            )
            return None

        if action == "create":
            if not name:
                return missing(action, "name")
            return types.create(
                workspace_slug=workspace_slug,
                **scope,
                data=CreateWorkItemType(
                    name=name,
                    description=opt(description),
                    project_ids=coerce_list(project_ids),
                    is_active=is_active,
                    external_source=opt(external_source),
                    external_id=opt(external_id),
                ),
            )

        if not workitem_type_id:
            return missing(action, "workitem_type_id")

        target = {**scope, id_kwarg: workitem_type_id}

        if action == "retrieve":
            return types.retrieve(workspace_slug=workspace_slug, **target)

        if action == "update":
            return types.update(
                workspace_slug=workspace_slug,
                **target,
                data=UpdateWorkItemType(
                    name=opt(name),
                    description=opt(description),
                    project_ids=coerce_list(project_ids),
                    is_active=is_active,
                    external_source=opt(external_source),
                    external_id=opt(external_id),
                ),
            )

        types.delete(workspace_slug=workspace_slug, **target)
        return None
