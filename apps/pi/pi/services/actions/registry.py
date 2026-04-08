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
Plane API Categories and Methods Registry
Centralized source of truth for all API categories, methods, and descriptions.
Used by both MethodExecutor and LangChain tools to ensure consistency.
"""

from typing import Dict
from typing import Optional

# Centralized registry of all API categories and their methods
API_CATEGORIES: Dict[str, str] = {
    # Not exposed to router by default (see ROUTER_HIDDEN_CATEGORIES)
    "assets": "Manage and organize project assets",
    # Categories with richer, router-grade guidance
    "workitems": "Create/update/list/get/delete work-items (issues) and create/update epics; assignments, state changes, priority updates",
    "projects": "Create/list/update/delete projects",
    "cycles": "Create/list/update/delete cycles (sprints); add/remove workitems to/from cycles",
    "labels": "Create/list/update/delete labels",
    "states": "Create/list/update/delete states",
    "modules": "Create/list/update/delete modules; add/remove workitems to/from modules",
    "pages": "Create and manage project/workspace pages (rich text, fonts, images, styles)",
    "users": "Get current user information",
    "intake": "Create/update/list/delete intake work items (triage queue); forms, guest submissions, triage workflow",
    "members": "Workspace and project member management and listings",
    "activity": "Track work item activities, history, and audit logs",
    "comments": "Comments and discussions on work items",
    "links": "External links and references on work items",
    "properties": "Custom properties and fields for work items",
    "types": "Custom work item types (bug, task, story, etc.)",
    "worklogs": "Time tracking and work logs",
    "initiatives": "Create/list/update/delete initiatives (cross-project goal containers)",
    "teamspaces": "Manage teamspaces (team containers for projects and cycles)",
    "stickies": "Create/list/update/delete sticky notes (plain text notes, no rich media)",
    "customers": "Manage customer records and CRM integrations",
    "workspaces": "Workspace-level operations and feature management",
    # Keep attachments in registry for completeness; hidden from router unless enabled
    "attachments": "Manage file attachments on work items",
}

# Categories hidden from the action category router (but kept in registry).
# Toggle by editing this set. One-line change restores visibility.
ROUTER_HIDDEN_CATEGORIES = {"assets", "attachments"}

# Centralized registry of methods for each category
API_METHODS: Dict[str, Dict[str, str]] = {
    "workitems": {
        "create": "Create a new work item/issue",
        "update": "Update an existing work item/issue",
        "retrieve": "Get details of a single work item",
        "list": "List work items in a project",
        "delete": "Delete a work item",
        "create_relation": "Create a relationship between work items (blocks, relates_to, etc.)",
        "search": "Search work items across workspace by query string",
        "advanced_search": "Filter work items by metadata with AND/OR/NOT logic (priority, state, assignee, etc.)",
        "list_epics": "List epics in a project",
    },
    "projects": {
        "create": "Create a new project",
        "list": "List projects in workspace",
        "retrieve": "Get details of a single project",
        "update": "Update project details",
        "delete": "Delete a project",
        "get_features": "Get enabled project features (epics, cycles, modules, etc.)",
        "update_features": "Enable or disable project features",
    },
    "cycles": {
        "create": "Create a new cycle",
        "list": "List cycles in project",
        "retrieve": "Get a single cycle by ID",
        "update": "Update cycle details",
        "delete": "Delete a cycle",
        "archive": "Archive a cycle",
        "unarchive": "Restore an archived cycle",
        "list_archived": "List archived cycles",
        "add_work_items": "Add work items to cycle",
        "list_work_items": "List work items in cycle",
        "retrieve_work_item": "Get specific work item in cycle",
        "remove_work_item": "Remove work item from cycle",
        "transfer_work_items": "Transfer work items between cycles",
    },
    "labels": {
        "create": "Create a new label",
        "list": "List labels in project",
        "retrieve": "Get a single label by ID",
        "update": "Update label details",
        "delete": "Delete a label",
    },
    "states": {
        "create": "Create a new state",
        "list": "List states in project",
        "retrieve": "Get a single state by ID",
        "update": "Update state details",
        "delete": "Delete a state",
    },
    "modules": {
        "create": "Create a new module",
        "list": "List modules in project",
        "retrieve": "Get a single module by ID",
        "update": "Update module details",
        "delete": "Delete a module",
        "archive": "Archive a module",
        "unarchive": "Restore an archived module",
        "list_archived": "List archived modules",
        "add_work_items": "Add work items to module",
        "list_work_items": "List work items in module",
        "remove_work_item": "Remove work item from module",
    },
    "pages": {
        "create_project_page": "Create a new page in a project",
        "create_workspace_page": "Create a new page in the workspace",
    },
    "users": {
        "get_current": "Get current user information",
    },
    "intake": {
        "create": "Submit work item to intake queue for triage",
        "list": "List all intake work items",
        "retrieve": "Get a single intake work item by ID",
        "update": "Update intake work item details",
        "delete": "Remove intake work item",
    },
    "initiatives": {
        "create": "Create a new initiative",
        "list": "List initiatives in workspace",
        "retrieve": "Get single initiative by ID",
        "update": "Update initiative details",
        "delete": "Delete an initiative",
        "create_label": "Create initiative label",
        "list_labels": "List initiative labels",
        "retrieve_label": "Get initiative label by ID",
        "update_label": "Update initiative label",
        "delete_label": "Delete initiative label",
        "add_labels": "Add labels to initiative",
        "remove_labels": "Remove labels from initiative",
        "add_projects": "Link projects to initiative",
        "list_projects": "List initiative's projects",
        "remove_projects": "Unlink projects from initiative",
        "add_epics": "Link epics to initiative",
        "list_epics": "List initiative's epics",
        "remove_epics": "Unlink epics from initiative",
    },
    "teamspaces": {
        "create": "Create a new teamspace",
        "list": "List teamspaces in workspace",
        "retrieve": "Get single teamspace by ID",
        "update": "Update teamspace details",
        "delete": "Delete a teamspace",
        "add_members": "Add members to teamspace",
        "list_members": "List teamspace members",
        "remove_members": "Remove members from teamspace",
        "add_projects": "Add projects to teamspace",
        "list_projects": "List teamspace projects",
        "remove_projects": "Remove projects from teamspace",
    },
    "stickies": {
        "create": "Create a new sticky note",
        "list": "List stickies in workspace",
        "retrieve": "Get single sticky by ID",
        "update": "Update sticky details",
        "delete": "Delete a sticky",
    },
    "customers": {
        "create": "Create a new customer",
        "list": "List customers in workspace",
        "retrieve": "Get single customer by ID",
        "update": "Update customer details",
        "delete": "Delete a customer",
        "create_property": "Create a customer custom property",
        "list_properties": "List customer custom properties",
        "retrieve_property": "Get single customer property by ID",
        "update_property": "Update customer property",
        "delete_property": "Delete customer property",
        "create_request": "Create a customer feature request",
        "list_requests": "List customer feature requests",
        "retrieve_request": "Get single customer request by ID",
        "update_request": "Update customer request",
        "delete_request": "Delete customer request",
    },
    "members": {
        "get_workspace_members": "List all workspace members",
        "get_project_members": "List all project members",
    },
    "activity": {
        "list": "List all activities for a work item",
        "retrieve": "Get a single activity by ID",
    },
    "attachments": {
        "create": "Create a new attachment on work item",
        "list": "List all attachments on work item",
        "retrieve": "Get a single attachment by ID",
        "delete": "Delete an attachment",
    },
    "comments": {
        "create": "Add new comment to work item",
        "list": "List all comments on work item",
        "retrieve": "Get a single comment by ID",
        "update": "Update comment details",
        "delete": "Delete a comment",
    },
    "links": {
        "create": "Add external link to work item",
        "list": "List all links on work item",
        "retrieve": "Get a single link by ID",
        "update": "Update link details",
        "delete": "Delete a link",
    },
    "properties": {
        "create": "Create custom property",
        "list": "List all custom properties",
        "retrieve": "Get a single property by ID",
        "update": "Update property details",
        "delete": "Delete a property",
        "create_option": "Create property option",
        "create_value": "Create property value",
        "list_options": "List property options",
        "list_values": "List property values",
        "retrieve_option": "Get property option by ID",
        "update_option": "Update property option",
        "delete_option": "Delete property option",
    },
    "types": {
        "create": "Create work item type",
        "list": "List all work item types",
        "retrieve": "Get a single type by ID",
        "update": "Update type details",
        "delete": "Delete a type",
    },
    "worklogs": {
        "create": "Create time entry",
        "list": "List all time entries",
        "get_summary": "Get project worklog summary",
        "update": "Update time entry",
        "delete": "Delete time entry",
    },
    "workspaces": {
        "get_features": "Get enabled workspace features (initiatives, teams, customers, etc.)",
        "update_features": "Enable or disable workspace features",
    },
}


def get_available_categories() -> Dict[str, str]:
    """Get all available API categories with descriptions."""
    return API_CATEGORIES.copy()


def get_router_categories() -> Dict[str, str]:
    """Categories visible to the action category router (excludes hidden).

    This lets us hide categories like 'assets' without changing all call sites.
    Toggle visibility by editing ROUTER_HIDDEN_CATEGORIES above.
    """
    return {k: v for k, v in API_CATEGORIES.items() if k not in ROUTER_HIDDEN_CATEGORIES}


def get_category_methods(category: str) -> Dict[str, str]:
    """Get available methods for a specific category."""
    return API_METHODS.get(category, {}).copy()


def get_all_methods() -> Dict[str, Dict[str, str]]:
    """Get all methods for all categories."""
    return API_METHODS.copy()


# Centralized mapping from simplified method names (LLM-facing) to actual SDK adapter method names
# Both MethodExecutor and PlaneActionsExecutor should use this to resolve names.
# If a method is already the actual method name, it can be passed-through as-is.
METHOD_NAME_MAP: Dict[str, Dict[str, str]] = {
    "workitems": {
        "create": "create_work_item",
        "update": "update_work_item",
        "create_relation": "create_work_item_relation",
        "list": "list_work_items",
        "retrieve": "retrieve_work_item",
        "delete": "delete_work_item",
        "advanced_search": "advanced_search_work_items",
        "create_epic": "create_work_item",  # Epic is a workitem with specific type_id
        "update_epic": "update_work_item",  # Epic is a workitem with specific type_id
        "list_epics": "list_epics",
    },
    "projects": {
        "create": "create_project",
        "list": "list_projects",
        "retrieve": "retrieve_project",
        "update": "update_project",
        "delete": "delete_project",
        "get_features": "get_project_features",
        "update_features": "update_project_features",
    },
    "cycles": {
        "create": "create_cycle",
        "list": "list_cycles",
        "retrieve": "retrieve_cycle",
        "update": "update_cycle",
        "archive": "archive_cycle",
        "unarchive": "unarchive_cycle",
        "list_archived": "list_archived_cycles",
        "add_work_items": "add_cycle_work_items",
        "list_work_items": "list_cycle_work_items",
        "remove_work_item": "remove_cycle_work_item",
        "transfer_work_items": "transfer_cycle_work_items",
        "delete": "delete_cycle",
    },
    "labels": {
        "create": "create_label",
        "list": "list_labels",
        "retrieve": "retrieve_label",
        "update": "update_label",
        "delete": "delete_label",
    },
    "states": {
        "create": "create_state",
        "list": "list_states",
        "retrieve": "retrieve_state",
        "update": "update_state",
        "delete": "delete_state",
    },
    "modules": {
        "create": "create_module",
        "list": "list_modules",
        "retrieve": "retrieve_module",
        "update": "update_module",
        "archive": "archive_module",
        "unarchive": "unarchive_module",
        "list_archived": "list_archived_modules",
        "add_work_items": "add_module_work_items",
        "list_work_items": "list_module_work_items",
        "remove_work_item": "remove_module_work_item",
        "delete": "delete_module",
    },
    "pages": {
        "create_project_page": "create_project_page",
        "create_workspace_page": "create_workspace_page",
        "retrieve_project": "retrieve_project_page",
        "retrieve_workspace": "retrieve_workspace_page",
    },
    "assets": {
        "create": "create_generic_asset_upload",
        "create_user_upload": "create_user_asset_upload",
        "get_generic": "get_generic_asset",
        "update_generic": "update_generic_asset",
        "update_user": "update_user_asset",
        "delete_user": "delete_user_asset",
    },
    "users": {
        # Kept as actual name for pass-through
        "get_current_user": "get_current_user",
    },
    "intake": {
        "create": "create_intake_work_item",
        "list": "get_intake_work_items_list",
        "retrieve": "retrieve_intake_work_item",
        "update": "update_intake_work_item",
        "delete": "delete_intake_work_item",
    },
    "initiatives": {
        "create": "create_initiative",
        "list": "list_initiatives",
        "retrieve": "retrieve_initiative",
        "update": "update_initiative",
        "delete": "delete_initiative",
        "create_label": "create_initiative_label",
        "list_labels": "list_initiative_labels",
        "retrieve_label": "retrieve_initiative_label",
        "update_label": "update_initiative_label",
        "delete_label": "delete_initiative_label",
        "add_labels": "add_initiative_labels",
        "remove_labels": "remove_initiative_labels",
        "add_projects": "add_initiative_projects",
        "list_projects": "list_initiative_projects",
        "remove_projects": "remove_initiative_projects",
        "add_epics": "add_initiative_epics",
        "list_epics": "list_initiative_epics",
        "remove_epics": "remove_initiative_epics",
    },
    "teamspaces": {
        "create": "create_teamspace",
        "list": "list_teamspaces",
        "retrieve": "retrieve_teamspace",
        "update": "update_teamspace",
        "delete": "delete_teamspace",
        "add_members": "add_teamspace_members",
        "list_members": "list_teamspace_members",
        "remove_members": "remove_teamspace_members",
        "add_projects": "add_teamspace_projects",
        "list_projects": "list_teamspace_projects",
        "remove_projects": "remove_teamspace_projects",
    },
    "stickies": {
        "create": "create_sticky",
        "list": "list_stickies",
        "retrieve": "retrieve_sticky",
        "update": "update_sticky",
        "delete": "delete_sticky",
    },
    "customers": {
        "create": "create_customer",
        "list": "list_customers",
        "retrieve": "retrieve_customer",
        "update": "update_customer",
        "delete": "delete_customer",
        "create_property": "create_customer_property",
        "list_properties": "list_customer_properties",
        "retrieve_property": "retrieve_customer_property",
        "update_property": "update_customer_property",
        "delete_property": "delete_customer_property",
        "create_request": "create_customer_request",
        "list_requests": "list_customer_requests",
        "retrieve_request": "retrieve_customer_request",
        "update_request": "update_customer_request",
        "delete_request": "delete_customer_request",
    },
    "members": {
        "get_workspace_members": "get_workspace_members",
        "get_project_members": "get_project_members",
    },
    "activity": {
        "list": "list_work_item_activities",
        "retrieve": "retrieve_work_item_activity",
    },
    "attachments": {
        "create": "create_work_item_attachment",
        "list": "list_work_item_attachments",
        "retrieve": "retrieve_work_item_attachment",
        "update": "update_work_item_attachment",
        "delete": "delete_work_item_attachment",
    },
    "comments": {
        "create": "create_work_item_comment",
        "list": "list_work_item_comments",
        "retrieve": "retrieve_work_item_comment",
        "update": "update_work_item_comment",
        "delete": "delete_work_item_comment",
    },
    "links": {
        "create": "create_work_item_link",
        "list": "list_work_item_links",
        "retrieve": "retrieve_work_item_link",
        "update": "update_issue_link",
        "delete": "delete_work_item_link",
    },
    "properties": {
        "create": "create_issue_property",
        "list": "list_issue_properties",
        "retrieve": "retrieve_issue_property",
        "update": "update_issue_property",
        "delete": "delete_issue_property",
        "create_option": "create_issue_property_option",
        "create_value": "create_issue_property_value",
        "list_options": "list_issue_property_options",
        "list_values": "list_issue_property_values",
        "retrieve_option": "retrieve_issue_property_option",
        "update_option": "update_issue_property_option",
        "delete_option": "delete_issue_property_option",
    },
    "types": {
        "create": "create_issue_type",
        "list": "list_issue_types",
        "retrieve": "retrieve_issue_type",
        "update": "update_issue_type",
        "delete": "delete_issue_type",
    },
    "worklogs": {
        "create": "create_issue_worklog",
        "list": "list_issue_worklogs",
        "get_summary": "get_project_worklog_summary",
        "update": "update_issue_worklog",
        "delete": "delete_issue_worklog",
    },
    "workspaces": {
        "get_features": "get_workspace_features",
        "update_features": "update_workspace_features",
    },
}


# tool_name to category mapping
def build_tool_name_to_category_map() -> Dict[str, str]:
    tool_name_to_category_map = {}
    for category, methods in METHOD_NAME_MAP.items():
        for method_name in methods.values():
            tool_name_to_category_map[method_name] = category
    return tool_name_to_category_map


TOOL_NAME_TO_CATEGORY_MAP = build_tool_name_to_category_map()


def get_method_name_map(category: str) -> Dict[str, str]:
    """Return the simplified→actual method mapping for a category (empty if none)."""
    return METHOD_NAME_MAP.get(category, {}).copy()


def resolve_actual_method_name(category: str, method: str) -> Optional[str]:
    """Resolve a simplified method name to the actual adapter method name.

    If the method is already the actual method name, returns it as-is if present in the
    mapping values (or if mapping is empty for the category). Returns None if the
    category is unknown.
    """
    if category not in API_CATEGORIES:
        return None

    mapping = METHOD_NAME_MAP.get(category, {})
    if method in mapping:
        return mapping[method]

    # If not a simplified name, assume it could already be actual; allow pass-through
    return method
