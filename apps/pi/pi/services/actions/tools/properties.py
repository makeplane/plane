# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

"""
Properties API tools for Plane custom property management.
"""

from typing import Any
from typing import Dict

from pi.services.actions.tool_generator import generate_tools_for_category
from pi.services.actions.tool_metadata import ToolMetadata
from pi.services.actions.tool_metadata import ToolParameter

# ============================================================================
# TOOL METADATA DEFINITIONS
# ============================================================================

TEXT_DISPLAY_FORMAT_MAP = {
    "single": "single-line",
    "single-line": "single-line",
    "single_line": "single-line",
    "single line": "single-line",
    "singleline": "single-line",
    "paragraph": "multi-line",
    "multi": "multi-line",
    "multi-line": "multi-line",
    "multi_line": "multi-line",
    "multi line": "multi-line",
    "multiline": "multi-line",
    "read-only": "readonly",
    "read_only": "readonly",
    "read only": "readonly",
    "readonly": "readonly",
}

DATE_DISPLAY_FORMAT_MAP = {
    "mmm dd, yyyy": "MMM dd, yyyy",
    "dd/mm/yyyy": "dd/MM/yyyy",
    "mm/dd/yyyy": "MM/dd/yyyy",
    "yyyy/mm/dd": "yyyy/MM/dd",
}


async def _properties_create_pre_handler(
    metadata: ToolMetadata,
    kwargs: Dict[str, Any],
    context: Dict[str, Any],
    category: str,
    method_key: str,
    method_executor: Any,
) -> Dict[str, Any]:
    """Normalize type-specific helpers into settings payloads."""

    prop_type = kwargs.get("property_type")
    if isinstance(prop_type, str):
        kwargs["property_type"] = prop_type.upper()
    normalized_type = kwargs.get("property_type")

    # Handle friendly text display selectors
    text_format = kwargs.pop("text_display_format", None)
    if text_format and normalized_type == "TEXT":
        key = str(text_format).strip().lower().replace("_", "-")
        mapped = TEXT_DISPLAY_FORMAT_MAP.get(key)
        if mapped:
            kwargs["settings"] = {"display_format": mapped}

    # Handle date display helper
    date_format = kwargs.pop("date_display_format", None)
    if date_format and normalized_type == "DATETIME":
        key = str(date_format).strip().lower()
        mapped = DATE_DISPLAY_FORMAT_MAP.get(key, date_format)
        kwargs["settings"] = {"display_format": mapped}

    return kwargs


PROPERTIES_TOOL_DEFINITIONS = {
    # ==========================================================================
    # Core Property CRUD
    # ==========================================================================
    "create": ToolMetadata(
        name="properties_create",
        description="Create a new work item property (custom field) for a specific work item type.",
        sdk_method="create_property",
        parameters=[
            ToolParameter(name="display_name", type="str", required=True, description="Display name for the property (required)"),
            ToolParameter(
                name="property_type",
                type="str",
                required=True,
                description="Type of property: TEXT, DATETIME, DECIMAL, BOOLEAN, OPTION, RELATION, URL, EMAIL, FILE",
            ),
            ToolParameter(name="type_id", type="str", required=True, description="Work item type ID this property belongs to (required)"),
            ToolParameter(name="project_id", type="Optional[str]", required=False, description="Project ID", auto_fill_from_context=True),
            ToolParameter(name="workspace_slug", type="Optional[str]", required=False, description="Workspace slug", auto_fill_from_context=True),
            ToolParameter(
                name="relation_type",
                type="Optional[str]",
                required=False,
                description="Relation type for RELATION properties: ONE_TO_ONE, ONE_TO_MANY, MANY_TO_ONE, MANY_TO_MANY",
            ),
            ToolParameter(name="description", type="Optional[str]", required=False, description="Description of the property"),
            ToolParameter(name="is_required", type="Optional[bool]", required=False, description="Whether this property is required for work items"),
            ToolParameter(name="default_value", type="Optional[list]", required=False, description="List of default values for the property"),
            ToolParameter(
                name="settings",
                type="Optional[dict]",
                required=False,
                description="Property settings (TextAttributeSettings for TEXT, DateAttributeSettings for DATETIME)",
            ),
            ToolParameter(
                name="text_display_format",
                type="Optional[str]",
                required=False,
                description="Shortcut for TEXT properties: choose 'single-line', 'multi-line', or 'readonly' to set the display format",
            ),
            ToolParameter(
                name="date_display_format",
                type="Optional[str]",
                required=False,
                description="Shortcut for DATETIME properties: 'MMM dd, yyyy', 'dd/MM/yyyy', 'MM/dd/yyyy', or 'yyyy/MM/dd'",
            ),
            ToolParameter(name="is_active", type="Optional[bool]", required=False, description="Whether the property is active"),
            ToolParameter(name="is_multi", type="Optional[bool]", required=False, description="Whether this property supports multiple values"),
            ToolParameter(name="validation_rules", type="Optional[dict]", required=False, description="Validation rules for the property"),
            ToolParameter(name="options", type="Optional[list]", required=False, description="List of options for OPTION type properties"),
            ToolParameter(
                name="external_source", type="Optional[str]", required=False, description="External system source identifier (e.g., 'github', 'jira')"
            ),
            ToolParameter(name="external_id", type="Optional[str]", required=False, description="External system's identifier for this property"),
        ],
        pre_handler=_properties_create_pre_handler,
        returns_entity_type="property",
    ),
    "list": ToolMetadata(
        name="properties_list",
        description="List all work item properties (custom fields) for a specific work item type.",
        sdk_method="list_properties",
        parameters=[
            ToolParameter(name="type_id", type="str", required=True, description="Work item type ID to list properties for"),
            ToolParameter(name="project_id", type="Optional[str]", required=False, description="Project ID", auto_fill_from_context=True),
            ToolParameter(name="workspace_slug", type="Optional[str]", required=False, description="Workspace slug", auto_fill_from_context=True),
        ],
    ),
    "retrieve": ToolMetadata(
        name="properties_retrieve",
        description="Get a single work item property by ID.",
        sdk_method="retrieve_property",
        parameters=[
            ToolParameter(name="property_id", type="str", required=True, description="Property ID to retrieve"),
            ToolParameter(name="type_id", type="str", required=True, description="Work item type ID this property belongs to"),
            ToolParameter(name="project_id", type="Optional[str]", required=False, description="Project ID", auto_fill_from_context=True),
            ToolParameter(name="workspace_slug", type="Optional[str]", required=False, description="Workspace slug", auto_fill_from_context=True),
        ],
    ),
    "update": ToolMetadata(
        name="properties_update",
        description="Update work item property details.",
        sdk_method="update_property",
        parameters=[
            ToolParameter(name="property_id", type="str", required=True, description="Property ID to update"),
            ToolParameter(name="type_id", type="str", required=True, description="Work item type ID this property belongs to"),
            ToolParameter(name="project_id", type="Optional[str]", required=False, description="Project ID", auto_fill_from_context=True),
            ToolParameter(name="workspace_slug", type="Optional[str]", required=False, description="Workspace slug", auto_fill_from_context=True),
            ToolParameter(name="display_name", type="Optional[str]", required=False, description="Display name for the property"),
            ToolParameter(
                name="property_type",
                type="Optional[str]",
                required=False,
                description="Type of property: TEXT, DATETIME, DECIMAL, BOOLEAN, OPTION, RELATION, URL, EMAIL, FILE",
            ),
            ToolParameter(name="relation_type", type="Optional[str]", required=False, description="Relation type for RELATION properties"),
            ToolParameter(name="description", type="Optional[str]", required=False, description="Description of the property"),
            ToolParameter(name="is_required", type="Optional[bool]", required=False, description="Whether this property is required"),
            ToolParameter(name="default_value", type="Optional[list]", required=False, description="List of default values"),
            ToolParameter(name="settings", type="Optional[dict]", required=False, description="Property settings"),
            ToolParameter(name="is_active", type="Optional[bool]", required=False, description="Whether the property is active"),
            ToolParameter(name="is_multi", type="Optional[bool]", required=False, description="Whether this property supports multiple values"),
            ToolParameter(name="validation_rules", type="Optional[dict]", required=False, description="Validation rules"),
            ToolParameter(name="external_source", type="Optional[str]", required=False, description="External system source identifier"),
            ToolParameter(name="external_id", type="Optional[str]", required=False, description="External system's identifier"),
        ],
        returns_entity_type="property",
    ),
    "delete": ToolMetadata(
        name="properties_delete",
        description="Delete a work item property.",
        sdk_method="delete_property",
        parameters=[
            ToolParameter(name="property_id", type="str", required=True, description="Property ID to delete"),
            ToolParameter(name="type_id", type="str", required=True, description="Work item type ID this property belongs to"),
            ToolParameter(name="project_id", type="Optional[str]", required=False, description="Project ID", auto_fill_from_context=True),
            ToolParameter(name="workspace_slug", type="Optional[str]", required=False, description="Workspace slug", auto_fill_from_context=True),
        ],
        returns_entity_type="property",
    ),
    # ==========================================================================
    # Property Options (for OPTION type properties)
    # ==========================================================================
    "create_option": ToolMetadata(
        name="properties_create_option",
        description="Create a new option for an OPTION type property.",
        sdk_method="create_property_option",
        parameters=[
            ToolParameter(name="property_id", type="str", required=True, description="Property ID to add option to"),
            ToolParameter(name="type_id", type="str", required=True, description="Work item type ID"),
            ToolParameter(name="name", type="str", required=True, description="Option display name"),
            ToolParameter(name="project_id", type="Optional[str]", required=False, description="Project ID", auto_fill_from_context=True),
            ToolParameter(name="workspace_slug", type="Optional[str]", required=False, description="Workspace slug", auto_fill_from_context=True),
            ToolParameter(name="value", type="Optional[str]", required=False, description="Option value (defaults to name if not provided)"),
        ],
        returns_entity_type="property_option",
    ),
    "list_options": ToolMetadata(
        name="properties_list_options",
        description="List all options for an OPTION type property.",
        sdk_method="list_property_options",
        parameters=[
            ToolParameter(name="property_id", type="str", required=True, description="Property ID to list options for"),
            ToolParameter(name="type_id", type="str", required=True, description="Work item type ID"),
            ToolParameter(name="project_id", type="Optional[str]", required=False, description="Project ID", auto_fill_from_context=True),
            ToolParameter(name="workspace_slug", type="Optional[str]", required=False, description="Workspace slug", auto_fill_from_context=True),
        ],
    ),
    "retrieve_option": ToolMetadata(
        name="properties_retrieve_option",
        description="Get a property option by ID.",
        sdk_method="retrieve_property_option",
        parameters=[
            ToolParameter(name="property_id", type="str", required=True, description="Property ID"),
            ToolParameter(name="type_id", type="str", required=True, description="Work item type ID"),
            ToolParameter(name="option_id", type="str", required=True, description="Option ID to retrieve"),
            ToolParameter(name="project_id", type="Optional[str]", required=False, description="Project ID", auto_fill_from_context=True),
            ToolParameter(name="workspace_slug", type="Optional[str]", required=False, description="Workspace slug", auto_fill_from_context=True),
        ],
    ),
    "update_option": ToolMetadata(
        name="properties_update_option",
        description="Update a property option.",
        sdk_method="update_property_option",
        parameters=[
            ToolParameter(name="property_id", type="str", required=True, description="Property ID"),
            ToolParameter(name="type_id", type="str", required=True, description="Work item type ID"),
            ToolParameter(name="option_id", type="str", required=True, description="Option ID to update"),
            ToolParameter(name="project_id", type="Optional[str]", required=False, description="Project ID", auto_fill_from_context=True),
            ToolParameter(name="workspace_slug", type="Optional[str]", required=False, description="Workspace slug", auto_fill_from_context=True),
            ToolParameter(name="name", type="Optional[str]", required=False, description="Option display name"),
            ToolParameter(name="value", type="Optional[str]", required=False, description="Option value"),
        ],
        returns_entity_type="property_option",
    ),
    "delete_option": ToolMetadata(
        name="properties_delete_option",
        description="Delete a property option.",
        sdk_method="delete_property_option",
        parameters=[
            ToolParameter(name="property_id", type="str", required=True, description="Property ID"),
            ToolParameter(name="type_id", type="str", required=True, description="Work item type ID"),
            ToolParameter(name="option_id", type="str", required=True, description="Option ID to delete"),
            ToolParameter(name="project_id", type="Optional[str]", required=False, description="Project ID", auto_fill_from_context=True),
            ToolParameter(name="workspace_slug", type="Optional[str]", required=False, description="Workspace slug", auto_fill_from_context=True),
        ],
        returns_entity_type="property_option",
    ),
    # ==========================================================================
    # Property Values (values set on work items)
    # ==========================================================================
    "create_value": ToolMetadata(
        name="properties_create_value",
        description='Set a property value on a work item. For simple types (TEXT), provide the value directly. For single-select (OPTION), provide the Option ID. For multi-select, provide a JSON-formatted list of Option IDs (e.g., \'["uuid1", "uuid2"]\').',  # noqa: E501
        sdk_method="create_property_value",
        parameters=[
            ToolParameter(name="property_id", type="str", required=True, description="Property ID"),
            ToolParameter(name="type_id", type="str", required=True, description="Work item type ID"),
            ToolParameter(name="issue_id", type="str", required=True, description="Work item ID to set value on"),
            ToolParameter(name="value", type="str", required=True, description="Property value (use Option ID for OPTION types)"),
            ToolParameter(name="project_id", type="Optional[str]", required=False, description="Project ID", auto_fill_from_context=True),
            ToolParameter(name="workspace_slug", type="Optional[str]", required=False, description="Workspace slug", auto_fill_from_context=True),
        ],
        returns_entity_type="property_value",
    ),
}


# ============================================================================
# TOOL FACTORY
# ============================================================================


def get_property_tools(method_executor, context):
    """Return LangChain tools for the properties category using auto-generation from metadata."""
    return generate_tools_for_category("properties", method_executor, context, PROPERTIES_TOOL_DEFINITIONS)
