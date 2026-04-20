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
Projects API tools for Plane workspace operations.

MIGRATED TO AUTO-GENERATED TOOLS
Tool metadata defined in this file. Custom pre/post handlers for complex logic.
Special handling includes: identifier generation, conflict retry, DB fallback, UUID validation.
Old manual definitions kept below for comparison/rollback safety.
"""

import re
from typing import Any
from typing import Dict

from pi import logger
from pi.core.db import PlaneDBPool
from pi.services.actions.tool_generator import generate_tools_for_category
from pi.services.actions.tool_metadata import ToolMetadata
from pi.services.actions.tool_metadata import ToolParameter
from pi.services.actions.tools.base import PlaneToolBase

log = logger.getChild(__name__)


# ============================================================================
# PROJECT-SPECIFIC HANDLER FUNCTIONS
# ============================================================================


async def _project_pre_handler(
    metadata: ToolMetadata,
    kwargs: Dict[str, Any],
    context: Dict[str, Any],
    category: str,
    method_key: str,
    method_executor: Any = None,
) -> Dict[str, Any]:
    """Pre-processing handler for projects tools.

    Handles:
    - projects_create: identifier generation, description_html, icon sync
    - projects_update: description_html, icon sync, identifier strip
    - projects_retrieve: UUID validation
    """

    if method_key == "create":
        # Generate identifier if not provided
        if "identifier" not in kwargs or not kwargs["identifier"]:
            name = kwargs.get("name", "")
            kwargs["identifier"] = PlaneToolBase.generate_project_identifier(name)
            log.debug(f"Generated project identifier: {kwargs['identifier']}")

        # Auto-generate description_html from description if needed
        if "description" in kwargs and kwargs["description"]:
            if "description_html" not in kwargs or not kwargs["description_html"]:
                kwargs["description_html"] = f"<p>{kwargs['description']}</p>"

        # Remove icon_prop and logo_props - SDK auto-generates these and ignores user input
        kwargs.pop("icon_prop", None)
        kwargs.pop("logo_props", None)

    elif method_key == "update":
        # Auto-generate description_html from description if needed
        if "description" in kwargs and kwargs["description"]:
            if "description_html" not in kwargs or not kwargs["description_html"]:
                kwargs["description_html"] = f"<p>{kwargs['description']}</p>"

        # Remove icon_prop and logo_props - SDK auto-generates these and ignores user input
        kwargs.pop("icon_prop", None)
        kwargs.pop("logo_props", None)

        # Strip identifier if provided
        if "identifier" in kwargs and kwargs["identifier"]:
            kwargs["identifier"] = kwargs["identifier"].strip()

    elif method_key == "retrieve":
        # UUID validation
        project_id = kwargs.get("project_id", "")
        if "<id of" in project_id:
            raise ValueError(
                f"Invalid project_id: received a placeholder. Resolve a real UUID using search_project_by_name or search_project_by_identifier before calling projects_retrieve. project_id={project_id}"  # noqa E501
            )

        uuid_regex = re.compile(r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$")
        if not uuid_regex.match(project_id):
            raise ValueError(
                f"Invalid project_id format: expected UUID. Use search_project_by_name or search_project_by_identifier to resolve the UUID, then retry. project_id={project_id}"  # noqa E501
            )

    return kwargs


async def _project_post_handler(
    metadata: ToolMetadata,
    result: Dict[str, Any],
    kwargs: Dict[str, Any],
    context: Dict[str, Any],
    method_executor: Any,
    category: str,
    method_key: str,
) -> Dict[str, Any]:
    """Post-processing handler for projects_create.

    Handles identifier conflicts with retry logic and DB fallback for timeout recovery.
    """

    if method_key == "create" and not result["success"]:
        error_msg = result.get("error", "").lower()
        base_identifier = kwargs.get("identifier", "")
        name = kwargs.get("name", "")
        workspace_slug = kwargs.get("workspace_slug", "")

        # Check if it's a conflict error
        if "already taken" in error_msg or "409" in error_msg or "conflict" in error_msg:
            if "name" in error_msg and "identifier" not in error_msg:
                # Name conflict - can't retry
                log.debug(f"Project name '{name}' already exists. Error: {result["error"]}")
                result["error"] = f"Failed to create project: A project with the name '{name}' already exists. Please choose a different name."
            else:
                # Identifier conflict - retry with new identifier
                new_identifier = PlaneToolBase.generate_fallback_identifier(base_identifier)
                retry_kwargs = {**kwargs, "identifier": new_identifier}
                retry_result = await method_executor.execute(category, method_key, **retry_kwargs)

                if retry_result["success"]:
                    log.debug(f"Successfully created project with fallback identifier '{new_identifier}'")
                    result = retry_result
                else:
                    log.debug(f"Failed to create project even with alternative identifier. Error: {retry_result["error"]}")
                    result = retry_result
        else:
            # Check if project was created despite error (timeout recovery)
            try:
                query = """
                    SELECT p.id, p.name, p.identifier, p.workspace_id
                    FROM projects p
                    JOIN workspaces w ON p.workspace_id = w.id
                    WHERE p.identifier = $1 AND w.slug = $2 AND p.deleted_at IS NULL
                """
                row = await PlaneDBPool.fetchrow(query, (base_identifier, workspace_slug))
                if row:
                    project_data = {
                        "id": str(row["id"]),
                        "name": row["name"],
                        "identifier": row["identifier"],
                        "workspace_id": str(row["workspace_id"]),
                        "workspace_slug": workspace_slug,
                    }
                    result = {"success": True, "data": project_data}
                    log.debug(f"Recovered project creation from DB for identifier '{base_identifier}'")
            except Exception as e:
                log.error(f"Failed to recover project creation from DB: {e}")

    return result


# ============================================================================
# PROJECT TOOL METADATA
# ============================================================================

PROJECT_TOOL_DEFINITIONS: Dict[str, ToolMetadata] = {
    "create": ToolMetadata(
        name="projects_create",
        description="Create a new project in the workspace",
        sdk_method="create_project",
        returns_entity_type="project",
        pre_handler=_project_pre_handler,
        post_handler=_project_post_handler,
        parameters=[
            ToolParameter(name="name", type="str", required=True, description="Project name (required)"),
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (provide if known, otherwise auto-detected)",
                auto_fill_from_context=True,
            ),
            ToolParameter(
                name="description",
                type="Optional[str]",
                required=False,
                description="Project description in plain text (optional)",
            ),
            ToolParameter(
                name="description_html",
                type="Optional[str]",
                required=False,
                description="Project description in HTML format (optional, auto-generated from description if not provided)",
            ),
            ToolParameter(
                name="identifier",
                type="Optional[str]",
                required=False,
                description="Project identifier (auto-generated from name if omitted)",
            ),
            ToolParameter(
                name="project_lead",
                type="Optional[str]",
                required=False,
                description="User ID to set as project lead (optional)",
            ),
            # NOTE: icon_prop, emoji and logo_props are auto-generated by SDK and cannot be set by users
            ToolParameter(name="cover_image", type="Optional[str]", required=False, description="Cover image URL (optional)"),
            ToolParameter(
                name="network",
                type="Optional[int]",
                required=False,
                description="Network visibility setting (0=private, 2=public) (optional)",
            ),
            ToolParameter(
                name="default_assignee",
                type="Optional[str]",
                required=False,
                description="User ID to set as default assignee (optional)",
            ),
            ToolParameter(
                name="module_view",
                type="Optional[bool]",
                required=False,
                description="Enable/disable module view (optional)",
            ),
            ToolParameter(
                name="cycle_view",
                type="Optional[bool]",
                required=False,
                description="Enable/disable cycle view (optional)",
            ),
            ToolParameter(
                name="issue_views_view",
                type="Optional[bool]",
                required=False,
                description="Enable/disable issue views (optional)",
            ),
            ToolParameter(name="page_view", type="Optional[bool]", required=False, description="Enable/disable page view (optional)"),
            ToolParameter(
                name="intake_view",
                type="Optional[bool]",
                required=False,
                description="Enable/disable intake view (optional)",
            ),
            ToolParameter(
                name="archive_in",
                type="Optional[int]",
                required=False,
                description="Auto-archive workitems after N months. Should be less than or equal to 12 (optional)",
            ),
            ToolParameter(
                name="close_in",
                type="Optional[int]",
                required=False,
                description="Auto-archive workitems after N months. Should be less than or equal to 12 (optional)",
            ),
            ToolParameter(name="timezone", type="Optional[str]", required=False, description="Timezone for the project (optional)"),
            ToolParameter(
                name="is_time_tracking_enabled",
                type="Optional[bool]",
                required=False,
                description="Enable/disable time tracking, also called worklogs (optional)",
            ),
            ToolParameter(
                name="is_issue_type_enabled",
                type="Optional[bool]",
                required=False,
                description="Enable/disable issue type, also called workitem types (optional)",
            ),
        ],
    ),
    "retrieve": ToolMetadata(
        name="projects_retrieve",
        description="Retrieve a single project by ID",
        sdk_method="retrieve_project",
        pre_handler=_project_pre_handler,
        parameters=[
            ToolParameter(name="project_id", type="str", required=True, description="Project ID (required)"),
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (provide if known, otherwise auto-detected)",
                auto_fill_from_context=True,
            ),
        ],
    ),
    "update": ToolMetadata(
        name="projects_update",
        description="Update project details",
        sdk_method="update_project",
        returns_entity_type="project",
        pre_handler=_project_pre_handler,
        parameters=[
            ToolParameter(name="project_id", type="str", required=True, description="Project ID (required)"),
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (provide if known, otherwise auto-detected)",
                auto_fill_from_context=True,
            ),
            ToolParameter(name="name", type="Optional[str]", required=False, description="New project name"),
            ToolParameter(
                name="description",
                type="Optional[str]",
                required=False,
                description="New project description in plain text",
            ),
            ToolParameter(
                name="description_html",
                type="Optional[str]",
                required=False,
                description="New project description in HTML format (optional, auto-generated from description if not provided)",
            ),
            ToolParameter(name="project_lead", type="Optional[str]", required=False, description="New project lead user ID"),
            # NOTE: icon_prop, emoji and logo_props are auto-generated by SDK and cannot be set by users
            ToolParameter(name="cover_image", type="Optional[str]", required=False, description="Cover image URL (optional)"),
            ToolParameter(
                name="network",
                type="Optional[int]",
                required=False,
                description="Network visibility setting (0=private, 2=public) (optional)",
            ),
            ToolParameter(
                name="identifier",
                type="Optional[str]",
                required=False,
                description="New project identifier (optional, not shown in modal)",
            ),
            ToolParameter(
                name="default_assignee",
                type="Optional[str]",
                required=False,
                description="New default assignee user ID (optional)",
            ),
            ToolParameter(
                name="module_view",
                type="Optional[bool]",
                required=False,
                description="Enable/disable module view (optional)",
            ),
            ToolParameter(
                name="cycle_view",
                type="Optional[bool]",
                required=False,
                description="Enable/disable cycle view (optional)",
            ),
            ToolParameter(
                name="issue_views_view",
                type="Optional[bool]",
                required=False,
                description="Enable/disable issue views (optional)",
            ),
            ToolParameter(name="page_view", type="Optional[bool]", required=False, description="Enable/disable page view (optional)"),
            ToolParameter(
                name="intake_view",
                type="Optional[bool]",
                required=False,
                description="Enable/disable intake view (optional)",
            ),
            ToolParameter(
                name="is_time_tracking_enabled",
                type="Optional[bool]",
                required=False,
                description="Enable/disable time tracking, also called worklogs (optional)",
            ),
            ToolParameter(
                name="is_issue_type_enabled",
                type="Optional[bool]",
                required=False,
                description="Enable/disable issue type, also called workitem types (optional)",
            ),
            ToolParameter(
                name="archive_in",
                type="Optional[int]",
                required=False,
                description="Auto-archive issues after N days (optional)",
            ),
            ToolParameter(
                name="close_in",
                type="Optional[int]",
                required=False,
                description="Auto-close issues after N days (optional)",
            ),
            ToolParameter(name="timezone", type="Optional[str]", required=False, description="Timezone for the project (optional)"),
        ],
    ),
    "delete": ToolMetadata(
        name="projects_delete",
        description="Delete a project (soft delete)",
        sdk_method="delete_project",
        parameters=[
            ToolParameter(name="project_id", type="str", required=True, description="Project ID (required)"),
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (provide if known, otherwise auto-detected)",
                auto_fill_from_context=True,
            ),
        ],
    ),
    "get_features": ToolMetadata(
        name="projects_get_features",
        description="Get enabled project features (epics, cycles, modules, etc.)",
        sdk_method="get_project_features",
        parameters=[
            ToolParameter(name="project_id", type="str", required=True, description="Project ID (required)"),
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (provide if known, otherwise auto-detected)",
                auto_fill_from_context=True,
            ),
        ],
    ),
    "update_features": ToolMetadata(
        name="projects_update_features",
        description="Enable or disable project features",
        sdk_method="update_project_features",
        parameters=[
            ToolParameter(name="project_id", type="str", required=True, description="Project ID (required)"),
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (provide if known, otherwise auto-detected)",
                auto_fill_from_context=True,
            ),
            ToolParameter(name="epics", type="Optional[bool]", required=False, description="Enable/disable epics feature (optional)"),
            ToolParameter(
                name="modules",
                type="Optional[bool]",
                required=False,
                description="Enable/disable modules feature (optional)",
            ),
            ToolParameter(
                name="cycles",
                type="Optional[bool]",
                required=False,
                description="Enable/disable cycles feature (optional)",
            ),
            ToolParameter(name="views", type="Optional[bool]", required=False, description="Enable/disable views feature (optional)"),
            ToolParameter(name="pages", type="Optional[bool]", required=False, description="Enable/disable pages feature (optional)"),
            ToolParameter(
                name="intakes",
                type="Optional[bool]",
                required=False,
                description="Enable/disable intakes feature (optional)",
            ),
            ToolParameter(
                name="work_item_types",
                type="Optional[bool]",
                required=False,
                description="Enable/disable work item types feature (optional)",
            ),
        ],
    ),
}


# ============================================================================
# TOOL FACTORY
# ============================================================================


def get_project_tools(method_executor, context):
    """Return LangChain tools for the projects category using auto-generation from metadata."""

    project_tools = generate_tools_for_category(
        category="projects",
        method_executor=method_executor,
        context=context,
        tool_definitions=PROJECT_TOOL_DEFINITIONS,
    )

    return project_tools


# ============================================================================
# OLD MANUAL TOOL DEFINITIONS (COMMENTED OUT - KEPT FOR COMPARISON)
# To rollback: uncomment below and comment out the auto-generation code above
# ============================================================================

# import re
# from pi import logger
# from pi.core.db import PlaneDBPool
# from langchain_core.tools import tool
# from .base import PlaneToolBase
#
# log = logger.getChild(__name__)
#
# def get_project_tools(method_executor, context):
#     """Return LangChain tools for the projects category using method_executor and context."""
#
#     [ORIGINAL 525 LINES OF MANUAL @tool DEFINITIONS OMITTED FOR BREVITY]
#     [See git history for full original implementation]
#
#     return [
#         projects_create,
#         projects_list,
#         projects_retrieve,
#         projects_update,
#         projects_delete,
#         projects_get_features,
#         projects_update_features,
#     ]
