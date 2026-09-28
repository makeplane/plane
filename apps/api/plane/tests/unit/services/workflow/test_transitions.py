# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""§29.3 — transition service tests."""

# Third Party imports
import pytest

# Module imports
from plane.db.models import IssueWorkflowBinding
from plane.services.workflow import actors
from plane.services.workflow.errors import (
    WorkflowActorNotAuthorized,
    WorkflowBypassReasonRequired,
    WorkflowNoEffectiveWorkflow,
    WorkflowTransitionNotAllowed,
)
from plane.services.workflow.transitions import TransitionService


@pytest.mark.unit
@pytest.mark.django_db
class TestTransitionService:
    def test_same_state_update_is_noop(
        self,
        workflow_issue,
        workflow_states,
        enable_instance_flag,
    ):
        issue = TransitionService.transition(
            issue_id=workflow_issue.id,
            target_state_id=str(workflow_states["todo"].id),
            actor=None,
            actor_id=str(workflow_issue.created_by_id),
        )
        assert issue.state_id == workflow_states["todo"].id
        # No binding was created when enforcement was off — but here
        # enforcement is on, so a binding exists. The important bit is
        # that no transition was actually recorded.
        assert issue.state_id == workflow_issue.state_id

    def test_allowed_transition_succeeds(
        self,
        workflow_issue,
        workflow_states,
        workflow_state_rows,
        todo_to_done_flow,
        default_workflow,
        default_revision,
        enable_instance_flag,
    ):
        issue = TransitionService.transition(
            issue_id=workflow_issue.id,
            target_state_id=str(workflow_states["done"].id),
            actor=None,
            actor_id=str(workflow_issue.created_by_id),
        )
        assert issue.state_id == workflow_states["done"].id
        # Lazy-binding (§25 Phase 3) created the binding in the same transaction.
        assert IssueWorkflowBinding.objects.filter(issue=workflow_issue).exists()

    def test_disallowed_transition_raises(
        self,
        workflow_issue,
        workflow_states,
        workflow_state_rows,
        default_workflow,
        default_revision,
        enable_instance_flag,
    ):
        # No flow exists from Todo -> In Progress in the fixture;
        # the actor fixture only creates Todo -> Done.
        with pytest.raises(WorkflowTransitionNotAllowed):
            TransitionService.transition(
                issue_id=workflow_issue.id,
                target_state_id=str(workflow_states["in_progress"].id),
                actor=None,
                actor_id=str(workflow_issue.created_by_id),
            )

    def test_no_effective_workflow_raises(
        self,
        workflow_issue,
        workflow_states,
        enable_instance_flag,
    ):
        # Disable the project gate so the resolver returns None.
        workflow_issue.project.workflow_enabled = False
        workflow_issue.project.save()
        with pytest.raises(WorkflowNoEffectiveWorkflow):
            TransitionService.transition(
                issue_id=workflow_issue.id,
                target_state_id=str(workflow_states["done"].id),
                actor=None,
                actor_id=str(workflow_issue.created_by_id),
            )

    def test_system_bypass_requires_reason(
        self,
        workflow_issue,
        workflow_states,
        enable_instance_flag,
    ):
        with pytest.raises(WorkflowBypassReasonRequired):
            TransitionService.transition(
                issue_id=workflow_issue.id,
                target_state_id=str(workflow_states["done"].id),
                actor=None,
                actor_id=str(workflow_issue.created_by_id),
                system_bypass=True,
                bypass_reason="",
            )

    def test_system_bypass_with_reason_skips_actor_check(
        self,
        workflow_issue,
        workflow_states,
        workflow_state_rows,
        todo_to_done_flow,
        default_workflow,
        default_revision,
        enable_instance_flag,
    ):
        # Use a foreign actor id; with system_bypass the actor check
        # is skipped so the transition still succeeds.
        issue = TransitionService.transition(
            issue_id=workflow_issue.id,
            target_state_id=str(workflow_states["done"].id),
            actor=None,
            actor_id="00000000-0000-0000-0000-000000000000",
            system_bypass=True,
            bypass_reason="automation test",
        )
        assert issue.state_id == workflow_states["done"].id

    def test_workflows_disabled_passthrough(
        self,
        workflow_issue,
        workflow_states,
        settings,
    ):
        settings.ENABLE_WORKFLOWS = False
        issue = TransitionService.transition(
            issue_id=workflow_issue.id,
            target_state_id=str(workflow_states["done"].id),
            actor=None,
            actor_id=str(workflow_issue.created_by_id),
        )
        assert issue.state_id == workflow_states["done"].id


@pytest.mark.unit
@pytest.mark.django_db
class TestComputeAllowedActions:
    def test_returns_transitions_for_published_revision(
        self,
        workflow_issue,
        workflow_states,
        workflow_state_rows,
        todo_to_done_flow,
        enable_instance_flag,
    ):
        actions = TransitionService.compute_allowed_actions(issue=workflow_issue)
        assert len(actions.transitions) == 1
        assert actions.transitions[0].target_state_id == str(
            workflow_states["done"].id
        )

    def test_empty_when_workflows_off(
        self,
        workflow_issue,
        settings,
    ):
        settings.ENABLE_WORKFLOWS = False
        actions = TransitionService.compute_allowed_actions(issue=workflow_issue)
        assert actions.transitions == []

    def test_actor_authorization_reflected_in_allowed_actions(
        self,
        workflow_issue,
        workflow_states,
        workflow_state_rows,
        todo_to_done_flow,
        default_workflow,
        default_revision,
        enable_instance_flag,
        monkeypatch,
    ):
        """RD-487 / §17.3 — ``compute_allowed_actions`` must run
        ``authorize_actor`` and reflect the decision in the
        ``allowed`` flag. Without this, the UI would happily render
        a transition the service would then 403.
        """
        # Force ``authorize_actor`` to deny so we exercise the
        # ``allowed=False`` branch.
        def deny(*args, **kwargs):
            from plane.services.workflow.errors import WorkflowActorNotAuthorized
            raise WorkflowActorNotAuthorized("forced deny")

        monkeypatch.setattr(actors, "authorize_actor", deny)

        actions = TransitionService.compute_allowed_actions(
            issue=workflow_issue,
            actor_id=str(workflow_issue.created_by_id),
        )
        assert len(actions.transitions) == 1
        assert actions.transitions[0].allowed is False

        # Now unblock and verify the flag flips back to True.
        def allow(*args, **kwargs):
            return None

        monkeypatch.setattr(actors, "authorize_actor", allow)
        actions = TransitionService.compute_allowed_actions(
            issue=workflow_issue,
            actor_id=str(workflow_issue.created_by_id),
        )
        assert actions.transitions[0].allowed is True
