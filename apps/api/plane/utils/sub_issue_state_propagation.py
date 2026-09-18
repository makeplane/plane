# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import json

from django.utils import timezone

from plane.app.permissions.base import ROLE
from plane.bgtasks.issue_activities_task import issue_activity
from plane.db.models import Issue, ProjectMember, State, WorkspaceMember


def user_can_edit_issue(user, workspace_slug, issue):
    """Check if the user can edit an issue, mirroring partial_update permissions."""
    if issue.created_by_id == user.id:
        return True

    allowed_roles = [ROLE.ADMIN.value, ROLE.MEMBER.value]
    if ProjectMember.objects.filter(
        member=user,
        workspace__slug=workspace_slug,
        project_id=issue.project_id,
        role__in=allowed_roles,
        is_active=True,
    ).exists():
        return True

    return (
        ProjectMember.objects.filter(
            member=user,
            workspace__slug=workspace_slug,
            project_id=issue.project_id,
            is_active=True,
        ).exists()
        and WorkspaceMember.objects.filter(
            member=user,
            workspace__slug=workspace_slug,
            role=ROLE.ADMIN.value,
            is_active=True,
        ).exists()
    )


def resolve_target_state(new_state, target_project_id):
    """Resolve the equivalent state for a sub-issue's project."""
    if str(new_state.project_id) == str(target_project_id):
        return new_state

    # Prefer a state with the same group and name in the target project
    matching_state = State.objects.filter(
        project_id=target_project_id,
        group=new_state.group,
        name=new_state.name,
    ).first()
    if matching_state:
        return matching_state

    # Fall back to any state in the same group
    return State.objects.filter(project_id=target_project_id, group=new_state.group).order_by("sequence").first()


def propagate_state_to_sub_issues(parent, new_state, actor, workspace_slug, origin):
    """
    Propagate a state change from a parent issue to its direct sub-issues.
    Returns the list of updated sub-issue IDs.
    """
    if not new_state:
        return []

    sub_issues = Issue.issue_objects.filter(parent_id=parent.id, workspace=parent.workspace).select_related("state")
    updated_sub_issue_ids = []

    for sub_issue in sub_issues:
        if not user_can_edit_issue(actor, workspace_slug, sub_issue):
            continue

        target_state = resolve_target_state(new_state, sub_issue.project_id)
        if not target_state or sub_issue.state_id == target_state.id:
            continue

        current_instance = json.dumps({"state_id": str(sub_issue.state_id)})
        sub_issue.state = target_state
        sub_issue.updated_by = actor
        sub_issue.save()

        issue_activity.delay(
            type="issue.activity.updated",
            requested_data=json.dumps({"state_id": str(target_state.id)}),
            actor_id=str(actor.id),
            issue_id=str(sub_issue.id),
            project_id=str(sub_issue.project_id),
            current_instance=current_instance,
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=origin,
        )
        updated_sub_issue_ids.append(str(sub_issue.id))

    return updated_sub_issue_ids
