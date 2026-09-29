# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""RD-490 — gaps between PR #104/#106 and the §21/§23.3 spec.

Three behaviours landed in this issue:

1. ``compute_allowed_actions`` redacts ``approver_user_ids`` for
   non-eligible non-admin actors (§23.3 hidden-membership rule).
2. ``open_approval`` and ``decide`` emit a ``Work Item`` activity row
   so the UI history renders approval request / decision rows
   alongside state transitions (§21).
3. The ``approval`` block of ``compute_allowed_actions`` now exposes
   ``reject_state_name`` so the UI can label the reject destination.
"""

# Third Party imports
import pytest

# Module imports
from plane.db.models import (
    IssueActivity,
    ProjectMember,
    User,
    WorkflowApproval,
    WorkflowFlow,
    WorkflowFlowActor,
    WorkflowFlowActorType,
    WorkflowFlowType,
    WorkspaceMember,
)
from plane.services.workflow.approvals import ApprovalService
from plane.services.workflow.bindings import ensure_binding
from plane.services.workflow.resolver import EffectiveWorkflow
from plane.services.workflow.transitions import TransitionService


@pytest.fixture
def third_member(db, workspace, create_user, workflow_project):
    """A third project member used as the viewer (not an approver)."""
    import uuid

    unique = uuid.uuid4().hex[:8]
    third = User.objects.create(
        email=f"third-{unique}@plane.so",
        username=f"third-{unique}",
        first_name="Third",
        last_name="Viewer",
    )
    WorkspaceMember.objects.create(
        workspace=workspace, member=third, role=15
    )
    ProjectMember.objects.create(
        project=workflow_project, member=third, role=15, is_active=True
    )
    return third


@pytest.fixture
def second_member(db, workspace, create_user, workflow_project):
    """A second project member used as the snapshotted approver."""
    import uuid

    unique = uuid.uuid4().hex[:8]
    second = User.objects.create(
        email=f"second-{unique}@plane.so",
        username=f"second-{unique}",
        first_name="Second",
        last_name="Member",
    )
    WorkspaceMember.objects.create(
        workspace=workspace, member=second, role=20
    )
    ProjectMember.objects.create(
        project=workflow_project, member=second, role=20, is_active=True
    )
    return second


@pytest.fixture
def approval_block_flow(
    db,
    workflow_project,
    default_revision,
    workflow_state_rows,
):
    """An approval flow with explicit reject_state so the §17.3
    ``approval`` block has both target and reject destinations to
    expose.
    """
    return WorkflowFlow.objects.create(
        project=workflow_project,
        workspace=workflow_project.workspace,
        revision=default_revision,
        source_state=workflow_state_rows["todo"],
        target_state=workflow_state_rows["done"],
        reject_state=workflow_state_rows["triage"],
        flow_type=WorkflowFlowType.APPROVAL,
        is_active=True,
    )


@pytest.fixture
def approval_block_actor(
    db,
    workflow_project,
    approval_block_flow,
    second_member,
):
    """A STATIC_USERS actor pointing at ``second_member``."""
    return WorkflowFlowActor.objects.create(
        project=workflow_project,
        workspace=workflow_project.workspace,
        flow=approval_block_flow,
        actor_type=WorkflowFlowActorType.STATIC_USERS,
        config={"user_ids": [str(second_member.id)]},
        sequence=1,
    )


@pytest.fixture
def open_approval(
    workflow_issue,
    workflow_states,
    workflow_project,
    default_workflow,
    default_revision,
    approval_block_flow,
    approval_block_actor,
    enable_instance_flag,
    second_member,
):
    """Open an approval on the issue and return its id + flow."""
    from plane.db.models import Issue as _Issue

    _Issue.objects.filter(pk=workflow_issue.id).update(
        state=workflow_states["todo"]
    )
    workflow_issue.refresh_from_db()

    binding = ensure_binding(issue=workflow_issue, actor_id=None)
    effective = EffectiveWorkflow(
        workflow=default_workflow,
        revision=default_revision,
        binding=binding,
        is_type_specific=False,
    )
    summary = ApprovalService.open_approval(
        effective=effective,
        issue=workflow_issue,
        flow=approval_block_flow,
        actor_id=None,
    )
    return {
        "summary": summary,
        "issue": workflow_issue,
        "flow": approval_block_flow,
        "second_member": second_member,
        "binding": binding,
        "effective": effective,
    }


@pytest.mark.unit
@pytest.mark.django_db
class TestApproverRejectionBlock:
    """§23.3 — the ``approver_user_ids`` field must be ``None`` for
    non-eligible non-admin actors; ``approver_count`` is the
    non-identifying substitute."""

    def test_non_eligible_non_admin_actor_does_not_see_approvers(
        self,
        open_approval,
        third_member,
        enable_instance_flag,
    ):
        actions = TransitionService.compute_allowed_actions(
            issue=open_approval["issue"],
            actor_id=str(third_member.id),
            is_admin=False,
        )
        payload = actions.to_dict()
        assert payload["approval"] is not None
        # The third member is a plain project viewer, not on the
        # snapshotted approver list. §23.3 requires we redact the
        # identifier list.
        assert payload["approval"]["approver_user_ids"] is None
        # ``can_decide`` must still be ``False`` so the UI hides the
        # decide controls.
        assert payload["approval"]["can_decide"] is False
        # The non-identifying count is always present so the UI badge
        # can render.
        assert payload["approval"]["approver_count"] == 1

    def test_eligible_approver_sees_approvers(
        self,
        open_approval,
        second_member,
        enable_instance_flag,
    ):
        actions = TransitionService.compute_allowed_actions(
            issue=open_approval["issue"],
            actor_id=str(second_member.id),
            is_admin=False,
        )
        payload = actions.to_dict()
        assert payload["approval"] is not None
        assert payload["approval"]["can_decide"] is True
        # The eligible approver sees their own id in the list so the
        # UI can render "you are one of N approvers".
        assert payload["approval"]["approver_user_ids"] == [str(second_member.id)]
        assert payload["approval"]["approver_count"] == 1

    def test_admin_sees_approvers_even_when_not_snapshotted(
        self,
        open_approval,
        third_member,
        enable_instance_flag,
    ):
        # ``third_member`` is a plain project viewer but the admin
        # override (``is_admin=True``) unlocks the list.
        actions = TransitionService.compute_allowed_actions(
            issue=open_approval["issue"],
            actor_id=str(third_member.id),
            is_admin=True,
        )
        payload = actions.to_dict()
        assert payload["approval"] is not None
        assert payload["approval"]["can_decide"] is False
        assert payload["approval"]["approver_user_ids"] == [
            str(open_approval["second_member"].id)
        ]


@pytest.mark.unit
@pytest.mark.django_db
class TestRejectStateNameBlock:
    """The approval payload exposes ``reject_state_name`` so the UI
    can label the reject destination without re-resolving the
    target_state -> reject_state -> state chain itself."""

    def test_block_includes_reject_state_name(
        self,
        open_approval,
        second_member,
        enable_instance_flag,
    ):
        actions = TransitionService.compute_allowed_actions(
            issue=open_approval["issue"],
            actor_id=str(second_member.id),
        )
        payload = actions.to_dict()
        assert payload["approval"] is not None
        assert payload["approval"]["reject_state_id"] == str(
            open_approval["flow"].reject_state.state_id
        )
        # The reject state is wired to ``workflow_state_rows['triage']``
        # which is named in ``workflow_states`` as "Triage".
        assert payload["approval"]["reject_state_name"] == "Triage"
        # The target state is also surfaced so the UI can show both
        # possible destinations.
        assert payload["approval"]["target_state_name"] == "Done"


@pytest.mark.unit
@pytest.mark.django_db
class TestApprovalActivityEmission:
    """§21 — every approval event produces a Work Item activity row."""

    def test_open_approval_emits_issue_activity(
        self,
        workflow_issue,
        workflow_states,
        workflow_project,
        default_workflow,
        default_revision,
        approval_block_flow,
        approval_block_actor,
        enable_instance_flag,
    ):
        from plane.db.models import Issue as _Issue

        _Issue.objects.filter(pk=workflow_issue.id).update(
            state=workflow_states["todo"]
        )
        workflow_issue.refresh_from_db()

        binding = ensure_binding(issue=workflow_issue, actor_id=None)
        effective = EffectiveWorkflow(
            workflow=default_workflow,
            revision=default_revision,
            binding=binding,
            is_type_specific=False,
        )

        ApprovalService.open_approval(
            effective=effective,
            issue=workflow_issue,
            flow=approval_block_flow,
            actor_id=None,
        )

        row = (
            IssueActivity.objects.filter(
                issue=workflow_issue,
                verb="approval_requested",
                field="approval",
            )
            .order_by("-created_at")
            .first()
        )
        assert row is not None
        # The verb maps to the spec (§21) and the user-facing comment
        # is the canonical phrase used by the FE history renderer.
        assert "requested approval on" in row.comment

    def test_approve_emits_issue_activity(
        self,
        open_approval,
        second_member,
        enable_instance_flag,
    ):
        ApprovalService.decide(
            approval_id=open_approval["summary"].approval_id,
            actor_id=str(second_member.id),
            decision="approve",
        )
        # The state has moved to Done and an activity row was emitted
        # for both the transition and the approval.
        row = (
            IssueActivity.objects.filter(
                issue=open_approval["issue"],
                verb="approval_approved",
                field="approval",
            )
            .order_by("-created_at")
            .first()
        )
        assert row is not None
        assert "approved and moved to" in row.comment
        assert str(row.new_identifier) == str(
            open_approval["flow"].target_state.state_id
        )

    def test_reject_emits_issue_activity_with_comment(
        self,
        open_approval,
        second_member,
        enable_instance_flag,
    ):
        flow = open_approval["flow"]
        # The activity row's new_identifier points at the *State*
        # the issue moved to (not the WorkflowState PK).
        ApprovalService.decide(
            approval_id=open_approval["summary"].approval_id,
            actor_id=str(second_member.id),
            decision="reject",
            comment="needs more detail",
        )
        row = (
            IssueActivity.objects.filter(
                issue=open_approval["issue"],
                verb="approval_rejected",
                field="approval",
            )
            .order_by("-created_at")
            .first()
        )
        assert row is not None
        assert "rejected and moved to" in row.comment
        # The decision comment is appended verbatim so the activity
        # row carries the human note alongside the verb phrase.
        assert "needs more detail" in row.comment
        assert str(row.new_identifier) == str(flow.reject_state.state_id)


@pytest.mark.unit
@pytest.mark.django_db
class TestApprovalListEndpointHelper:
    """§21 — the service exposes a list helper for the per-issue
    approval-history endpoint."""

    def test_list_approvals_for_issue_returns_all_rows(
        self,
        workflow_issue,
        workflow_states,
        workflow_project,
        default_workflow,
        default_revision,
        approval_block_flow,
        approval_block_actor,
        second_member,
        enable_instance_flag,
    ):
        from plane.db.models import Issue as _Issue

        _Issue.objects.filter(pk=workflow_issue.id).update(
            state=workflow_states["todo"]
        )
        workflow_issue.refresh_from_db()

        binding = ensure_binding(issue=workflow_issue, actor_id=None)
        effective = EffectiveWorkflow(
            workflow=default_workflow,
            revision=default_revision,
            binding=binding,
            is_type_specific=False,
        )
        ApprovalService.open_approval(
            effective=effective,
            issue=workflow_issue,
            flow=approval_block_flow,
            actor_id=None,
        )

        rows = ApprovalService.list_approvals_for_issue(issue_id=workflow_issue.id)
        assert len(rows) == 1
        # Newest-first ordering is the spec contract so the FE history
        # renderer can stream the list without sorting.
        assert rows[0].status == "pending"
        # The flow + reject state are preloaded so the endpoint can
        # render ``reject_state_name`` without N+1 lookups.
        assert rows[0].flow.reject_state_id is not None
