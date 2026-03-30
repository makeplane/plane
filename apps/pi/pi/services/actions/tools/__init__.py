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
Modular tools package for Plane API interactions.

This package organizes Plane API tools into logical categories for better maintainability.
Each module contains tools for a specific API domain (projects, work items, cycles, etc.).
"""

from importlib import import_module
from typing import Any
from typing import Dict
from typing import List

from langchain_core.tools import BaseTool

CATEGORY_TO_PROVIDER: Dict[str, str] = {
    "activity": "pi.services.actions.tools.activity:get_activity_tools",
    "activities": "pi.services.actions.tools.activity:get_activity_tools",
    "assets": "pi.services.actions.tools.assets:get_asset_tools",
    "asset": "pi.services.actions.tools.assets:get_asset_tools",
    "attachments": "pi.services.actions.tools.attachments:get_attachment_tools",
    "attachment": "pi.services.actions.tools.attachments:get_attachment_tools",
    "comments": "pi.services.actions.tools.comments:get_comment_tools",
    "comment": "pi.services.actions.tools.comments:get_comment_tools",
    "customers": "pi.services.actions.tools.customers:get_customer_tools",
    "customer": "pi.services.actions.tools.customers:get_customer_tools",
    "cycles": "pi.services.actions.tools.cycles:get_cycle_tools",
    "cycle": "pi.services.actions.tools.cycles:get_cycle_tools",
    "intake": "pi.services.actions.tools.intake:get_intake_tools",
    "intakes": "pi.services.actions.tools.intake:get_intake_tools",
    "initiatives": "pi.services.actions.tools.initiatives:get_initiative_tools",
    "initiative": "pi.services.actions.tools.initiatives:get_initiative_tools",
    "labels": "pi.services.actions.tools.labels:get_label_tools",
    "label": "pi.services.actions.tools.labels:get_label_tools",
    "links": "pi.services.actions.tools.links:get_link_tools",
    "link": "pi.services.actions.tools.links:get_link_tools",
    "members": "pi.services.actions.tools.members:get_member_tools",
    "member": "pi.services.actions.tools.members:get_member_tools",
    "modules": "pi.services.actions.tools.modules:get_module_tools",
    "module": "pi.services.actions.tools.modules:get_module_tools",
    "pages": "pi.services.actions.tools.pages:get_page_tools",
    "page": "pi.services.actions.tools.pages:get_page_tools",
    "projects": "pi.services.actions.tools.projects:get_project_tools",
    "project": "pi.services.actions.tools.projects:get_project_tools",
    "properties": "pi.services.actions.tools.properties:get_property_tools",
    "property": "pi.services.actions.tools.properties:get_property_tools",
    "states": "pi.services.actions.tools.states:get_state_tools",
    "state": "pi.services.actions.tools.states:get_state_tools",
    "stickies": "pi.services.actions.tools.stickies:get_sticky_tools",
    "sticky": "pi.services.actions.tools.stickies:get_sticky_tools",
    "teamspaces": "pi.services.actions.tools.teamspaces:get_teamspace_tools",
    "teamspace": "pi.services.actions.tools.teamspaces:get_teamspace_tools",
    "types": "pi.services.actions.tools.types:get_type_tools",
    "type": "pi.services.actions.tools.types:get_type_tools",
    "users": "pi.services.actions.tools.users:get_user_tools",
    "user": "pi.services.actions.tools.users:get_user_tools",
    "workitems": "pi.services.actions.tools.workitems:get_workitem_tools",
    "workitem": "pi.services.actions.tools.workitems:get_workitem_tools",
    "worklogs": "pi.services.actions.tools.worklogs:get_worklog_tools",
    "worklog": "pi.services.actions.tools.worklogs:get_worklog_tools",
    "workspaces": "pi.services.actions.tools.workspaces:get_workspace_tools",
    "workspace": "pi.services.actions.tools.workspaces:get_workspace_tools",
}


def get_tools_for_category(category: str, method_executor, context: Dict[str, Any]) -> List[BaseTool]:
    """Return the LangChain tools for a category using the explicit provider mapping."""
    provider_path = CATEGORY_TO_PROVIDER.get(category)
    if not provider_path:
        return []

    module_path, provider_name = provider_path.split(":", 1)
    provider = getattr(import_module(module_path), provider_name)
    return provider(method_executor, context)


__all__ = ["get_tools_for_category"]
