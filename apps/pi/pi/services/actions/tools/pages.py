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
Pages category - Auto-generated tools from metadata.

This module uses the centralized tool generation system.
Old manual definitions kept below for comparison/rollback safety.
"""

from typing import Any
from typing import Dict

from pi.services.actions.tool_generator import generate_tools_for_category
from pi.services.actions.tool_metadata import ToolMetadata
from pi.services.actions.tool_metadata import ToolParameter

# ============================================================================
# PAGES-SPECIFIC HANDLER FUNCTIONS
# ============================================================================


async def _pages_pre_handler(
    metadata: ToolMetadata,
    kwargs: Dict[str, Any],
    context: Dict[str, Any],
    category: str,
    method_key: str,
    method_executor: Any = None,
) -> Dict[str, Any]:
    """Pre-processing handler for pages tools.

    Handles:
    - Default description_html to name if not provided (API requires this field)
    """
    # Default description_html to name if not provided
    if "description_html" in [p.name for p in metadata.parameters]:
        if not kwargs.get("description_html"):
            kwargs["description_html"] = kwargs.get("name", "")

    return kwargs


async def _pages_post_handler(
    metadata: ToolMetadata,
    result: Dict[str, Any],
    kwargs: Dict[str, Any],
    context: Dict[str, Any],
    method_executor: Any,
    category: str,
    method_key: str,
) -> Dict[str, Any]:
    """Post-processing handler for pages tools.

    Handles:
    - Inject project field into response data for URL construction
      (API response doesn't include project field, but URL builder needs it)
    """
    if result["success"] and "project_id" in kwargs and kwargs.get("project_id"):
        data = result.get("data", {})
        # Using "project" not "project_id" because extract_entity_from_api_response looks for "project"
        data["project"] = kwargs["project_id"]
        result["data"] = data

    return result


# ============================================================================
# PAGES TOOL DEFINITIONS
# ============================================================================

PAGE_TOOL_DEFINITIONS: Dict[str, ToolMetadata] = {
    "create_project_page": ToolMetadata(
        name="pages_create_project_page",
        description="Create a new page in a project",
        sdk_method="create_project_page",
        returns_entity_type="page",
        pre_handler=_pages_pre_handler,
        post_handler=_pages_post_handler,
        parameters=[
            ToolParameter(
                name="name",
                type="str",
                required=True,
                description="Page title (required)",
            ),
            ToolParameter(
                name="project_id",
                type="Optional[str]",
                required=False,
                description="Project ID (required - provide from conversation context or previous actions)",
                auto_fill_from_context=True,
            ),
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (provide if known, otherwise auto-detected)",
                auto_fill_from_context=True,
            ),
            ToolParameter(
                name="description_html",
                type="Optional[str]",
                required=False,
                description="Page content in HTML format. If the user asks for 'details about X', "
                "generate relevant content. Use empty string if no content is needed. (optional, defaults to page name)",
            ),
            ToolParameter(
                name="access",
                type="Optional[int]",
                required=False,
                description="Access level - 0 for public, 1 for private (optional, if not specified the API will use its default)",
            ),
            ToolParameter(
                name="color",
                type="Optional[str]",
                required=False,
                description="Page color in hex format like #3B82F6 (optional)",
            ),
            ToolParameter(
                name="logo_props",
                type="Optional[dict]",
                required=False,
                description="Logo properties dict with keys like name, color, type (optional)",
            ),
        ],
    ),
    "create_workspace_page": ToolMetadata(
        name="pages_create_workspace_page",
        description="Create a new page in the workspace",
        sdk_method="create_workspace_page",
        returns_entity_type="page",
        pre_handler=_pages_pre_handler,
        parameters=[
            ToolParameter(
                name="name",
                type="str",
                required=True,
                description="Page title (required)",
            ),
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (provide if known, otherwise auto-detected)",
                auto_fill_from_context=True,
            ),
            ToolParameter(
                name="description_html",
                type="Optional[str]",
                required=False,
                description="Page content in HTML format. If the user asks for 'details about X', "
                "generate relevant content. Use empty string if no content is needed. (optional, defaults to page name)",
            ),
            ToolParameter(
                name="access",
                type="Optional[int]",
                required=False,
                description="Access level - 0 for public, 1 for private (optional)",
            ),
            ToolParameter(
                name="color",
                type="Optional[str]",
                required=False,
                description="Page color in hex format like #10B981 (optional)",
            ),
            ToolParameter(
                name="logo_props",
                type="Optional[dict]",
                required=False,
                description="Logo properties dict with keys like name, color, type (optional)",
            ),
        ],
    ),
}


# ============================================================================
# TOOL FACTORY
# ============================================================================


def get_page_tools(method_executor, context):
    """Return LangChain tools for the pages category using auto-generation from metadata.

    Context-aware tool selection:
    - In project chat: only project pages (workspace pages are not accessible in project UI)
    - In workspace/global chat: unified meta-tool that routes based on project_id
    """
    from typing import Optional

    from langchain_core.tools import tool

    from .base import PlaneToolBase

    is_project_chat = context.get("is_project_chat", False)

    if is_project_chat:
        # Return only project page tool
        tools = generate_tools_for_category(
            category="pages",
            method_executor=method_executor,
            context=context,
            tool_definitions={"create_project_page": PAGE_TOOL_DEFINITIONS["create_project_page"]},
        )
    else:
        # In workspace/global context, create a meta-tool that routes to the correct SDK method
        @tool
        async def pages_create_page(
            name: str,
            project_id: str,
            description_html: Optional[str] = None,
            access: Optional[int] = None,
            color: Optional[str] = None,
            logo_props: Optional[dict] = None,
        ) -> Dict[str, Any]:
            """Create a new page either in a project or at the workspace level.

            Args:
                name: Page title (required)
                project_id: Project UUID where the page should be created. Use '__workspace_scope__' ONLY
                           when the user explicitly asks for a workspace-level page or wiki page. If the user
                           hasn't specified where to create the page, leave this empty to ask for clarification. (required)
                description_html: Page content in HTML format. If the user asks for 'details about X',
                                 generate relevant content. Use empty string if no content is needed.
                access: Access level - 0 for public, 1 for private (optional)
                color: Page color in hex format (optional)
                logo_props: Logo properties dict with keys like name, color, type (optional)
            """
            workspace_slug = context.get("workspace_slug")

            # CRITICAL: Provide default empty string if description_html is None
            # The Plane API requires this field even if empty
            if not description_html:
                description_html = name

            if project_id == "__workspace_scope__":
                # Create at workspace level (Wiki)
                result = await method_executor.execute(
                    "pages",
                    "create_workspace_page",
                    name=name,
                    workspace_slug=workspace_slug,
                    description_html=description_html,
                    access=access,
                    color=color,
                    logo_props=logo_props,
                )
                scope_label = "Workspace"
            else:
                # Create in a specific project (Plane project pages)
                result = await method_executor.execute(
                    "pages",
                    "create_project_page",
                    name=name,
                    project_id=project_id,
                    workspace_slug=workspace_slug,
                    description_html=description_html,
                    access=access,
                    color=color,
                    logo_props=logo_props,
                )
                scope_label = "Project"

            if result.get("success"):
                data = result.get("data", {})
                # CRITICAL: Inject project into response data for URL construction
                # The API response doesn't include project field, so we need to add it
                # Using "project" not "project_id" because extract_entity_from_api_response looks for "project"
                # for the URL builder to construct the correct project page URL
                if scope_label == "Project" and project_id != "__workspace_scope__":
                    data["project"] = project_id
                return await PlaneToolBase.format_success_payload_with_url(f"{scope_label} page '{name}' created successfully", data, "page", context)
            else:
                error_msg = result.get("error", "Unknown error occurred")
                return PlaneToolBase.format_error_payload(f"Failed to create {scope_label.lower()} page", error_msg)

        tools = [pages_create_page]  # type: ignore[list-item]

    return tools
