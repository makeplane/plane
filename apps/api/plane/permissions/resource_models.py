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
Resource Type → Model Registry

Maps permission resource type strings to their corresponding Django model classes.
Used by the permission engine and views to resolve resource types to queryable models.
"""

from functools import lru_cache
from typing import Optional


@lru_cache(maxsize=1)
def _build_resource_model_map() -> dict:
    """Single source of truth for resource type → Django model mapping."""
    from plane.db.models import (
        Workspace,
        Project,
        Issue,
        DraftIssue,
        Module,
        Cycle,
        Page,
        IssueView,
        Intake,
        Label,
        State,
        Estimate,
        IssueComment,
        IssueLink,
        WorkItemRelationDefinition,
        FileAsset,
        WorkspaceMember,
        ProjectMember,
        UserFavorite,
        Release,
    )
    from plane.ee.models import (
        Collection,
        Initiative,
        Teamspace,
        InitiativeComment,
        InitiativeLink,
        EntityUpdates,
        IssueProperty,
        Automation,
        Workflow,
        Milestone,
        Customer,
        Template,
        RecurringWorkitemTask,
        ProjectLink,
        ProjectState,
        IssueWorkLog,
        PageComment,
        TeamspaceComment,
    )

    return {
        # Workspace-level resources
        "workspace": Workspace,
        "workspace_member": WorkspaceMember,
        "wiki": Page,
        "wiki_collection": Collection,
        "workspace_workitem_view": IssueView,
        "initiative": Initiative,
        "initiative_comment": InitiativeComment,
        "initiative_link": InitiativeLink,
        "initiative_update": EntityUpdates,
        "initiative_update_comment": EntityUpdates,
        "initiative_attachment": FileAsset,
        "teamspace": Teamspace,
        "teamspace_comment": TeamspaceComment,
        "teamspace_page": Page,
        "teamspace_page_comment": PageComment,
        "teamspace_workitem_view": IssueView,
        "favorite": UserFavorite,
        "workspace_draft": DraftIssue,
        "customer": Customer,
        "epic_update": EntityUpdates,
        "epic_update_comment": EntityUpdates,
        "release": Release,
        "workspace_project_state": ProjectState,
        "workspace_worklog": IssueWorkLog,
        # Project-level resources
        "project": Project,
        "project_member": ProjectMember,
        "workitem": Issue,
        "epic": Issue,
        "epic_link": IssueLink,
        "epic_property": IssueProperty,
        "issue_property": IssueProperty,
        "module": Module,
        "cycle": Cycle,
        "cycle_update": EntityUpdates,
        "project_update": EntityUpdates,
        "project_update_comment": EntityUpdates,
        "page": Page,
        "workitem_view": IssueView,
        "intake": Intake,
        "label": Label,
        "state": State,
        "estimate": Estimate,
        "comment": IssueComment,
        "workitem_link": IssueLink,
        "workitem_relation": WorkItemRelationDefinition,
        "attachment": FileAsset,
        "project_asset": FileAsset,
        "project_automation": Automation,
        "workspace_automation": Automation,
        "workflow": Workflow,
        "milestone": Milestone,
        "recurring_workitem": RecurringWorkitemTask,
        "project_link": ProjectLink,
        # Template resources
        "workspace_workitem_template": Template,
        "workspace_page_template": Template,
        "workspace_project_template": Template,
        "project_workitem_template": Template,
        "project_page_template": Template,
    }


def get_model_for_resource(resource_type: str) -> Optional[type]:
    """Get the Django model class for a resource type string."""
    return _build_resource_model_map().get(str(resource_type))


@lru_cache(maxsize=1)
def _build_bridge_config_map() -> dict:
    """Bridge configs for resource types linked via M2M/through tables.

    These types don't have a direct FK to their parent — they link via
    a bridge (through) table. The engine uses the bridge model to resolve
    the parent ID instead of querying the resource model directly.
    """
    from plane.db.models import ProjectPage
    from plane.ee.models import TeamspacePage, TeamspaceView

    return {
        "page": {"model": ProjectPage, "lookup_field": "page_id"},
        "teamspace_page": {"model": TeamspacePage, "lookup_field": "page_id"},
        "teamspace_workitem_view": {"model": TeamspaceView, "lookup_field": "view_id"},
    }


def get_bridge_config(resource_type: str) -> Optional[dict]:
    """Get bridge table config for resource types linked via M2M/through tables."""
    return _build_bridge_config_map().get(str(resource_type))
