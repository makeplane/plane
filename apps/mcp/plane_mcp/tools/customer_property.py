"""Custom properties on customers, and the values a customer holds for them."""

from __future__ import annotations

import json
from typing import Literal, get_args

from fastmcp import FastMCP
from plane.models.customers import (
    CreateCustomerProperty,
    CustomerProperty,
    PaginatedCustomerPropertyResponse,
    PropertySettings,
    SetCustomerPropertyValues,
    UpdateCustomerProperty,
)
from plane.models.enums import CustomerPropertyType, CustomerRelationType
from plane.models.work_item_property_configurations import DateAttributeSettings, TextAttributeSettings

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
    page_params,
)

NAME = "customer_property"
TITLE = "Customer properties"

PROPERTY_TYPES = tuple(e.value for e in CustomerPropertyType)
RELATION_TYPES = tuple(e.value for e in CustomerRelationType)
TEXT_FORMATS = get_args(TextAttributeSettings.model_fields["display_format"].annotation)
DATE_FORMATS = get_args(DateAttributeSettings.model_fields["display_format"].annotation)

ACTIONS = (
    Action("list", (), ("cursor", "per_page"), read=True),
    Action("retrieve", ("property_id",), read=True),
    Action(
        "create",
        ("display_name", "property_type"),
        (
            "relation_type",
            "description",
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
        ("property_id",),
        (
            "display_name",
            "relation_type",
            "description",
            "is_required",
            "is_multi",
            "is_active",
            "default_value",
            "options",
            "external_source",
            "external_id",
        ),
        note="only the fields you pass are changed",
    ),
    Action("delete", ("property_id",), destructive=True),
    Action("get_values", ("customer_id",), ("property_id",), note="omit property_id to read them all", read=True),
    Action(
        "set_values",
        ("customer_id", "values"),
        note="replaces the values of the properties named; others keep theirs",
    ),
)

FOOTER = (
    "display_name is the user-facing label and must be unique in the workspace -- the stored "
    "name is derived from it. "
    f"property_type is one of: {', '.join(PROPERTY_TYPES)}. relation_type (required for RELATION) "
    f"is one of: {', '.join(RELATION_TYPES)}. display_format is required by TEXT "
    f"({', '.join(TEXT_FORMATS)}) and DATETIME ({', '.join(DATE_FORMATS)}). "
    'options takes a JSON array of {"name", "description", "is_default"} objects. '
    'values takes a JSON object of property id to a list of strings, e.g. {"<id>": ["Enterprise"]} '
    "-- every value is a string whatever the property type, and a single-item list unless is_multi."
)

LEGACY = {
    "list_customer_properties": "list",
    "retrieve_customer_property": "retrieve",
    "create_customer_property": "create",
    "update_customer_property": "update",
    "delete_customer_property": "delete",
    "get_customer_property_values": "get_values",
    "set_customer_property_values": "set_values",
}


def _settings(property_type: str, display_format: str) -> PropertySettings:
    """TEXT and DATETIME both require a display_format; default rather than fail."""
    if property_type == "TEXT":
        return TextAttributeSettings(display_format=display_format or "single-line")
    if property_type == "DATETIME":
        return DateAttributeSettings(display_format=display_format or "MMM dd, yyyy")
    return None


def _json(raw: str, expected: type):
    try:
        parsed = json.loads(raw)
    except ValueError:
        return None
    return parsed if isinstance(parsed, expected) else None


OPTIONS_SHAPE = 'options must be a JSON array of {"name", "description", "is_default"} objects'


def _options(raw: str) -> list | None:
    """Parse options, raising ValueError with a correctable message.

    Malformed input used to become None, so the property was written without
    the options and the call reported success.
    """
    if not raw:
        return None
    try:
        parsed = json.loads(raw)
    except ValueError as exc:
        raise ValueError(f"{OPTIONS_SHAPE}; it is not valid JSON ({exc})") from exc
    if not isinstance(parsed, list) or not all(isinstance(item, dict) for item in parsed):
        raise ValueError(f"{OPTIONS_SHAPE}; got {json.dumps(parsed)[:80]}")
    return parsed


def register(mcp: FastMCP) -> None:
    @mcp.tool(
        name=NAME,
        description=build_description("Custom properties on customers.", ACTIONS, FOOTER),
        annotations=build_annotations(TITLE, ACTIONS),
    )
    def customer_property(
        action: Literal["list", "retrieve", "create", "update", "delete", "get_values", "set_values"],
        property_id: str = "",
        customer_id: str = "",
        display_name: str = "",
        property_type: str = "",
        relation_type: str = "",
        description: str = "",
        default_value: str = "",
        options: str = "",
        display_format: str = "",
        values: str = "",
        is_required: bool | None = None,
        is_multi: bool | None = None,
        is_active: bool | None = None,
        external_source: str = "",
        external_id: str = "",
        cursor: str = "",
        per_page: int = 0,
    ) -> CustomerProperty | PaginatedCustomerPropertyResponse | dict[str, list[str]] | str | None:
        client, workspace_slug = get_plane_client_context()

        if error := one_of("property_type", property_type, PROPERTY_TYPES):
            return error
        if error := one_of("relation_type", relation_type, RELATION_TYPES):
            return error

        properties = client.customers.properties
        property_values = client.customers.property_values

        try:
            parsed_options = _options(options) if action in ("create", "update") else None
        except ValueError as exc:
            return f"Error: {exc}."

        if action == "list":
            return properties.list(workspace_slug=workspace_slug, params=page_params(cursor, per_page))

        if action == "create":
            if error := needs(action, display_name=display_name, property_type=property_type):
                return error
            return properties.create(
                workspace_slug=workspace_slug,
                data=CreateCustomerProperty(
                    # The API requires `name` but stores a slug of display_name.
                    name=display_name,
                    display_name=display_name,
                    property_type=CustomerPropertyType(property_type),
                    relation_type=CustomerRelationType(relation_type) if relation_type else None,
                    description=opt(description),
                    is_required=is_required,
                    default_value=coerce_list(default_value, split=False),
                    settings=_settings(property_type, display_format),
                    is_active=is_active,
                    is_multi=is_multi,
                    options=parsed_options,
                    external_source=opt(external_source),
                    external_id=opt(external_id),
                ),
            )

        if action == "get_values":
            if not customer_id:
                return missing(action, "customer_id")
            if property_id:
                return {property_id: property_values.retrieve(workspace_slug, customer_id, property_id)}
            return property_values.list(workspace_slug, customer_id)

        if action == "set_values":
            if error := needs(action, customer_id=customer_id, values=values):
                return error
            parsed = _json(values, dict)
            if parsed is None:
                return 'Error: values must be a JSON object, for example {"<property_id>": ["Enterprise"]}.'
            property_values.create(
                workspace_slug,
                customer_id,
                SetCustomerPropertyValues(customer_property_values=parsed),
            )
            return None

        if not property_id:
            return missing(action, "property_id")

        if action == "retrieve":
            return properties.retrieve(workspace_slug=workspace_slug, property_id=property_id)

        if action == "update":
            return properties.update(
                workspace_slug=workspace_slug,
                property_id=property_id,
                data=UpdateCustomerProperty(
                    display_name=opt(display_name),
                    relation_type=CustomerRelationType(relation_type) if relation_type else None,
                    description=opt(description),
                    is_required=is_required,
                    default_value=coerce_list(default_value, split=False),
                    is_active=is_active,
                    is_multi=is_multi,
                    options=parsed_options,
                    external_source=opt(external_source),
                    external_id=opt(external_id),
                ),
            )

        properties.delete(workspace_slug=workspace_slug, property_id=property_id)
        return None
