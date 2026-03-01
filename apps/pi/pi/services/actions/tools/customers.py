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
Customers API tools for Plane customer relationship management.
"""

from typing import Dict

from pi.services.actions.tool_generator import generate_tools_for_category
from pi.services.actions.tool_metadata import ToolMetadata
from pi.services.actions.tool_metadata import ToolParameter

# ============================================================================
# CUSTOMERS TOOL DEFINITIONS
# ============================================================================

CUSTOMER_TOOL_DEFINITIONS: Dict[str, ToolMetadata] = {
    "create": ToolMetadata(
        name="customers_create",
        description="Create a new customer",
        sdk_method="create_customer",
        returns_entity_type="customer",
        parameters=[
            ToolParameter(
                name="name",
                type="str",
                required=True,
                description="Customer name (required)",
            ),
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (auto-detected from context)",
                auto_fill_from_context=True,
            ),
            ToolParameter(
                name="description",
                type="Optional[str]",
                required=False,
                description="Plain text description (optional)",
            ),
            ToolParameter(
                name="description_html",
                type="Optional[str]",
                required=False,
                description="HTML description (optional)",
            ),
            ToolParameter(
                name="email",
                type="Optional[str]",
                required=False,
                description="Customer contact email (optional)",
            ),
            ToolParameter(
                name="website_url",
                type="Optional[str]",
                required=False,
                description="Customer website URL (optional)",
            ),
            ToolParameter(
                name="logo_props",
                type="Optional[dict]",
                required=False,
                description="Logo configuration JSON (optional)",
            ),
            ToolParameter(
                name="domain",
                type="Optional[str]",
                required=False,
                description="Customer domain (optional)",
            ),
            ToolParameter(
                name="employees",
                type="Optional[int]",
                required=False,
                description="Number of employees (optional)",
            ),
            ToolParameter(
                name="stage",
                type="Optional[str]",
                required=False,
                description="Customer stage/lifecycle. Valid values: 'lead', 'sales_qualified_lead', 'contract_negotiation', 'closed_won', 'closed_lost' (optional)",  # noqa E501
            ),
            ToolParameter(
                name="contract_status",
                type="Optional[str]",
                required=False,
                description="Contract status. Valid values: 'active', 'pre_contract', 'signed', 'inactive' (optional)",
            ),
            ToolParameter(
                name="revenue",
                type="Optional[float]",
                required=False,
                description="Annual revenue (optional)",
            ),
        ],
    ),
    "list": ToolMetadata(
        name="customers_list",
        description="List all customers in the workspace",
        sdk_method="list_customers",
        parameters=[
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (auto-detected from context)",
                auto_fill_from_context=True,
            ),
        ],
    ),
    "retrieve": ToolMetadata(
        name="customers_retrieve",
        description="Retrieve a single customer by ID",
        sdk_method="retrieve_customer",
        parameters=[
            ToolParameter(
                name="customer_id",
                type="str",
                required=True,
                description="Customer ID (required)",
            ),
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (auto-detected from context)",
                auto_fill_from_context=True,
            ),
        ],
    ),
    "update": ToolMetadata(
        name="customers_update",
        description="Update customer details",
        sdk_method="update_customer",
        returns_entity_type="customer",
        parameters=[
            ToolParameter(
                name="customer_id",
                type="str",
                required=True,
                description="Customer ID (required)",
            ),
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (auto-detected from context)",
                auto_fill_from_context=True,
            ),
            ToolParameter(
                name="name",
                type="Optional[str]",
                required=False,
                description="New customer name",
            ),
            ToolParameter(
                name="description",
                type="Optional[str]",
                required=False,
                description="New plain text description",
            ),
            ToolParameter(
                name="description_html",
                type="Optional[str]",
                required=False,
                description="New HTML description",
            ),
            ToolParameter(
                name="email",
                type="Optional[str]",
                required=False,
                description="New contact email",
            ),
            ToolParameter(
                name="website_url",
                type="Optional[str]",
                required=False,
                description="New website URL",
            ),
            ToolParameter(
                name="logo_props",
                type="Optional[dict]",
                required=False,
                description="New logo configuration JSON",
            ),
            ToolParameter(
                name="domain",
                type="Optional[str]",
                required=False,
                description="New domain",
            ),
            ToolParameter(
                name="employees",
                type="Optional[int]",
                required=False,
                description="New employee count",
            ),
            ToolParameter(
                name="stage",
                type="Optional[str]",
                required=False,
                description="New customer stage. Valid values: 'lead', 'sales_qualified_lead', 'contract_negotiation', 'closed_won', 'closed_lost'",
            ),
            ToolParameter(
                name="contract_status",
                type="Optional[str]",
                required=False,
                description="New contract status. Valid values: 'active', 'pre_contract', 'signed', 'inactive'",
            ),
            ToolParameter(
                name="revenue",
                type="Optional[float]",
                required=False,
                description="New annual revenue",
            ),
        ],
    ),
    "delete": ToolMetadata(
        name="customers_delete",
        description="Delete a customer",
        sdk_method="delete_customer",
        parameters=[
            ToolParameter(
                name="customer_id",
                type="str",
                required=True,
                description="Customer ID (required)",
            ),
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (auto-detected from context)",
                auto_fill_from_context=True,
            ),
        ],
    ),
    # Customer Properties
    "create_property": ToolMetadata(
        name="customers_create_property",
        description="Create a custom property for customers",
        sdk_method="create_customer_property",
        returns_entity_type="customer_property",
        parameters=[
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (auto-detected from context)",
                auto_fill_from_context=True,
            ),
            ToolParameter(
                name="name",
                type="str",
                required=True,
                description="Property name (required)",
            ),
            ToolParameter(
                name="display_name",
                type="str",
                required=True,
                description="Display name for the property (required)",
            ),
            ToolParameter(
                name="property_type",
                type="str",
                required=True,
                description="Property type: TEXT, INTEGER, DECIMAL, BOOLEAN, DATE, DATETIME, SELECT, MULTI_SELECT, etc",
            ),
            ToolParameter(
                name="description",
                type="Optional[str]",
                required=False,
                description="Property description (optional)",
            ),
            ToolParameter(
                name="is_required",
                type="Optional[bool]",
                required=False,
                description="Whether the property is required (optional)",
            ),
            ToolParameter(
                name="default_value",
                type="Optional[list]",
                required=False,
                description="Default value for the property (optional)",
            ),
        ],
    ),
    "list_properties": ToolMetadata(
        name="customers_list_properties",
        description="List all custom properties for customers",
        sdk_method="list_customer_properties",
        parameters=[
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (auto-detected from context)",
                auto_fill_from_context=True,
            ),
        ],
    ),
    "retrieve_property": ToolMetadata(
        name="customers_retrieve_property",
        description="Retrieve a customer property by ID",
        sdk_method="retrieve_customer_property",
        parameters=[
            ToolParameter(
                name="property_id",
                type="str",
                required=True,
                description="Property ID (required)",
            ),
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (auto-detected from context)",
                auto_fill_from_context=True,
            ),
        ],
    ),
    "update_property": ToolMetadata(
        name="customers_update_property",
        description="Update a customer property",
        sdk_method="update_customer_property",
        returns_entity_type="customer_property",
        parameters=[
            ToolParameter(
                name="property_id",
                type="str",
                required=True,
                description="Property ID (required)",
            ),
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (auto-detected from context)",
                auto_fill_from_context=True,
            ),
            ToolParameter(
                name="display_name",
                type="Optional[str]",
                required=False,
                description="New display name",
            ),
            ToolParameter(
                name="description",
                type="Optional[str]",
                required=False,
                description="New description",
            ),
        ],
    ),
    "delete_property": ToolMetadata(
        name="customers_delete_property",
        description="Delete a customer property",
        sdk_method="delete_customer_property",
        parameters=[
            ToolParameter(
                name="property_id",
                type="str",
                required=True,
                description="Property ID (required)",
            ),
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (auto-detected from context)",
                auto_fill_from_context=True,
            ),
        ],
    ),
    # Customer Requests
    "create_request": ToolMetadata(
        name="customers_create_request",
        description="Create a feature/support request for a customer",
        sdk_method="create_customer_request",
        returns_entity_type="customer_request",
        parameters=[
            ToolParameter(
                name="customer_id",
                type="str",
                required=True,
                description="Customer ID (required)",
            ),
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (auto-detected from context)",
                auto_fill_from_context=True,
            ),
            ToolParameter(
                name="name",
                type="str",
                required=True,
                description="Request name/title (required)",
            ),
            ToolParameter(
                name="description",
                type="Optional[str]",
                required=False,
                description="Request description (optional)",
            ),
            ToolParameter(
                name="description_html",
                type="Optional[str]",
                required=False,
                description="HTML description (optional)",
            ),
            ToolParameter(
                name="link",
                type="Optional[str]",
                required=False,
                description="Related link/URL (optional)",
            ),
            ToolParameter(
                name="work_item_ids",
                type="Optional[list]",
                required=False,
                description="List of related work item IDs (optional)",
            ),
        ],
    ),
    "list_requests": ToolMetadata(
        name="customers_list_requests",
        description="List all requests for a customer",
        sdk_method="list_customer_requests",
        parameters=[
            ToolParameter(
                name="customer_id",
                type="str",
                required=True,
                description="Customer ID (required)",
            ),
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (auto-detected from context)",
                auto_fill_from_context=True,
            ),
        ],
    ),
    "retrieve_request": ToolMetadata(
        name="customers_retrieve_request",
        description="Retrieve a customer request by ID",
        sdk_method="retrieve_customer_request",
        parameters=[
            ToolParameter(
                name="customer_id",
                type="str",
                required=True,
                description="Customer ID (required)",
            ),
            ToolParameter(
                name="request_id",
                type="str",
                required=True,
                description="Request ID (required)",
            ),
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (auto-detected from context)",
                auto_fill_from_context=True,
            ),
        ],
    ),
    "update_request": ToolMetadata(
        name="customers_update_request",
        description="Update a customer request",
        sdk_method="update_customer_request",
        returns_entity_type="customer_request",
        parameters=[
            ToolParameter(
                name="customer_id",
                type="str",
                required=True,
                description="Customer ID (required)",
            ),
            ToolParameter(
                name="request_id",
                type="str",
                required=True,
                description="Request ID (required)",
            ),
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (auto-detected from context)",
                auto_fill_from_context=True,
            ),
            ToolParameter(
                name="name",
                type="Optional[str]",
                required=False,
                description="New request name",
            ),
            ToolParameter(
                name="description",
                type="Optional[str]",
                required=False,
                description="New description",
            ),
            ToolParameter(
                name="link",
                type="Optional[str]",
                required=False,
                description="New link/URL",
            ),
            ToolParameter(
                name="work_item_ids",
                type="Optional[list]",
                required=False,
                description="New list of work item IDs",
            ),
        ],
    ),
    "delete_request": ToolMetadata(
        name="customers_delete_request",
        description="Delete a customer request",
        sdk_method="delete_customer_request",
        parameters=[
            ToolParameter(
                name="customer_id",
                type="str",
                required=True,
                description="Customer ID (required)",
            ),
            ToolParameter(
                name="request_id",
                type="str",
                required=True,
                description="Request ID (required)",
            ),
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (auto-detected from context)",
                auto_fill_from_context=True,
            ),
        ],
    ),
}


# ============================================================================
# TOOL FACTORY
# ============================================================================


def get_customer_tools(method_executor, context):
    """Return LangChain tools for the customers category using auto-generation from metadata."""
    return generate_tools_for_category(
        category="customers",
        method_executor=method_executor,
        context=context,
        tool_definitions=CUSTOMER_TOOL_DEFINITIONS,
    )
