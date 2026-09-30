# Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from dataclasses import dataclass
from typing import Optional
from uuid import UUID

from django.utils import timezone

from plane.db.models import (
    Issue,
    Project,
    ProjectMember,
    State,
    Workflow,
    WorkflowApproval,
    WorkflowApprovalStatus,
    WorkflowFlow,
    WorkflowFlowType,
    WorkflowHistory,
    WorkflowStateConfig,
)


@dataclass
class TransitionValidationResult:
    allowed: bool
    error_message: Optional[str] = None
    needs_approval: bool = False
    flow: Optional[WorkflowFlow] = None
    pending_approval: bool = False


def create_default_workflow(project: Project, user=None) -> Workflow:
    """Create a default permissive workflow for a new project."""
    workflow = Workflow.objects.create(
        project=project,
        workspace=project.workspace,
        name="Default workflow",
        is_default=True,
        is_enabled=True,
        created_by=user,
    )

    states = State.objects.filter(project=project, deleted_at__isnull=True).order_by("sequence")
    for index, state in enumerate(states):
        WorkflowStateConfig.objects.create(
            workflow=workflow,
            project=project,
            workspace=project.workspace,
            state=state,
            allow_work_item_creation=True,
            sequence=state.sequence or (index + 1) * 10000,
            created_by=user,
        )

    WorkflowHistory.objects.create(
        workflow=workflow,
        project=project,
        workspace=project.workspace,
        action="created",
        changes={"name": workflow.name, "is_default": True},
        created_by=user,
    )
    return workflow


def get_workflow_for_issue(issue: Issue) -> Optional[Workflow]:
    project = issue.project
    if not project.is_workflow_enabled:
        return None

    base_qs = Workflow.objects.filter(
        project_id=issue.project_id,
        deleted_at__isnull=True,
        is_enabled=True,
        is_paused=False,
    )

    if issue.type_id:
        type_workflow = base_qs.filter(issue_type_id=issue.type_id).first()
        if type_workflow:
            return type_workflow

    return base_qs.filter(is_default=True).first()


def get_user_project_role(project_id: UUID, user_id: UUID) -> Optional[int]:
    member = ProjectMember.objects.filter(
        project_id=project_id,
        member_id=user_id,
        is_active=True,
        deleted_at__isnull=True,
    ).first()
    return member.role if member else None


def _user_can_execute_flow(flow: WorkflowFlow, user_id: UUID, project_id: UUID) -> bool:
    if flow.allowed_members:
        return str(user_id) in [str(member_id) for member_id in flow.allowed_members]

    if flow.allowed_roles:
        role = get_user_project_role(project_id, user_id)
        return role is not None and role in flow.allowed_roles

    return True


def get_pending_approval(issue: Issue) -> Optional[WorkflowApproval]:
    return (
        WorkflowApproval.objects.filter(
            issue=issue,
            status=WorkflowApprovalStatus.PENDING,
            deleted_at__isnull=True,
        )
        .select_related("flow", "source_state", "approve_state", "reject_state")
        .first()
    )


def validate_state_transition(
    issue: Issue,
    from_state_id: Optional[UUID],
    to_state_id: UUID,
    user_id: UUID,
) -> TransitionValidationResult:
    project = issue.project

    if not project.is_workflow_enabled:
        return TransitionValidationResult(allowed=True)

    if from_state_id == to_state_id:
        return TransitionValidationResult(allowed=True)

    pending = get_pending_approval(issue)
    if pending:
        return TransitionValidationResult(
            allowed=False,
            error_message="This work item has a pending approval and cannot be moved until it is resolved.",
            pending_approval=True,
        )

    workflow = get_workflow_for_issue(issue)
    if not workflow:
        return TransitionValidationResult(allowed=True)

    if not from_state_id:
        return TransitionValidationResult(allowed=True)

    flows = list(
        WorkflowFlow.objects.filter(
            workflow=workflow,
            source_state_id=from_state_id,
            deleted_at__isnull=True,
        ).order_by("sequence")
    )

    if not flows:
        return TransitionValidationResult(allowed=True)

    matching_flows = [flow for flow in flows if flow.target_state_id == to_state_id]

    if not matching_flows:
        source_state = State.objects.filter(pk=from_state_id).first()
        target_state = State.objects.filter(pk=to_state_id).first()
        source_name = source_state.name if source_state else "current state"
        target_name = target_state.name if target_state else "selected state"
        return TransitionValidationResult(
            allowed=False,
            error_message=f"Transition from '{source_name}' to '{target_name}' is not allowed by the workflow.",
        )

    flow = matching_flows[0]

    if not _user_can_execute_flow(flow, user_id, issue.project_id):
        return TransitionValidationResult(
            allowed=False,
            error_message="You do not have permission to make this state transition.",
        )

    if flow.flow_type == WorkflowFlowType.APPROVAL:
        return TransitionValidationResult(
            allowed=False,
            needs_approval=True,
            flow=flow,
            error_message="This transition requires approval before the work item can move.",
        )

    return TransitionValidationResult(allowed=True, flow=flow)


def request_approval(issue: Issue, flow: WorkflowFlow, user_id: UUID) -> WorkflowApproval:
    return WorkflowApproval.objects.create(
        issue=issue,
        flow=flow,
        project=issue.project,
        workspace=issue.workspace,
        source_state_id=issue.state_id,
        approve_state=flow.target_state,
        reject_state=flow.reject_state,
        requested_by_id=user_id,
        status=WorkflowApprovalStatus.PENDING,
        created_by_id=user_id,
    )


def resolve_approval(approval: WorkflowApproval, user_id: UUID, approved: bool) -> Issue:
    if approval.status != WorkflowApprovalStatus.PENDING:
        raise ValueError("Approval is no longer pending.")

    flow = approval.flow
    if not _user_can_execute_flow(flow, user_id, approval.project_id):
        raise PermissionError("You do not have permission to approve or reject this transition.")

    issue = approval.issue
    approval.status = WorkflowApprovalStatus.APPROVED if approved else WorkflowApprovalStatus.REJECTED
    approval.resolved_by_id = user_id
    approval.resolved_at = timezone.now()
    approval.updated_by_id = user_id
    approval.save(update_fields=["status", "resolved_by_id", "resolved_at", "updated_at", "updated_by_id"])

    if approved:
        issue.state = approval.approve_state
    elif approval.reject_state:
        issue.state = approval.reject_state

    issue.updated_by_id = user_id
    issue.save(update_fields=["state", "updated_at", "updated_by_id"])
    return issue


def get_allowed_target_state_ids(issue: Issue, user_id: UUID) -> Optional[list[str]]:
    """Return allowed target state IDs, or None if all states are allowed."""
    project = issue.project
    if not project.is_workflow_enabled:
        return None

    if get_pending_approval(issue):
        return []

    workflow = get_workflow_for_issue(issue)
    if not workflow or not issue.state_id:
        return None

    flows = WorkflowFlow.objects.filter(
        workflow=workflow,
        source_state_id=issue.state_id,
        deleted_at__isnull=True,
    ).order_by("sequence")

    if not flows.exists():
        return None

    allowed_ids = []
    for flow in flows:
        if _user_can_execute_flow(flow, user_id, issue.project_id):
            allowed_ids.append(str(flow.target_state_id))

    return list(dict.fromkeys(allowed_ids))


def is_work_item_creation_allowed(project_id: UUID, state_id: str, issue_type_id: Optional[UUID] = None) -> bool:
    project = Project.objects.filter(pk=project_id).first()
    if not project or not project.is_workflow_enabled:
        return True

    workflow_qs = Workflow.objects.filter(
        project_id=project_id,
        deleted_at__isnull=True,
        is_enabled=True,
        is_paused=False,
    )

    workflow = None
    if issue_type_id:
        workflow = workflow_qs.filter(issue_type_id=issue_type_id).first()
    if not workflow:
        workflow = workflow_qs.filter(is_default=True).first()

    if not workflow:
        return True

    config = WorkflowStateConfig.objects.filter(
        workflow=workflow,
        state_id=state_id,
        deleted_at__isnull=True,
    ).first()

    if not config:
        return True

    return config.allow_work_item_creation


def log_workflow_change(workflow: Workflow, action: str, changes: dict, user_id: UUID) -> None:
    WorkflowHistory.objects.create(
        workflow=workflow,
        project=workflow.project,
        workspace=workflow.workspace,
        action=action,
        changes=changes,
        created_by_id=user_id,
    )
