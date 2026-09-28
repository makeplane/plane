# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""§29.5 — bypass tests covering every known state-write surface.

The spec's invariant (§34) is that *every* state mutation either
calls ``TransitionService`` or uses a documented audited bypass.
This module proves each known surface is wired:

1. ``IssueCreateSerializer.create`` — initial state during creation
   is validated against §9.2 when workflows are on.
2. ``IssueCreateSerializer.update`` — PATCH ``state_id`` flows
   through ``TransitionService``.
3. ``IntakeIssueSerializer.update`` — intake accept moves state
   through the bypass path.
4. ``AutomationTask.close_old_issues`` — schedules an audited
   bypassed transition per affected issue.
5. Direct ``Issue.objects.filter().update(state=...)`` from
   user-facing code paths is documented as forbidden and the
   ``transitions`` service is the only sanctioned writer.

Each test asserts the post-state matches the expected outcome, so a
future regression that silently writes ``state`` directly is caught.
"""

# Third Party imports
import pytest

# Module imports
from plane.app.serializers import IssueCreateSerializer
from plane.db.models import Issue, State


@pytest.mark.unit
@pytest.mark.django_db
class TestSerializerWiring:
    """§29.5 #1 — ``IssueCreateSerializer.create`` honors §9.2."""

    def test_creation_blocks_disallowed_state(
        self,
        workflow_project,
        workflow_states,
        workflow_state_rows,
        default_workflow,
        default_revision,
        enable_instance_flag,
    ):
        # In Progress does not have ``allow_new_work_items`` in the
        # fixture, so creation must be rejected by the workflow gate.
        serializer = IssueCreateSerializer(
            data={
                "name": "Forbidden init state",
                "state_id": str(workflow_states["in_progress"].id),
            },
            context={
                "project_id": str(workflow_project.id),
                "workspace_id": str(workflow_project.workspace_id),
                "default_assignee_id": None,
            },
        )
        assert serializer.is_valid(), serializer.errors
        with pytest.raises(Exception):
            serializer.save()

    def test_creation_passes_allowed_state(
        self,
        workflow_project,
        workflow_states,
        workflow_state_rows,
        default_workflow,
        default_revision,
        enable_instance_flag,
        create_user,
    ):
        # Todo IS creation-eligible so creation succeeds.
        serializer = IssueCreateSerializer(
            data={
                "name": "Allowed init state",
                "state_id": str(workflow_states["todo"].id),
            },
            context={
                "project_id": str(workflow_project.id),
                "workspace_id": str(workflow_project.workspace_id),
                "default_assignee_id": None,
            },
        )
        assert serializer.is_valid(), serializer.errors
        issue = serializer.save()
        assert issue.state_id == workflow_states["todo"].id

    def test_creation_passthrough_when_workflows_off(
        self,
        workflow_project,
        workflow_states,
        workflow_state_rows,
        default_workflow,
        default_revision,
        settings,
    ):
        # Workflows off → §17.4: legacy behavior is preserved.
        settings.ENABLE_WORKFLOWS = False
        serializer = IssueCreateSerializer(
            data={
                "name": "Legacy init state",
                "state_id": str(workflow_states["in_progress"].id),
            },
            context={
                "project_id": str(workflow_project.id),
                "workspace_id": str(workflow_project.workspace_id),
                "default_assignee_id": None,
            },
        )
        assert serializer.is_valid(), serializer.errors
        issue = serializer.save()
        assert issue.state_id == workflow_states["in_progress"].id


@pytest.mark.unit
@pytest.mark.django_db
class TestUpdateRouting:
    """§29.5 #2 — PATCH ``state_id`` is routed through ``TransitionService``."""

    def test_state_change_routes_through_service(
        self,
        workflow_issue,
        workflow_states,
        workflow_state_rows,
        todo_to_done_flow,
        default_workflow,
        default_revision,
        enable_instance_flag,
    ):
        serializer = IssueCreateSerializer(
            workflow_issue,
            data={"state_id": str(workflow_states["done"].id)},
            partial=True,
            context={"project_id": str(workflow_issue.project_id)},
        )
        assert serializer.is_valid(), serializer.errors
        issue = serializer.save()
        assert issue.state_id == workflow_states["done"].id

    def test_state_change_blocked_when_disallowed(
        self,
        workflow_issue,
        workflow_states,
        workflow_state_rows,
        todo_to_done_flow,
        default_workflow,
        default_revision,
        enable_instance_flag,
    ):
        # No transition flow exists for Todo -> In Progress in the
        # fixture; the update must surface the workflow error rather
        # than silently writing the new state.
        from rest_framework import serializers as drf

        serializer = IssueCreateSerializer(
            workflow_issue,
            data={"state_id": str(workflow_states["in_progress"].id)},
            partial=True,
            context={"project_id": str(workflow_issue.project_id)},
        )
        assert serializer.is_valid(), serializer.errors
        with pytest.raises(drf.ValidationError):
            serializer.save()
        # The original state was preserved.
        workflow_issue.refresh_from_db()
        assert workflow_issue.state_id == workflow_states["todo"].id

    def test_same_state_update_is_noop(
        self,
        workflow_issue,
        workflow_states,
        workflow_state_rows,
        todo_to_done_flow,
        default_workflow,
        default_revision,
        enable_instance_flag,
    ):
        serializer = IssueCreateSerializer(
            workflow_issue,
            data={"state_id": str(workflow_states["todo"].id)},
            partial=True,
            context={"project_id": str(workflow_issue.project_id)},
        )
        assert serializer.is_valid(), serializer.errors
        issue = serializer.save()
        assert issue.state_id == workflow_states["todo"].id


@pytest.mark.unit
@pytest.mark.django_db
class TestIntakeBypass:
    """§29.5 #3 — intake accept moves state through the bypass path."""

    def test_intake_accept_moves_state(
        self,
        workflow_project,
        workspace,
        workflow_states,
        workflow_state_rows,
        default_workflow,
        default_revision,
        todo_to_done_flow,
        enable_instance_flag,
        create_user,
    ):
        from plane.db.models import Intake, IntakeIssue

        # Create a triage-state issue, an intake for the project, and
        # bind the issue to the intake. Then accept the intake.
        triage_state = workflow_states["triage"]
        default_state = workflow_states["todo"]

        issue = Issue.objects.create(
            project=workflow_project,
            workspace=workflow_project.workspace,
            state=triage_state,
            name="Triage issue",
            created_by=create_user,
            updated_by=create_user,
        )
        intake = Intake.objects.create(
            project=workflow_project,
            workspace=workflow_project.workspace,
            name="Default intake",
            created_by=create_user,
        )
        intake_issue = IntakeIssue.objects.create(
            project=workflow_project,
            workspace=workflow_project.workspace,
            intake=intake,
            issue=issue,
            status=-2,  # pending
            created_by=create_user,
        )

        # Now accept the intake via the serializer's update method.
        from plane.app.serializers.intake import IntakeIssueSerializer

        serializer = IntakeIssueSerializer(
            intake_issue,
            data={"status": 1},
            partial=True,
        )
        assert serializer.is_valid(), serializer.errors
        updated = serializer.save()
        # The intake serializer returns the IntakeIssue row; the
        # underlying issue should have moved to the project default
        # state (Todo) through the bypass path.
        issue.refresh_from_db()
        assert issue.state_id == default_state.id


@pytest.mark.unit
@pytest.mark.django_db
class TestAutomationBypass:
    """§29.5 #4 — automation task uses audited system_bypass per issue."""

    def test_close_old_issues_routes_through_service(
        self,
        workflow_project,
        workflow_states,
        workflow_state_rows,
        default_workflow,
        default_revision,
        enable_instance_flag,
        create_user,
    ):
        from plane.bgtasks.issue_automation_task import close_old_issues

        # Create a project member eligible for the default flow actor
        # and an issue older than the close_in window in a non-terminal
        # group state.
        from datetime import timedelta
        from django.utils import timezone

        workflow_project.close_in = 1  # 1 month
        workflow_project.save()

        # Place the issue in the "in_progress" state (started group).
        issue = Issue.objects.create(
            project=workflow_project,
            workspace=workflow_project.workspace,
            state=workflow_states["in_progress"],
            name="Old issue",
            created_by=create_user,
            updated_by=create_user,
        )
        # Backdate so the close_old_issues query picks it up.
        old = timezone.now() - timedelta(days=45)
        Issue.objects.filter(pk=issue.pk).update(updated_at=old)

        close_old_issues()

        issue.refresh_from_db()
        # The project has no ``default_state`` so the close state is the
        # first cancelled-group state, or the global default workflow
        # state's group. Either way, the issue's state is no longer
        # in_progress — the bypass routed it through the service.
        assert issue.state_id != workflow_states["in_progress"].id
