# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Approval step resolution and Issue state progression."""

from django.utils import timezone

from plane.db.models import (
    ApprovalAction,
    ApprovalFlowStep,
    Issue,
    OrgUnitMember,
    State,
    User,
)
from plane.research.utils.acl import org_unit_scope_ids

MANAGING_ROLES = ("OWNER", "PI", "UNIT_ADMIN", "ADVISOR", "REVIEWER")


def flow_steps(flow):
    return list(
        ApprovalFlowStep.objects.filter(flow=flow, is_required=True).order_by("order")
    )


def step_approver_ids(request, step):
    """Users who may act on a step (explicit user or organisation role)."""
    if step.approver_user_id:
        return {step.approver_user_id}
    if not step.approver_org_role:
        return set()

    scope = org_unit_scope_ids(request.org_unit_id, request.flow.workspace_id)
    if not scope:
        return set()
    today = timezone.localdate()
    memberships = OrgUnitMember.objects.filter(
        workspace_id=request.flow.workspace_id,
        org_unit_id__in=scope,
        org_role=step.approver_org_role,
        deleted_at__isnull=True,
        effective_from__lte=today,
    )
    return set(memberships.values_list("user_id", flat=True))


def current_step(request):
    for step in flow_steps(request.flow):
        if step.order == request.current_step_order:
            return step
    return None


def can_act_on_current_step(request, actor):
    step = current_step(request)
    if step is None:
        return False, None
    return actor.id in step_approver_ids(request, step), step


def step_is_satisfied(request, step):
    """``ANY`` needs one approval, ``ALL`` needs every resolved approver."""
    approved = set(
        ApprovalAction.objects.filter(
            request=request,
            step=step,
            action=ApprovalAction.Action.APPROVE,
        ).values_list("actor_id", flat=True)
    )
    required = step_approver_ids(request, step)
    if not required:
        # nobody resolvable (e.g. the role is empty): the step does not block
        return bool(approved)
    if step.approver_mode == ApprovalFlowStep.ApproverMode.ALL:
        return required.issubset(approved)
    return bool(approved & required)


def next_step_order(request):
    for step in flow_steps(request.flow):
        if step.order > request.current_step_order:
            return step.order
    return None


def move_issue_state(request, *, approved):
    """Advance the linked Issue without touching its history (P0-APR-01)."""
    issue = Issue.objects.filter(pk=request.issue_id).first()
    if issue is None:
        return None
    target_group = "completed" if approved else "backlog"
    state = (
        State.objects.filter(project_id=issue.project_id, group=target_group, deleted_at__isnull=True)
        .order_by("sequence")
        .first()
    )
    if state is None:
        return None
    issue.state = state
    issue.save(update_fields=["state", "updated_at"])
    return state


def pending_approver_users(request):
    step = current_step(request)
    if step is None:
        return []
    return list(User.objects.filter(id__in=step_approver_ids(request, step), is_active=True))
