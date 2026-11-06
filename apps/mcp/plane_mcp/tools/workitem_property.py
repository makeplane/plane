"""Custom work item properties: their definitions, options, and values.

Scope is chosen by which ids you supply: project_id plus workitem_type_id is
type-scoped, project_id alone is project-flat, neither is workspace-level. The
same rule applies to the option actions.

The *_value actions are the other half of the same subject -- defining a property
and setting it on a work item are one job -- and keeping them here avoids a
near-duplicate tool name that a model has to disambiguate on every call.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any, Literal, get_args

from fastmcp import FastMCP
from plane.errors.errors import HttpError
from plane.models.work_item_properties import (
    CreateWorkItemProperty,
    CreateWorkItemPropertyOption,
    CreateWorkItemPropertyValue,
    DateAttributeSettings,
    PropertySettings,
    PropertyType,
    RelationType,
    RichTextValue,
    TextAttributeSettings,
    UpdateWorkItemProperty,
    UpdateWorkItemPropertyOption,
    WorkItemProperty,
    WorkItemPropertyOption,
    WorkItemPropertyValueDetail,
)
from plane.models.work_item_types import WorkspaceWorkItemTypePropertyLink
from pydantic import ValidationError

from plane_mcp.client import get_plane_client_context
from plane_mcp.toolkit import (
    Action,
    build_annotations,
    build_description,
    coerce_list,
    missing,
    needs,
    one_of,
    opt,
    plan_gated,
    scoped,
    workspace_owns,
)

NAME = "workitem_property"
TITLE = "Work item properties"

PROPERTY_TYPES = tuple(e.value for e in PropertyType)
RELATION_TYPES = tuple(e.value for e in RelationType)
TEXT_FORMATS = get_args(TextAttributeSettings.model_fields["display_format"].annotation)
DATE_FORMATS = get_args(DateAttributeSettings.model_fields["display_format"].annotation)

ACTIONS = (
    Action(
        "list",
        (),
        ("project_id", "workitem_type_id"),
        note="no ids lists every workspace property in one call -- the fast path for PQL",
        read=True,
    ),
    Action("retrieve", ("workitem_property_id",), ("project_id", "workitem_type_id"), read=True),
    Action(
        "create",
        ("display_name", "property_type"),
        (
            "project_id",
            "workitem_type_id",
            "description",
            "relation_type",
            "is_required",
            "is_multi",
            "is_active",
            "default_value",
            "options",
            "display_format",
            "external_source",
            "external_id",
        ),
    ),
    Action(
        "update",
        ("workitem_property_id",),
        (
            "project_id",
            "workitem_type_id",
            "display_name",
            "property_type",
            "description",
            "relation_type",
            "is_required",
            "is_multi",
            "is_active",
            "default_value",
            "display_format",
            "external_source",
            "external_id",
        ),
        note="only the fields you pass are changed",
    ),
    Action("delete", ("workitem_property_id",), ("project_id", "workitem_type_id"), destructive=True),
    Action(
        "manage_type_properties",
        ("workitem_type_id",),
        ("project_id", "attach_ids", "detach_ids"),
        note="omit project_id where the workspace owns types; detach removes the association only, "
        "it does not delete the property",
    ),
    Action("list_options", ("property_id",), ("project_id",), read=True),
    Action("retrieve_option", ("property_id", "option_id"), ("project_id",), read=True),
    Action(
        "create_option",
        ("property_id", "name"),
        ("project_id", "description", "color", "is_default", "external_source", "external_id"),
    ),
    Action(
        "update_option",
        ("property_id", "option_id"),
        ("project_id", "name", "description", "color", "is_default", "external_source", "external_id"),
    ),
    Action("delete_option", ("property_id", "option_id"), ("project_id",), destructive=True),
    Action("get_value", ("project_id", "workitem_id", "property_id"), read=True),
    Action(
        "set_value",
        ("project_id", "workitem_id", "property_id"),
        ("value", "description_html", "external_source", "external_id"),
        note="upsert; pass value, or description_html for a rich text property; for a "
        "multi-value property this replaces every existing value",
    ),
    Action("delete_value", ("project_id", "workitem_id", "property_id"), destructive=True),
)

FOOTER = (
    f"property_type is one of: {', '.join(PROPERTY_TYPES)}. "
    f"relation_type (for RELATION properties) is one of: {', '.join(RELATION_TYPES)}. "
    'A property id is what goes in a PQL cf["<id>"] filter; for OPTION properties the value is an option id. '
    'options takes a JSON array of {"name", "color", "is_default"} objects. '
    f"display_format is required by TEXT ({', '.join(TEXT_FORMATS)}) and "
    f"DATETIME ({', '.join(DATE_FORMATS)}) properties. "
    "A property lives with its type: where the workspace owns types, pass workitem_type_id "
    "without project_id and it is created in the workspace catalogue and associated for you. "
    "list resolves scope in this order: project_id + workitem_type_id is type-scoped (falling "
    "back to project-flat then workspace when empty), project_id alone is every property in the "
    "project, and neither is every workspace property. To filter by property name in PQL, call "
    "list with no ids -- one workspace-wide fetch beats iterating types -- then match "
    "display_name in memory to get the id for a cf[] condition. "
    "The *_value actions read and write a property on one work item: pass value in the type the "
    "property expects -- TEXT/URL/EMAIL/FILE as a string; DATETIME as a YYYY-MM-DD or "
    "YYYY-MM-DD HH:MM:SS string; DECIMAL as a number; BOOLEAN as true or false; OPTION and "
    "RELATION as an option or record id string, or an array of them when the property is "
    'multi-value. Send the value\'s own type, not a stringified form: "007" stays the text 007, '
    "whereas 7 is the number. "
    "A rich text property is a RELATION with relation_type RICH_TEXT. Write it with "
    "description_html (HTML, e.g. '<p>Notes</p>') instead of value; get_value returns the "
    "content in value_detail.description_html, and its value is only that content's storage id."
)

LEGACY = {
    "list_work_item_properties": "list",
    "retrieve_work_item_property": "retrieve",
    "create_work_item_property": "create",
    "update_work_item_property": "update",
    "delete_work_item_property": "delete",
    "manage_work_item_type_properties": "manage_type_properties",
    "list_work_item_property_options": "list_options",
    "retrieve_work_item_property_option": "retrieve_option",
    "create_work_item_property_option": "create_option",
    "update_work_item_property_option": "update_option",
    "delete_work_item_property_option": "delete_option",
    "get_work_item_property_value": "get_value",
    "set_work_item_property_value": "set_value",
    "delete_work_item_property_value": "delete_value",
}


@dataclass(frozen=True, slots=True)
class _Scope:
    """Where one property lives, resolved once from the ids the caller supplied."""

    namespace: Any
    suffix: str
    kwargs: dict[str, Any]
    id_kwarg: str

    def call(self, verb: str) -> Any:
        return getattr(self.namespace, verb + self.suffix)

    def target(self, property_id: str) -> dict[str, Any]:
        return {**self.kwargs, self.id_kwarg: property_id}


def _scope_of(client: Any, project_id: str, workitem_type_id: str) -> _Scope:
    """project_id with workitem_type_id is type-scoped, project_id alone is
    project-flat, neither is the workspace."""
    properties = client.work_item_properties
    if project_id and workitem_type_id:
        scope = {"project_id": project_id, "type_id": workitem_type_id}
        return _Scope(properties, "", scope, "work_item_property_id")
    if project_id:
        return _Scope(properties, "_project", {"project_id": project_id}, "property_id")
    return _Scope(client.workspace_work_item_properties, "", {}, "property_id")


def _settings(property_type: str, display_format: str) -> PropertySettings:
    """TEXT and DATETIME are the only types with settings, and both require one.

    The API rejects either type without a display_format, so an unset one falls
    back to the most common choice rather than failing the call.
    """
    if property_type == "TEXT":
        return TextAttributeSettings(display_format=display_format or "single-line")
    if property_type == "DATETIME":
        return DateAttributeSettings(display_format=display_format or "MMM dd, yyyy")
    return None


OPTIONS_SHAPE = 'options must be a JSON array of {"name", "color", "is_default"} objects'


def _options(options: str) -> list[CreateWorkItemPropertyOption] | None:
    """Parse the options array, raising ValueError with a correctable message.

    Silently returning None on malformed input created the property with no
    options at all and reported success -- the caller had no way to notice.
    """
    if not options:
        return None
    try:
        parsed = json.loads(options)
    except ValueError as exc:
        raise ValueError(f"{OPTIONS_SHAPE}; it is not valid JSON ({exc})") from exc
    if not isinstance(parsed, list):
        raise ValueError(f"{OPTIONS_SHAPE}; got {type(parsed).__name__}")
    try:
        return [CreateWorkItemPropertyOption(**item) for item in parsed]
    except (TypeError, ValidationError) as exc:
        raise ValueError(f"{OPTIONS_SHAPE}; one entry is unusable ({exc})") from exc


def _wants_rich_text(exc: HttpError) -> bool:
    """Plane's refusal of a rich text property sent `value` instead of description_html."""
    return exc.status_code == 400 and "Rich text value must be an object" in str(exc.response)


def _absent(exc: HttpError) -> bool:
    """Whether an error means "nothing here", as opposed to "the call failed".

    Only 404 is a fallback signal. Swallowing everything turned an expired token
    or a 500 into an empty list, which reads to a model as "no custom properties
    exist" -- and it then drops the `cf[]` filter it was about to build.
    """
    return exc.status_code == 404


def _link_to_type(client, workspace_slug: str, type_id: str, property_ids: list[str]) -> None:
    """Associate workspace properties with a workspace type."""
    client.workspace_work_item_types.properties.create(
        workspace_slug=workspace_slug,
        type_id=type_id,
        data=WorkspaceWorkItemTypePropertyLink(properties=property_ids),
    )


def _create_at_workspace(client, workspace_slug: str, type_id: str, data: CreateWorkItemProperty) -> WorkItemProperty:
    """Create a property in the workspace catalogue and associate it with its type."""
    if data.is_active is None:
        data = data.model_copy(update={"is_active": True})
    created = client.workspace_work_item_properties.create(workspace_slug=workspace_slug, data=data)
    _link_to_type(client, workspace_slug, type_id, [str(created.id)])
    return created


def _manage_workspace_links(
    client, workspace_slug: str, type_id: str, attach: list[str] | None, detach: list[str] | None
) -> list[str] | None:
    """Attach or detach workspace properties on a workspace type."""
    if attach:
        _link_to_type(client, workspace_slug, type_id, attach)
    links = client.workspace_work_item_types.properties
    for one in detach or []:
        links.delete(workspace_slug=workspace_slug, type_id=type_id, property_id=one)
    return attach


def _manage_project_links(
    client, workspace_slug: str, project_id: str, type_id: str, attach: list[str] | None, detach: list[str] | None
) -> list[str] | None:
    """Attach or detach project properties on a project type."""
    properties = client.work_item_properties
    attached = None
    if attach:
        attached = properties.attach_to_type(
            workspace_slug=workspace_slug, project_id=project_id, type_id=type_id, property_ids=attach
        )
    for one in detach or []:
        properties.detach_from_type(
            workspace_slug=workspace_slug, project_id=project_id, type_id=type_id, property_id=one
        )
    return attached


def _workspace_props_for_type(client, workspace_slug: str, type_id: str) -> list:
    """Workspace properties linked to a type. The link endpoint returns bare ids."""
    try:
        property_ids = client.workspace_work_item_types.properties.list(workspace_slug=workspace_slug, type_id=type_id)
        if not property_ids:
            return []
        wanted = {str(pid) for pid in property_ids}
        everything = client.workspace_work_item_properties.list(workspace_slug=workspace_slug)
        return [p for p in everything if str(p.id) in wanted]
    except HttpError as exc:
        if _absent(exc):
            return []
        raise


def register(mcp: FastMCP) -> None:
    @mcp.tool(
        name=NAME,
        description=build_description("Custom work item properties and their options.", ACTIONS, FOOTER),
        annotations=build_annotations(TITLE, ACTIONS),
    )
    @plan_gated("Work item properties")
    @scoped("work item properties")
    def workitem_property(
        action: Literal[
            "list",
            "retrieve",
            "create",
            "update",
            "delete",
            "manage_type_properties",
            "list_options",
            "retrieve_option",
            "create_option",
            "update_option",
            "delete_option",
            "get_value",
            "set_value",
            "delete_value",
        ],
        project_id: str = "",
        workitem_id: str = "",
        workitem_type_id: str = "",
        workitem_property_id: str = "",
        property_id: str = "",
        option_id: str = "",
        display_name: str = "",
        property_type: str = "",
        relation_type: str = "",
        description: str = "",
        name: str = "",
        color: str = "",
        default_value: str = "",
        options: str = "",
        display_format: str = "",
        value: str | bool | int | float | list[str] = "",
        description_html: str = "",
        attach_ids: str = "",
        detach_ids: str = "",
        is_required: bool | None = None,
        is_multi: bool | None = None,
        is_active: bool | None = None,
        is_default: bool | None = None,
        external_source: str = "",
        external_id: str = "",
    ) -> (
        WorkItemProperty
        | list[WorkItemProperty]
        | WorkItemPropertyOption
        | list[WorkItemPropertyOption]
        | list[str]
        | WorkItemPropertyValueDetail
        | list[WorkItemPropertyValueDetail]
        | dict[str, Any]
        | str
        | None
    ):
        client, workspace_slug = get_plane_client_context()

        if error := one_of("property_type", property_type, PROPERTY_TYPES):
            return error
        if error := one_of("relation_type", relation_type, RELATION_TYPES):
            return error

        properties = client.work_item_properties
        workspace_properties = client.workspace_work_item_properties
        scope = _scope_of(client, project_id, workitem_type_id)

        if action.endswith("_value"):
            if error := needs(action, project_id=project_id, workitem_id=workitem_id, property_id=property_id):
                return error
            values = properties.values
            target = {
                "workspace_slug": workspace_slug,
                "project_id": project_id,
                # SDK kwarg name; splatted straight into the values endpoint.
                "work_item_id": workitem_id,
                "property_id": property_id,
            }
            if action == "get_value":
                return values.retrieve(**target)
            if action == "set_value":
                # Compared against "" rather than tested for falsiness: `False`
                # and `0` are values a BOOLEAN or DECIMAL property can hold.
                if value != "" and description_html:
                    return "Error: pass value or description_html, not both."
                if value == "" and not description_html:
                    return missing(action, "value or description_html")
                # Plane takes a rich text value as an object, not a bare HTML string.
                try:
                    return values.create(
                        **target,
                        data=CreateWorkItemPropertyValue(
                            value=RichTextValue(description_html=description_html) if description_html else value,
                            external_id=opt(external_id),
                            external_source=opt(external_source),
                        ),
                    )
                except HttpError as exc:
                    if description_html or not _wants_rich_text(exc):
                        raise
                    return (
                        "Error: this is a rich text property -- send its content as description_html, "
                        "e.g. description_html='<p>Notes</p>', not as value."
                    )
            values.delete(**target)
            return None

        if action == "list":
            if not workitem_type_id and not project_id:
                return workspace_properties.list(workspace_slug=workspace_slug)
            if not project_id:
                return _workspace_props_for_type(client, workspace_slug, workitem_type_id)
            if not workitem_type_id:
                try:
                    return properties.list_project(workspace_slug=workspace_slug, project_id=project_id)
                except HttpError as exc:
                    if _absent(exc):
                        return []
                    raise
            scoped = properties.list(
                workspace_slug=workspace_slug,
                project_id=project_id,
                type_id=workitem_type_id,
            )
            if scoped:
                return scoped
            # A property created without a type association is invisible to the
            # type-scoped endpoint; widen before giving up.
            try:
                flat = properties.list_project(workspace_slug=workspace_slug, project_id=project_id)
                if flat:
                    return flat
            except HttpError as exc:
                if not _absent(exc):
                    raise
            return _workspace_props_for_type(client, workspace_slug, workitem_type_id)

        if action == "create":
            if error := needs(action, display_name=display_name, property_type=property_type):
                return error
            try:
                parsed_options = _options(options)
            except ValueError as exc:
                return f"Error: {exc}."
            data = CreateWorkItemProperty(
                display_name=display_name,
                property_type=PropertyType(property_type),
                relation_type=RelationType(relation_type) if relation_type else None,
                description=opt(description),
                is_required=is_required,
                default_value=coerce_list(default_value, split=False),
                settings=_settings(property_type, display_format),
                is_active=is_active,
                is_multi=is_multi,
                external_source=opt(external_source),
                external_id=opt(external_id),
                options=parsed_options,
            )
            if workitem_type_id and not project_id:
                return _create_at_workspace(client, workspace_slug, workitem_type_id, data)
            try:
                return scope.call("create")(workspace_slug=workspace_slug, **scope.kwargs, data=data)
            except HttpError as exc:
                if not (workitem_type_id and workspace_owns(exc)):
                    raise
                return _create_at_workspace(client, workspace_slug, workitem_type_id, data)

        if action == "manage_type_properties":
            attach = coerce_list(attach_ids)
            detach = coerce_list(detach_ids)
            if error := needs(action, workitem_type_id=workitem_type_id):
                return error
            if not attach and not detach:
                return missing(action, "attach_ids or detach_ids")
            if not project_id:
                return _manage_workspace_links(client, workspace_slug, workitem_type_id, attach, detach)
            try:
                return _manage_project_links(client, workspace_slug, project_id, workitem_type_id, attach, detach)
            except HttpError as exc:
                if not workspace_owns(exc):
                    raise
                return _manage_workspace_links(client, workspace_slug, workitem_type_id, attach, detach)

        if action in ("retrieve", "update", "delete"):
            if not workitem_property_id:
                return missing(action, "workitem_property_id")

            target = scope.target(workitem_property_id)

            if action == "retrieve":
                return scope.call("retrieve")(workspace_slug=workspace_slug, **target)

            if action == "update":
                data = UpdateWorkItemProperty(
                    display_name=opt(display_name),
                    property_type=PropertyType(property_type) if property_type else None,
                    relation_type=RelationType(relation_type) if relation_type else None,
                    description=opt(description),
                    is_required=is_required,
                    default_value=coerce_list(default_value, split=False),
                    settings=_settings(property_type, display_format),
                    is_active=is_active,
                    is_multi=is_multi,
                    external_source=opt(external_source),
                    external_id=opt(external_id),
                )
                return scope.call("update")(workspace_slug=workspace_slug, **target, data=data)

            scope.call("delete")(workspace_slug=workspace_slug, **target)
            return None

        if not property_id:
            return missing(action, "property_id")

        scoped_options = properties.options if project_id else workspace_properties.options
        option_scope: dict[str, Any] = {"project_id": project_id} if project_id else {}

        if action == "list_options":
            if project_id:
                return scoped_options.list(
                    workspace_slug=workspace_slug,
                    project_id=project_id,
                    property_id=property_id,
                )
            return scoped_options.list(workspace_slug=workspace_slug, property_id=property_id)

        if action == "create_option":
            if not name:
                return missing(action, "name")
            return scoped_options.create(
                workspace_slug=workspace_slug,
                property_id=property_id,
                data=CreateWorkItemPropertyOption(
                    name=name,
                    description=opt(description),
                    color=opt(color),
                    is_default=is_default,
                    external_source=opt(external_source),
                    external_id=opt(external_id),
                ),
                **option_scope,
            )

        if not option_id:
            return missing(action, "option_id")

        if action == "retrieve_option":
            return scoped_options.retrieve(
                workspace_slug=workspace_slug, property_id=property_id, option_id=option_id, **option_scope
            )

        if action == "update_option":
            return scoped_options.update(
                workspace_slug=workspace_slug,
                property_id=property_id,
                option_id=option_id,
                data=UpdateWorkItemPropertyOption(
                    name=opt(name),
                    description=opt(description),
                    color=opt(color),
                    is_default=is_default,
                    external_source=opt(external_source),
                    external_id=opt(external_id),
                ),
                **option_scope,
            )

        scoped_options.delete(
            workspace_slug=workspace_slug, property_id=property_id, option_id=option_id, **option_scope
        )
        return None
