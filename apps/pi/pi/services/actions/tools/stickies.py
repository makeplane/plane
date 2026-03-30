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
Stickies API tools for Plane quick notes operations.
"""

from typing import Any
from typing import Dict

from pi.services.actions.tool_generator import generate_tools_for_category
from pi.services.actions.tool_metadata import ToolMetadata
from pi.services.actions.tool_metadata import ToolParameter

# ============================================================================
# STICKIES-SPECIFIC HANDLER FUNCTIONS
# ============================================================================


async def _stickies_pre_handler(
    metadata: ToolMetadata,
    kwargs: Dict[str, Any],
    context: Dict[str, Any],
    category: str,
    method_key: str,
    method_executor: Any = None,
) -> Dict[str, Any]:
    """Pre-processing handler for stickies tools.

    Handles:
    - Auto-generate description_html from description if not provided
    """
    # If description is provided but description_html is not, auto-generate HTML version
    # The UI displays description_html, so we need to ensure it's populated
    if method_key in ["create", "update"]:
        if "description" in kwargs and kwargs["description"] is not None:
            if "description_html" not in kwargs or kwargs.get("description_html") is None:
                # Convert plain text to simple HTML paragraph
                # Escape HTML special characters and preserve line breaks
                import html

                escaped_description = html.escape(kwargs["description"])
                # Replace newlines with <br> tags
                escaped_description = escaped_description.replace("\n", "<br>")
                kwargs["description_html"] = f"<p>{escaped_description}</p>"

    return kwargs


# ============================================================================
# STICKIES TOOL DEFINITIONS
# ============================================================================

STICKY_TOOL_DEFINITIONS: Dict[str, ToolMetadata] = {
    "create": ToolMetadata(
        name="stickies_create",
        description="Create a new sticky note for quick annotations. The main content/text should go in 'description' parameter.",
        sdk_method="create_sticky",
        returns_entity_type="sticky",
        pre_handler=_stickies_pre_handler,
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
                type="Optional[str]",
                required=False,
                description="Optional title/heading for the sticky note",
            ),
            ToolParameter(
                name="description",
                type="Optional[str]",
                required=False,
                description="Main content/text of the sticky note (use this for user's content)",
            ),
            ToolParameter(
                name="description_html",
                type="Optional[str]",
                required=False,
                description="HTML formatted content (optional, auto-generated from description if not provided)",
            ),
            ToolParameter(
                name="color",
                type="Optional[str]",
                required=False,
                description="Text color hex code (optional)",
            ),
            ToolParameter(
                name="background_color",
                type="Optional[str]",
                required=False,
                description="Background color hex code (optional)",
            ),
            ToolParameter(
                name="logo_props",
                type="Optional[dict]",
                required=False,
                description="Logo configuration JSON (optional)",
            ),
        ],
    ),
    "update": ToolMetadata(
        name="stickies_update",
        description="Update sticky note details",
        sdk_method="update_sticky",
        returns_entity_type="sticky",
        pre_handler=_stickies_pre_handler,
        parameters=[
            ToolParameter(
                name="sticky_id",
                type="str",
                required=True,
                description="Sticky ID (required)",
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
                description="New sticky note title",
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
                name="color",
                type="Optional[str]",
                required=False,
                description="New text color hex code",
            ),
            ToolParameter(
                name="background_color",
                type="Optional[str]",
                required=False,
                description="New background color hex code",
            ),
            ToolParameter(
                name="logo_props",
                type="Optional[dict]",
                required=False,
                description="New logo configuration JSON",
            ),
        ],
    ),
    "delete": ToolMetadata(
        name="stickies_delete",
        description="Delete a sticky note",
        sdk_method="delete_sticky",
        parameters=[
            ToolParameter(
                name="sticky_id",
                type="str",
                required=True,
                description="Sticky ID (required)",
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


def get_sticky_tools(method_executor, context):
    """Return LangChain tools for the stickies category using auto-generation from metadata."""
    return generate_tools_for_category(
        category="stickies",
        method_executor=method_executor,
        context=context,
        tool_definitions=STICKY_TOOL_DEFINITIONS,
    )
