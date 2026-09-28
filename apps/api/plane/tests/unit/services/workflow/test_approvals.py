# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""§29.4 — workflow approval lifecycle tests.

Covers:

- §11.1 — opening an approval on entering the approval state; failure
  when the resolver returns an empty set (§12.8).
- §11.2 / §11.3 — approve and reject paths, including target /
  reject state move, approver snapshot, audit row.
- §11.4 — row locking under concurrent decide attempts.
- §11.5 — idempotent retries collapse into a single outcome row.
- §12 — empty-result behaviour is a hard failure, not a silent
  auto-approve.
"""

# Third Party imports
import pytest

# Module imports
from plane.db.models import (
    Issue,
    ProjectMember,
    WorkflowApproval,
    WorkflowApprovalApprover,
    WorkflowApprovalDecision,
    WorkflowApprovalStatus,
    WorkflowFlow,
    WorkflowFlowActor,
    WorkflowFlowActorType,
    WorkflowFlowType,
)
from plane.services.workflow.approvals import ApprovalService
from plane.services.workflow.errors import (
    WorkflowActorNotAuthorized,
    WorkflowApprovalAlreadyResolved,
    WorkflowApproverNotResolved,
)
from plane.services.workflow.transitions import TransitionService


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def second_member(db, workspace, create_user, workflow_project):
    """A second project member used as the snapshotted approver."""
    from plane.db.models import User, WorkspaceMember

    second = User.objects.create(
        email="second@plane.so", first_name="Second", last_name="Member"
    )
    WorkspaceMember.objects.create(
        workspace=workspace, member=second, role=20
    )
    ProjectMember.objects.create(
        project=workflow_project, member=second, role=20, is_active=True
    )
    return second


@pytest.fixture
def approval_flow(
    db,
    workflow_project,
    default_revision,
    workflow_state_rows,
    create_user,
):
    """An approval flow Todo → Done with a STATIC_USERS approver.

    The ``second_member`` fixture (added by the test) configures the
    approver list. Returns the created flow so the test can wire the
    actor config.
    """
    flow = WorkflowFlow.objects.create(
        project=workflow_project,
        revision=default_revision,
        source_state=workflow_state_rows["todo"],
        target_state=workflow_state_rows["done"],
        reject_state=workflow_state_rows["triage"],
        flow_type=WorkflowFlowType.APPROVAL,
        is_active=True,
    )
    return flow


@pytest.fixture
def approval_actor(
    db,
    workflow_project,
    approval_flow,
    second_member,
):
    """A STATIC_USERS actor pointing at ``second_member``."""
    actor = WorkflowFlowActor.objects.create(
        project=workflow_project,
        flow=approval_flow,
        actor_type=WorkflowFlowActorType.STATIC_USERS,
        config={"user_ids": [str(second_member.id)]},
        sequence=1,
    )
    return actor


@pytest.fixture
def empty_approval_flow(
    db,
    workflow_project,
    default_revision,
    workflow_state_rows,
):
    """An approval flow whose actor set resolves empty (§12.8)."""
    return WorkflowFlow.objects.create(
        project=workflow_project,
        revision=default_revision,
        source_state=workflow_state_rows["todo"],
        target_state=workflow_state_rows["in_progress"],
        reject_state=workflow_state_rows["triage"],
        flow_type=WorkflowFlowType.APPROVAL,
        is_active=True,
    )


@pytest.fixture
def requester_actor(
    db,
    workflow_project,
    empty_approval_flow,
    create_user,
):
    """REQUESTER_MANAGER actor — no manager org-data exists in this fork."""
    return WorkflowFlowActor.objects.create(
        project=workflow_project,
        flow=empty_approval_flow,
        actor_type=WorkflowFlowActorType.REQUESTER_MANAGER,
        config={},
        sequence=1,
    )


# ---------------------------------------------------------------------------
# §11.1 — Open
# ---------------------------------------------------------------------------


@pytest.mark.unit
@pytest.mark.django_db
class TestApprovalOpen:
    def test_open_approval_snapshots_approver(
        self,
        workflow_issue,
        workflow_states,
        workflow_state_rows,
        workflow_project,
        default_workflow,
        default_revision,
        approval_flow,
        approval_actor,
        enable_instance_flag,
        second_member,
    ):
        # First make sure the issue is in the source state of the
        # approval flow. The transition service raises if the
        # destination requires a flow that does not exist; we manually
        # move the issue here.
        Issue.objects.filter(pk=workflow_issue.id).update(
            state=workflow_states["todo"]
        )
        workflow_issue.refresh_from_db()

        effective = TransitionService.compute_allowed_actions(
            issue=workflow_issue,
            actor_id=str(second_member.id),
        )
        assert effective.workflow_id == default_workflow.id

        from plane.services.workflow.bindings import ensure_binding
        from plane.services.workflow.resolver import EffectiveWorkflow

        binding = ensure_binding(issue=workflow_issue, actor_id=None)
        effective_wf = EffectiveWorkflow(
            workflow=default_workflow,
            revision=default_revision,
            binding=binding,
            is_type_specific=False,
        )

        summary = ApprovalService.open_approval(
            effective=effective_wf,
            issue=workflow_issue,
            flow=approval_flow,
            actor_id=None,
        )

        assert summary.approval_id
        approver_rows = WorkflowApprovalApprover.objects.filter(
            approval_id=summary.approval_id,
            deleted_at__isnull=True,
        )
        assert approver_rows.count() == 1
        assert str(approver_rows.first().user_id) == str(second_member.id)

    def test_open_approval_empty_resolver_raises(
        self,
        workflow_issue,
        workflow_states,
        workflow_state_rows,
        workflow_project,
        default_workflow,
        default_revision,
        empty_approval_flow,
        requester_actor,
        enable_instance_flag,
    ):
        """§12.8 — empty resolver result must NOT auto-approve."""
        Issue.objects.filter(pk=workflow_issue.id).update(
            state=workflow_states["todo"]
        )
        workflow_issue.refresh_from_db()

        from plane.services.workflow.bindings import ensure_binding
        from plane.services.workflow.resolver import EffectiveWorkflow

        binding = ensure_binding(issue=workflow_issue, actor_id=None)
        effective_wf = EffectiveWorkflow(
            workflow=default_workflow,
            revision=default_revision,
            binding=binding,
            is_type_specific=False,
        )

        with pytest.raises(WorkflowApproverNotResolved):
            ApprovalService.open_approval(
                effective=effective_wf,
                issue=workflow_issue,
                flow=empty_approval_flow,
                actor_id=None,
            )
        # And no approval row was persisted.
        assert (
            WorkflowApproval.objects.filter(issue=workflow_issue).count() == 0
        )

    def test_open_approval_idempotent_for_existing_pending(
        self,
        workflow_issue,
        workflow_states,
        workflow_state_rows,
        workflow_project,
        default_workflow,
        default_revision,
        approval_flow,
        approval_actor,
        enable_instance_flag,
        second_member,
    ):
        """§11.5 — opening twice for the same pending approval returns the original."""
        Issue.objects.filter(pk=workflow_issue.id).update(
            state=workflow_states["todo"]
        )
        workflow_issue.refresh_from_db()

        from plane.services.workflow.bindings import ensure_binding
        from plane.services.workflow.resolver import EffectiveWorkflow

        binding = ensure_binding(issue=workflow_issue, actor_id=None)
        effective_wf = EffectiveWorkflow(
            workflow=default_workflow,
            revision=default_revision,
            binding=binding,
            is_type_specific=False,
        )

        first = ApprovalService.open_approval(
            effective=effective_wf,
            issue=workflow_issue,
            flow=approval_flow,
            actor_id=None,
        )
        second = ApprovalService.open_approval(
            effective=effective_wf,
            issue=workflow_issue,
            flow=approval_flow,
            actor_id=None,
        )
        assert first.approval_id == second.approval_id
        # The partial-unique constraint enforces a single pending row.
        assert (
            WorkflowApproval.objects.filter(
                issue=workflow_issue, status=WorkflowApprovalStatus.PENDING
            ).count()
            == 1
        )


# ---------------------------------------------------------------------------
# §11.2 / §11.3 — Decide
# ---------------------------------------------------------------------------


@pytest.mark.unit
@pytest.mark.django_db
class TestApprovalDecide:
    def test_approve_moves_state_and_records_decision(
        self,
        workflow_issue,
        workflow_states,
        workflow_state_rows,
        workflow_project,
        default_workflow,
        default_revision,
        approval_flow,
        approval_actor,
        enable_instance_flag,
        second_member,
    ):
        Issue.objects.filter(pk=workflow_issue.id).update(
            state=workflow_states["todo"]
        )
        workflow_issue.refresh_from_db()

        from plane.services.workflow.bindings import ensure_binding
        from plane.services.workflow.resolver import EffectiveWorkflow

        binding = ensure_binding(issue=workflow_issue, actor_id=None)
        effective_wf = EffectiveWorkflow(
            workflow=default_workflow,
            revision=default_revision,
            binding=binding,
            is_type_specific=False,
        )
        summary = ApprovalService.open_approval(
            effective=effective_wf,
            issue=workflow_issue,
            flow=approval_flow,
            actor_id=None,
        )

        result = ApprovalService.decide(
            approval_id=summary.approval_id,
            actor_id=str(second_member.id),
            decision="approve",
            comment="LGTM",
        )

        assert result.decision == "approve"
        workflow_issue.refresh_from_db()
        assert str(workflow_issue.state_id) == str(workflow_states["done"].id)

        approval = WorkflowApproval.objects.get(pk=summary.approval_id)
        assert approval.status == WorkflowApprovalStatus.APPROVED
        assert str(approval.resolved_by_id) == str(second_member.id)

        decision_rows = WorkflowApprovalDecision.objects.filter(approval=approval)
        assert decision_rows.count() == 1
        assert decision_rows.first().decision == "approve"

    def test_reject_moves_to_reject_state(
        self,
        workflow_issue,
        workflow_states,
        workflow_state_rows,
        workflow_project,
        default_workflow,
        default_revision,
        approval_flow,
        approval_actor,
        enable_instance_flag,
        second_member,
    ):
        Issue.objects.filter(pk=workflow_issue.id).update(
            state=workflow_states["todo"]
        )
        workflow_issue.refresh_from_db()

        from plane.services.workflow.bindings import ensure_binding
        from plane.services.workflow.resolver import EffectiveWorkflow

        binding = ensure_binding(issue=workflow_issue, actor_id=None)
        effective_wf = EffectiveWorkflow(
            workflow=default_workflow,
            revision=default_revision,
            binding=binding,
            is_type_specific=False,
        )
        summary = ApprovalService.open_approval(
            effective=effective_wf,
            issue=workflow_issue,
            flow=approval_flow,
            actor_id=None,
        )

        result = ApprovalService.decide(
            approval_id=summary.approval_id,
            actor_id=str(second_member.id),
            decision="reject",
            comment="Needs more detail",
        )
        assert result.decision == "reject"
        workflow_issue.refresh_from_db()
        assert str(workflow_issue.state_id) == str(workflow_states["triage"].id)

    def test_non_approver_gets_authorization_error(
        self,
        workflow_issue,
        workflow_states,
        workflow_state_rows,
        workflow_project,
        default_workflow,
        default_revision,
        approval_flow,
        approval_actor,
        enable_instance_flag,
        second_member,
        create_user,
    ):
        Issue.objects.filter(pk=workflow_issue.id).update(
            state=workflow_states["todo"]
        )
        workflow_issue.refresh_from_db()

        from plane.services.workflow.bindings import ensure_binding
        from plane.services.workflow.resolver import EffectiveWorkflow

        binding = ensure_binding(issue=workflow_issue, actor_id=None)
        effective_wf = EffectiveWorkflow(
            workflow=default_workflow,
            revision=default_revision,
            binding=binding,
            is_type_specific=False,
        )
        summary = ApprovalService.open_approval(
            effective=effective_wf,
            issue=workflow_issue,
            flow=approval_flow,
            actor_id=None,
        )
        # ``create_user`` is the requester / workspace owner; NOT on
        # the snapshotted approver list.
        with pytest.raises(WorkflowActorNotAuthorized):
            ApprovalService.decide(
                approval_id=summary.approval_id,
                actor_id=str(create_user.id),
                decision="approve",
            )

    def test_double_decide_returns_already_resolved(
        self,
        workflow_issue,
        workflow_states,
        workflow_state_rows,
        workflow_project,
        default_workflow,
        default_revision,
        approval_flow,
        approval_actor,
        enable_instance_flag,
        second_member,
    ):
        """§11.4 — second concurrent decision gets 409 semantics."""
        Issue.objects.filter(pk=workflow_issue.id).update(
            state=workflow_states["todo"]
        )
        workflow_issue.refresh_from_db()

        from plane.services.workflow.bindings import ensure_binding
        from plane.services.workflow.resolver import EffectiveWorkflow

        binding = ensure_binding(issue=workflow_issue, actor_id=None)
        effective_wf = EffectiveWorkflow(
            workflow=default_workflow,
            revision=default_revision,
            binding=binding,
            is_type_specific=False,
        )
        summary = ApprovalService.open_approval(
            effective=effective_wf,
            issue=workflow_issue,
            flow=approval_flow,
            actor_id=None,
        )
        ApprovalService.decide(
            approval_id=summary.approval_id,
            actor_id=str(second_member.id),
            decision="approve",
        )
        with pytest.raises(WorkflowApprovalAlreadyResolved):
            ApprovalService.decide(
                approval_id=summary.approval_id,
                actor_id=str(second_member.id),
                decision="reject",
            )

    def test_idempotent_replay_returns_original_outcome(
        self,
        workflow_issue,
        workflow_states,
        workflow_state_rows,
        workflow_project,
        default_workflow,
        default_revision,
        approval_flow,
        approval_actor,
        enable_instance_flag,
        second_member,
    ):
        """§11.5 — replaying a decision with the same idempotency key returns the original outcome."""
        Issue.objects.filter(pk=workflow_issue.id).update(
            state=workflow_states["todo"]
        )
        workflow_issue.refresh_from_db()

        from plane.services.workflow.bindings import ensure_binding
        from plane.services.workflow.resolver import EffectiveWorkflow

        binding = ensure_binding(issue=workflow_issue, actor_id=None)
        effective_wf = EffectiveWorkflow(
            workflow=default_workflow,
            revision=default_revision,
            binding=binding,
            is_type_specific=False,
        )
        summary = ApprovalService.open_approval(
            effective=effective_wf,
            issue=workflow_issue,
            flow=approval_flow,
            actor_id=None,
        )

        first = ApprovalService.decide(
            approval_id=summary.approval_id,
            actor_id=str(second_member.id),
            decision="approve",
            idempotency_key="key-1",
        )
        second = ApprovalService.decide(
            approval_id=summary.approval_id,
            actor_id=str(second_member.id),
            decision="approve",
            idempotency_key="key-1",
        )
        assert first.decision_id == second.decision_id
        # Only one decision row in the audit table.
        assert (
            WorkflowApprovalDecision.objects.filter(
                approval_id=summary.approval_id, idempotency_key="key-1"
            ).count()
            == 1
        )

    def test_concurrent_decide_only_one_wins(
        self,
        workflow_issue,
        workflow_states,
        workflow_state_rows,
        workflow_project,
        default_workflow,
        default_revision,
        approval_flow,
        approval_actor,
        enable_instance_flag,
        second_member,
        db,
    ):
        """§11.4 — serialised simulation: the second decision hits a 409 path."""
        Issue.objects.filter(pk=workflow_issue.id).update(
            state=workflow_states["todo"]
        )
        workflow_issue.refresh_from_db()

        from plane.services.workflow.bindings import ensure_binding
        from plane.services.workflow.resolver import EffectiveWorkflow

        binding = ensure_binding(issue=workflow_issue, actor_id=None)
        effective_wf = EffectiveWorkflow(
            workflow=default_workflow,
            revision=default_revision,
            binding=binding,
            is_type_specific=False,
        )
        summary = ApprovalService.open_approval(
            effective=effective_wf,
            issue=workflow_issue,
            flow=approval_flow,
            actor_id=None,
        )
        # The first decide wins. The second is rejected by the row
        # status check inside the second transaction. (The DB-level
        # partial-unique constraint is the safety net for true
        # concurrency — exercising that here would require threading
        # against a live DB, which is exercised by the migration's
        # constraint test instead.)
        ApprovalService.decide(
            approval_id=summary.approval_id,
            actor_id=str(second_member.id),
            decision="approve",
        )
        with pytest.raises(WorkflowApprovalAlreadyResolved):
            ApprovalService.decide(
                approval_id=summary.approval_id,
                actor_id=str(second_member.id),
                decision="approve",
            )
        # Only one decision row.
        assert (
            WorkflowApprovalDecision.objects.filter(
                approval_id=summary.approval_id
            ).count()
            == 1
        )