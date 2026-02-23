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
Workspaces API tools for Plane workspace features management.
"""

from typing import Any
from typing import Dict

from pi import logger
from pi.services.actions.tool_generator import generate_tools_for_category
from pi.services.actions.tool_metadata import ToolMetadata
from pi.services.actions.tool_metadata import ToolParameter

log = logger.getChild("workspaces")

# All workspace feature fields - SDK requires all fields to be present
WORKSPACE_FEATURE_FIELDS = ["project_grouping", "initiatives", "teams", "customers", "wiki", "pi"]


async def _workspaces_pre_handler(
    metadata: ToolMetadata,
    kwargs: Dict[str, Any],
    context: Dict[str, Any],
    category: str,
    method_key: str,
    method_executor: Any = None,
) -> Dict[str, Any]:
    """Pre-processing handler for workspace tools.

    Handles:
    - update_features: Fetch current features and merge with update (SDK requires all fields)
    """
    if method_key == "update_features":
        workspace_slug = kwargs.get("workspace_slug")
        if not workspace_slug:
            log.warning("workspace_slug missing for update_features, cannot fetch current features")
            return kwargs

        if not method_executor:
            log.warning("method_executor not available, cannot fetch current features")
            return kwargs

        # Fetch current features using the existing method_executor
        try:
            result = await method_executor.execute("workspaces", "get_features", workspace_slug=workspace_slug)

            if result.get("success") and result.get("data"):
                features_data = result["data"]

                # Merge: current values as defaults, update with provided values
                for field in WORKSPACE_FEATURE_FIELDS:
                    if field not in kwargs or kwargs[field] is None:
                        kwargs[field] = features_data.get(field, False)

                log.debug(f"Merged workspace features: {kwargs}")
            else:
                log.warning(f"Could not fetch current workspace features: {result}")
        except Exception as e:
            log.error(f"Failed to fetch current workspace features: {e}")
            # Don't fail - let SDK validation fail with clear error

    return kwargs


async def _workspaces_post_handler(
    metadata: ToolMetadata,
    result: Dict[str, Any],
    kwargs: Dict[str, Any],
    context: Dict[str, Any],
    method_executor: Any,
    category: str,
    method_key: str,
) -> Dict[str, Any]:
    """Post-processing handler for workspace tools.

    Handles:
    - Inject workspace metadata into response for entity URL generation
    """
    # For workspace operations, inject workspace info into the result for URL construction
    workspace_slug = kwargs.get("workspace_slug")

    if workspace_slug and result.get("success"):
        # Get workspace_id from context - try multiple keys
        workspace_id = context.get("workspace_id") or context.get("workspace")

        # Ensure the result data has the workspace metadata for URL generation
        if "data" in result:
            if isinstance(result["data"], dict):
                # Inject workspace identifiers if missing
                if "id" not in result["data"] and workspace_id:
                    result["data"]["id"] = str(workspace_id)
                if "slug" not in result["data"]:
                    result["data"]["slug"] = workspace_slug
                if "name" not in result["data"]:
                    # Use slug as a fallback name
                    result["data"]["name"] = workspace_slug
        else:
            # Create a minimal data structure for URL generation
            result["data"] = {
                "id": str(workspace_id) if workspace_id else None,
                "slug": workspace_slug,
                "name": workspace_slug,
            }

    return result


# ============================================================================
# WORKSPACES TOOL DEFINITIONS
# ============================================================================

WORKSPACE_TOOL_DEFINITIONS: Dict[str, ToolMetadata] = {
    "get_features": ToolMetadata(
        name="workspaces_get_features",
        description="Get enabled workspace features (initiatives, teams, customers, etc.)",
        sdk_method="get_workspace_features",
        returns_entity_type="workspace",
        post_handler=_workspaces_post_handler,
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
    "update_features": ToolMetadata(
        name="workspaces_update_features",
        description="Enable or disable workspace features",
        sdk_method="update_workspace_features",
        returns_entity_type="workspace",
        pre_handler=_workspaces_pre_handler,
        post_handler=_workspaces_post_handler,
        parameters=[
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (auto-detected from context)",
                auto_fill_from_context=True,
            ),
            ToolParameter(
                name="project_grouping",
                type="Optional[bool]",
                required=False,
                description="Enable/disable project grouping feature (optional)",
            ),
            ToolParameter(
                name="initiatives",
                type="Optional[bool]",
                required=False,
                description="Enable/disable initiatives feature (optional)",
            ),
            ToolParameter(
                name="teams",
                type="Optional[bool]",
                required=False,
                description="Enable/disable teams feature (optional)",
            ),
            ToolParameter(
                name="customers",
                type="Optional[bool]",
                required=False,
                description="Enable/disable customers feature (optional)",
            ),
            ToolParameter(
                name="wiki",
                type="Optional[bool]",
                required=False,
                description="Enable/disable wiki feature (optional)",
            ),
            ToolParameter(
                name="pi",
                type="Optional[bool]",
                required=False,
                description="Enable/disable Plane AI feature (optional)",
            ),
        ],
    ),
}


# ============================================================================
# TOOL FACTORY
# ============================================================================


def get_workspace_tools(method_executor, context):
    """Return LangChain tools for the workspaces category using auto-generation from metadata."""
    return generate_tools_for_category(
        category="workspaces",
        method_executor=method_executor,
        context=context,
        tool_definitions=WORKSPACE_TOOL_DEFINITIONS,
    )
