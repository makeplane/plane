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
Centralized Tool Definitions
Single source of truth for all tool metadata across categories.

Separated from registry.py to keep the lightweight category/method registry
free of heavy tool-module imports, which avoids circular-import chains
(e.g. prompts → registry → tools → … → prompts).
"""

from typing import Dict
from typing import Optional

from pi.services.actions.tool_metadata import ToolMetadata

# Tool definitions - imported from individual tool modules for modularity
# Each tool file defines its own metadata, special handlers, and business logic
from pi.services.actions.tools.activity import ACTIVITY_TOOL_DEFINITIONS
from pi.services.actions.tools.assets import ASSET_TOOL_DEFINITIONS
from pi.services.actions.tools.comments import COMMENTS_TOOL_DEFINITIONS
from pi.services.actions.tools.customers import CUSTOMER_TOOL_DEFINITIONS
from pi.services.actions.tools.cycles import CYCLES_TOOL_DEFINITIONS
from pi.services.actions.tools.initiatives import INITIATIVE_TOOL_DEFINITIONS
from pi.services.actions.tools.intake import INTAKE_TOOL_DEFINITIONS
from pi.services.actions.tools.labels import LABEL_TOOL_DEFINITIONS
from pi.services.actions.tools.links import LINKS_TOOL_DEFINITIONS
from pi.services.actions.tools.members import MEMBER_TOOL_DEFINITIONS
from pi.services.actions.tools.modules import MODULES_TOOL_DEFINITIONS
from pi.services.actions.tools.pages import PAGE_TOOL_DEFINITIONS
from pi.services.actions.tools.projects import PROJECT_TOOL_DEFINITIONS
from pi.services.actions.tools.properties import PROPERTIES_TOOL_DEFINITIONS
from pi.services.actions.tools.states import STATE_TOOL_DEFINITIONS
from pi.services.actions.tools.stickies import STICKY_TOOL_DEFINITIONS
from pi.services.actions.tools.teamspaces import TEAMSPACE_TOOL_DEFINITIONS
from pi.services.actions.tools.types import TYPE_TOOL_DEFINITIONS
from pi.services.actions.tools.users import USER_TOOL_DEFINITIONS
from pi.services.actions.tools.workitems import WORKITEMS_TOOL_DEFINITIONS
from pi.services.actions.tools.worklogs import WORKLOGS_TOOL_DEFINITIONS
from pi.services.actions.tools.workspaces import WORKSPACE_TOOL_DEFINITIONS

TOOL_DEFINITIONS: Dict[str, Dict[str, ToolMetadata]] = {
    "activity": ACTIVITY_TOOL_DEFINITIONS,
    "assets": ASSET_TOOL_DEFINITIONS,
    "comments": COMMENTS_TOOL_DEFINITIONS,
    "customers": CUSTOMER_TOOL_DEFINITIONS,
    "cycles": CYCLES_TOOL_DEFINITIONS,
    "initiatives": INITIATIVE_TOOL_DEFINITIONS,
    "intake": INTAKE_TOOL_DEFINITIONS,
    "labels": LABEL_TOOL_DEFINITIONS,
    "links": LINKS_TOOL_DEFINITIONS,
    "members": MEMBER_TOOL_DEFINITIONS,
    "modules": MODULES_TOOL_DEFINITIONS,
    "pages": PAGE_TOOL_DEFINITIONS,
    "projects": PROJECT_TOOL_DEFINITIONS,
    "properties": PROPERTIES_TOOL_DEFINITIONS,
    "states": STATE_TOOL_DEFINITIONS,
    "stickies": STICKY_TOOL_DEFINITIONS,
    "teamspaces": TEAMSPACE_TOOL_DEFINITIONS,
    "types": TYPE_TOOL_DEFINITIONS,
    "users": USER_TOOL_DEFINITIONS,
    "workitems": WORKITEMS_TOOL_DEFINITIONS,
    "worklogs": WORKLOGS_TOOL_DEFINITIONS,
    "workspaces": WORKSPACE_TOOL_DEFINITIONS,
}


def get_tool_metadata(category: str, method: str) -> Optional[ToolMetadata]:
    """Get tool metadata for a specific category and method.

    Args:
        category: API category (e.g., "labels", "workitems")
        method: Simplified method name (e.g., "create", "list")

    Returns:
        ToolMetadata if found, None otherwise
    """
    return TOOL_DEFINITIONS.get(category, {}).get(method)


def get_all_tool_metadata() -> Dict[str, Dict[str, ToolMetadata]]:
    """Get all tool metadata across all categories."""
    return TOOL_DEFINITIONS.copy()
