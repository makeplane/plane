# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""§29.1 — workflow resolution tests."""

# Third Party imports
import pytest

# Module imports
from plane.db.models import IssueWorkflowBinding, Workflow, WorkflowTypeAssignment
from plane.services.workflow.resolver import WorkflowResolver


@pytest.mark.unit
@pytest.mark.django_db
class TestWorkflowResolver:
    """§29.1 — workflow resolution invariants."""

    def test_returns_none_when_project_disabled(
        self,
        workflow_states,
        workflow_state_rows,
        default_workflow,
        default_revision,
        workflow_issue,
    ):
        # Toggle the project flag off; resolver should respect the gate.
        workflow_issue.project.workflow_enabled = False
        workflow_issue.project.save()
        assert WorkflowResolver.resolve(workflow_issue) is None

    def test_resolves_default_workflow(
        self,
        workflow_issue,
        default_workflow,
        default_revision,
        enable_instance_flag,
    ):
        eff = WorkflowResolver.resolve(workflow_issue)
        assert eff is not None
        assert eff.workflow_id == default_workflow.id
        assert eff.revision_id == default_revision.id
        assert eff.is_type_specific is False

    def test_type_specific_overrides_default(
        self,
        workflow_project,
        workflow_issue,
        workflow_issue_type,
        default_workflow,
        default_revision,
        enable_instance_flag,
    ):
        # Create a second workflow + assignment for the bug type.
        custom = Workflow.objects.create(
            project=workflow_project,
            name="Bug flow",
            is_active=True,
            is_default=False,
        )
        from plane.db.models import WorkflowRevision, WorkflowRevisionStatus

        custom_rev = WorkflowRevision.objects.create(
            project=workflow_project,
            workflow=custom,
            version=1,
            status=WorkflowRevisionStatus.PUBLISHED,
        )
        WorkflowTypeAssignment.objects.create(
            project=workflow_project,
            workflow=custom,
            issue_type=workflow_issue_type,
        )
        workflow_issue.type_id = workflow_issue_type.id
        workflow_issue.save()

        eff = WorkflowResolver.resolve(workflow_issue)
        assert eff is not None
        assert eff.workflow_id == custom.id
        assert eff.is_type_specific is True

    def test_existing_binding_wins_over_published_revision(
        self,
        workflow_issue,
        default_workflow,
        default_revision,
        enable_instance_flag,
    ):
        from plane.db.models import Workflow, WorkflowRevision, WorkflowRevisionStatus

        # Publish a v2 revision and create a binding to v1.
        v2 = WorkflowRevision.objects.create(
            project=default_workflow.project,
            workflow=default_workflow,
            version=2,
            status=WorkflowRevisionStatus.PUBLISHED,
        )
        IssueWorkflowBinding.objects.create(
            issue=workflow_issue,
            workflow=default_workflow,
            workflow_revision=default_revision,
        )

        eff = WorkflowResolver.resolve(workflow_issue)
        assert eff.revision_id == default_revision.id  # bound to v1
        assert eff.revision_id != v2.id

    def test_workflows_disabled_returns_none(
        self,
        workflow_issue,
        settings,
    ):
        settings.ENABLE_WORKFLOWS = False
        assert WorkflowResolver.resolve(workflow_issue) is None
