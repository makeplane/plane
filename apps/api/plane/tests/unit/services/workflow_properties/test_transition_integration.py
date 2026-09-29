# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""§30 P1.4 — required-property validation on ``TransitionService``.

The transition service runs the required-property check before
mutating ``Issue.state`` so the contract holds on every state-write
path (direct API, intake accept, automation, MCP — anything that
goes through the service).
"""

# Third Party imports
import pytest

# Module imports
from plane.db.models import (
    Issue,
    IssueTypeProperty,
    State,
    WorkspaceProperty,
    Workflow,
    WorkflowRevision,
    WorkflowRevisionStatus,
    WorkflowState,
)
from plane.services.workflow.errors import WorkflowPreconditionFailed
from plane.services.workflow.transitions import TransitionService


@pytest.fixture
def simple_workflow(db, property_project, create_user):
    """A minimal published workflow with one Todo state."""
    workflow = Workflow.objects.create(
        project=property_project,
        workspace=property_project.workspace,
        name="Default",
        is_default=True,
        is_active=True,
        created_by=create_user,
    )
    revision = WorkflowRevision.objects.create(
        project=property_project,
        workspace=property_project.workspace,
        workflow=workflow,
        version=1,
        status=WorkflowRevisionStatus.PUBLISHED,
        published_by=create_user,
    )
    state = State.objects.filter(project=property_project).first()
    WorkflowState.objects.create(
        project=property_project,
        workspace=property_project.workspace,
        revision=revision,
        state=state,
        allow_new_work_items=True,
    )
    return workflow, revision, state


@pytest.mark.unit
@pytest.mark.django_db
class TestTransitionRequiredProperty:
    def test_transition_blocks_when_required_missing(
        self, db, property_project, property_issue_type, simple_workflow, create_user
    ):
        # Attach a required dropdown that has no default_value.
        prop = WorkspaceProperty.objects.create(
            workspace=property_project.workspace,
            name="TransitionPriority",
            property_type="DROPDOWN",
            config={"choices": ["low", "high"]},
            created_by=create_user,
        )
        IssueTypeProperty.objects.create(
            project=property_project,
            workspace=property_project.workspace,
            issue_type=property_issue_type,
            property=prop,
            is_required=True,
            created_by=create_user,
        )
        target_state = State.objects.create(
            name="Doing",
            project=property_project,
            workspace=property_project.workspace,
            group="started",
            created_by=create_user,
        )
        issue = Issue.objects.create(
            project=property_project,
            workspace=property_project.workspace,
            state=simple_workflow[2],
            name="T",
            type_id=property_issue_type.id,
            created_by=create_user,
        )
        from plane.services.workflow.bindings import bind_on_creation

        bind_on_creation(issue=issue, actor_id=str(create_user.id))
        with pytest.raises(WorkflowPreconditionFailed):
            TransitionService.transition(
                issue_id=issue.id,
                target_state_id=str(target_state.id),
                actor=None,
                actor_id=str(create_user.id),
                origin="api",
            )

    def test_transition_succeeds_when_required_satisfied(
        self, db, property_project, property_issue_type, simple_workflow,
        dropdown_property, property_issue, create_user
    ):
        IssueTypeProperty.objects.create(
            project=property_project,
            workspace=property_project.workspace,
            issue_type=property_issue_type,
            property=dropdown_property,
            is_required=True,
            created_by=create_user,
        )
        # Move the issue onto the workflow's first state and tag it with
        # the issue type so the required check runs.
        issue = property_issue
        issue.type_id = property_issue_type.id
        issue.state = simple_workflow[2]
        issue.save()
        from plane.services.workflow_properties import persist_property_values

        persist_property_values(
            issue=issue,
            project_id=property_project.id,
            workspace_id=property_project.workspace_id,
            actor_id=str(create_user.id),
            values_by_property_id={str(dropdown_property.id): "low"},
        )
        # Provide a second state so transition has somewhere to go.
        target_state = State.objects.create(
            name="Doing",
            project=property_project,
            workspace=property_project.workspace,
            group="started",
            created_by=create_user,
        )
        from plane.services.workflow.flags import instance_workflows_enabled

        # Ensure instance flag is off so the test doesn't depend on
        # workflow config; the property check runs before the
        # workflows_active branch.
        if instance_workflows_enabled():
            pytest.skip("Instance flag is on; transition routing differs.")
        result = TransitionService.transition(
            issue_id=issue.id,
            target_state_id=str(target_state.id),
            actor=None,
            actor_id=str(create_user.id),
            origin="api",
        )
        assert str(result.state_id) == str(target_state.id)
