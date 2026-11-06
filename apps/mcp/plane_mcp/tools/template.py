"""Templates: the reusable shape of a work item, a page, or a project.

`kind` says what is templated, project_id where it lives -- with it a project
template, without it a workspace one. A project kind exists only at workspace scope,
since a project template is what creates projects. `template_data` carries the body
being templated; everything else on the tool is the template's own metadata.

Listing without project_id is the wider view, not the other half: for a workitem or
page kind it returns a project's templates too, marked by a non-null `project`.

Governance refuses project-scoped writes where the workspace owns its templates.
Reads are never refused, so a project still lists what it already has.
"""

from __future__ import annotations

import json
from typing import Any, Literal

from fastmcp import FastMCP
from plane.errors.errors import HttpError
from plane.models import project_templates as project_models
from plane.models import workspace_templates as workspace_models

from plane_mcp.client import get_plane_client_context
from plane_mcp.toolkit import (
    Action,
    build_annotations,
    build_description,
    missing,
    needs,
    one_of,
    opt,
    workspace_owns,
)

NAME = "template"
TITLE = "Templates"

KINDS = ("workitem", "page", "project")

ACTIONS = (
    Action("list", ("kind",), ("project_id",), read=True),
    Action("create", ("kind", "name", "template_data"), ("project_id", "description")),
    Action(
        "update",
        ("kind", "template_id"),
        ("project_id", "name", "description", "template_data"),
        note="only the fields you pass are changed",
    ),
    Action("delete", ("kind", "template_id"), ("project_id",), destructive=True),
)

FOOTER = (
    f"kind is one of: {', '.join(KINDS)}. project_id chooses the scope a write lands in; omit it "
    "for the workspace, which is also the only scope a project kind can live at. "
    "For a workitem or page kind, listing without project_id is the wider view: it returns a "
    "project's templates as well as the workspace's own, told apart by a non-null project. "
    "Pass project_id to list one project's alone. "
    "template_data is a JSON object holding what gets templated -- for a work item template, "
    'the fields a work item created from it starts with, such as {"name": "Spec", '
    '"description_html": "<p>Context / Acceptance criteria</p>", "priority": "medium"}. '
    "update merges it into what is there rather than replacing it, so pass only what changes. "
    "description is the template's own summary, not the templated body."
)

# Templates are new to this surface, so no retired name maps onto them.
LEGACY: dict[str, str] = {}

OWNED_BY_WORKSPACE = (
    "Error: this workspace owns its templates, so a project's own are read-only -- listing them "
    "still works, but they cannot be created, changed or deleted. Omit project_id to write at "
    "the workspace instead."
)

_WORKSPACE = {
    "workitem": (workspace_models.CreateWorkItemTemplate, workspace_models.UpdateWorkItemTemplate),
    "page": (workspace_models.CreatePageTemplate, workspace_models.UpdatePageTemplate),
    "project": (workspace_models.CreateProjectTemplate, workspace_models.UpdateProjectTemplate),
}

_PROJECT = {
    "workitem": (project_models.CreateWorkItemTemplate, project_models.UpdateWorkItemTemplate),
    "page": (project_models.CreatePageTemplate, project_models.UpdatePageTemplate),
}


def _scope_of(client: Any, kind: str, project_id: str) -> tuple[Any, dict[str, Any], tuple[Any, Any]] | None:
    """The namespace, scope kwargs and payload models that kind and project_id select.

    None when the pair has no endpoint, which is only a project template asked for
    inside a project.
    """
    if project_id:
        if kind not in _PROJECT:
            return None
        namespace = {
            "workitem": client.project_templates.work_item_templates,
            "page": client.project_templates.page_templates,
        }[kind]
        return namespace, {"project_id": project_id}, _PROJECT[kind]
    namespace = {
        "workitem": client.workspace_templates.work_items,
        "page": client.workspace_templates.pages,
        "project": client.workspace_templates.projects,
    }[kind]
    return namespace, {}, _WORKSPACE[kind]


def _body(raw: str) -> dict[str, Any] | None:
    """Parse template_data, raising ValueError with a correctable message."""
    if not raw:
        return None
    try:
        parsed = json.loads(raw)
    except ValueError as exc:
        raise ValueError(f"template_data must be a JSON object; it is not valid JSON ({exc})") from exc
    if not isinstance(parsed, dict):
        raise ValueError(f"template_data must be a JSON object; got {type(parsed).__name__}")
    return parsed


def _payload(model: Any, name: str, description: str, body: dict[str, Any] | None) -> Any:
    """Build a create or update payload for whichever scope's model this is.

    Workspace work item and page templates use `description_html`, workspace
    project templates use `description`, and project-scoped templates use
    `short_description`. Select the field the payload model declares.
    """
    fields: dict[str, Any] = {"name": opt(name), "template_data": body}
    if description:
        if "description_html" in model.model_fields:
            summary = "description_html"
        elif "description" in model.model_fields:
            summary = "description"
        else:
            summary = "short_description"
        fields[summary] = description
    return model(**{key: value for key, value in fields.items() if value is not None})


def register(mcp: FastMCP) -> None:
    @mcp.tool(
        name=NAME,
        description=build_description("Reusable templates for work items, pages and projects.", ACTIONS, FOOTER),
        annotations=build_annotations(TITLE, ACTIONS),
    )
    def template(
        action: Literal["list", "create", "update", "delete"],
        kind: str = "",
        project_id: str = "",
        template_id: str = "",
        name: str = "",
        description: str = "",
        template_data: str = "",
    ) -> Any:
        client, workspace_slug = get_plane_client_context()

        if not kind:
            return missing(action, "kind")
        if error := one_of("kind", kind, KINDS):
            return error

        scope = _scope_of(client, kind, project_id)
        if scope is None:
            return (
                "Error: a project template lives at the workspace, not inside a project. "
                "Omit project_id to work with it."
            )
        namespace, target, (create_model, update_model) = scope

        if action == "list":
            return namespace.list(workspace_slug=workspace_slug, **target)

        try:
            body = _body(template_data)
        except ValueError as exc:
            return f"Error: {exc}."

        try:
            if action == "create":
                if error := needs(action, name=name, template_data=template_data):
                    return error
                return namespace.create(
                    workspace_slug=workspace_slug,
                    **target,
                    data=_payload(create_model, name, description, body),
                )

            if not template_id:
                return missing(action, "template_id")

            if action == "update":
                if body == {}:
                    return "Error: template_data must contain at least one field."
                if not (name or description or body):
                    return missing(action, "name, description or template_data")
                return namespace.update(
                    workspace_slug=workspace_slug,
                    **target,
                    template_id=template_id,
                    data=_payload(update_model, name, description, body),
                )

            namespace.delete(workspace_slug=workspace_slug, **target, template_id=template_id)
            return None
        except HttpError as exc:
            # Only a project-scoped write draws this, so the answer is the same for
            # all three: the workspace owns them, write there instead.
            if workspace_owns(exc):
                return OWNED_BY_WORKSPACE
            raise
