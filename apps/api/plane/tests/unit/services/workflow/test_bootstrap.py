# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Bootstrap service tests — §25 Phase 2 default-workflow creation."""

# Third Party imports
import pytest

# Module imports
from plane.db.models import (
    State,
    Workflow,
    WorkflowRevision,
    WorkflowRevisionStatus,
)
from plane.services.workflow.bootstrap import ensure_default_workflow


@pytest.mark.unit
@pytest.mark.django_db
class TestBootstrapDefaultWorkflow:
    def test_creates_full_cross_product_of_flows(
        self,
        workflow_project,
        workflow_states,
        create_user,
    ):
        wf = ensure_default_workflow(
            project=workflow_project,
            actor_id=str(create_user.id),
        )
        assert wf is not None
        assert wf.is_default is True

        revision = WorkflowRevision.objects.get(workflow=wf, version=1)
        assert revision.status == WorkflowRevisionStatus.PUBLISHED

        # One transition flow per (src, dst) ordered pair.
        from plane.db.models import WorkflowFlow, WorkflowFlowType, WorkflowState

        flows = list(WorkflowFlow.objects.filter(revision=revision))
        states = list(WorkflowState.objects.filter(revision=revision))
        n = len(states)
        # n*(n-1) directed pairs, all transitions.
        assert len(flows) == n * (n - 1)
        for f in flows:
            assert f.flow_type == WorkflowFlowType.TRANSITION
            assert f.is_active is True

    def test_idempotent_when_called_twice(
        self,
        workflow_project,
        workflow_states,
        create_user,
    ):
        first = ensure_default_workflow(
            project=workflow_project,
            actor_id=str(create_user.id),
        )
        second = ensure_default_workflow(
            project=workflow_project,
            actor_id=str(create_user.id),
        )
        assert first is not None
        assert first.id == second.id
        # No second default workflow was created.
        assert Workflow.objects.filter(
            project=workflow_project, is_default=True
        ).count() == 1

    def test_no_states_returns_none(
        self,
        workspace,
        create_user,
    ):
        from plane.db.models import Project

        empty = Project.objects.create(
            name="Empty",
            identifier="EMP",
            workspace=workspace,
            created_by=create_user,
        )
        result = ensure_default_workflow(project=empty, actor_id=str(create_user.id))
        assert result is None

    def test_marks_default_state_as_creation_eligible(
        self,
        workflow_project,
        workflow_states,
        create_user,
    ):
        wf = ensure_default_workflow(
            project=workflow_project,
            actor_id=str(create_user.id),
        )
        assert wf is not None
        revision = WorkflowRevision.objects.get(workflow=wf, version=1)
        from plane.db.models import WorkflowState

        eligible = WorkflowState.objects.filter(
            revision=revision, allow_new_work_items=True
        )
        assert eligible.count() == 1
        assert eligible.first().state_id == workflow_states["todo"].id
