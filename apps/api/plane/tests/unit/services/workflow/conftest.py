# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Shared fixtures for the workflow service tests."""

# Third Party imports
import pytest

# Module imports
from plane.db.models import (
    Issue,
    IssueType,
    Project,
    ProjectMember,
    State,
    Workflow,
    WorkflowFlow,
    WorkflowFlowActor,
    WorkflowFlowActorType,
    WorkflowFlowType,
    WorkflowRevision,
    WorkflowRevisionStatus,
    WorkflowState,
    WorkflowTypeAssignment,
)


@pytest.fixture
def workflow_project(db, workspace, create_user):
    """A project with workflows enabled and one default workflow + revision."""
    project = Project.objects.create(
        name="Workflow Project",
        identifier="WFP",
        workspace=workspace,
        created_by=create_user,
        workflow_enabled=True,
    )
    ProjectMember.objects.create(
        project=project, member=create_user, role=20, is_active=True
    )
    return project


@pytest.fixture
def workflow_states(db, workflow_project, workspace, create_user):
    """Three project states (Todo / In Progress / Done) and a triage state."""
    todo = State.objects.create(
        name="Todo",
        project=workflow_project,
        workspace=workspace,
        group="backlog",
        default=True,
        created_by=create_user,
    )
    in_progress = State.objects.create(
        name="In Progress",
        project=workflow_project,
        workspace=workspace,
        group="started",
        created_by=create_user,
    )
    done = State.objects.create(
        name="Done",
        project=workflow_project,
        workspace=workspace,
        group="completed",
        created_by=create_user,
    )
    triage = State.objects.create(
        name="Triage",
        project=workflow_project,
        workspace=workspace,
        group="triage",
        created_by=create_user,
    )
    return {"todo": todo, "in_progress": in_progress, "done": done, "triage": triage}


@pytest.fixture
def default_workflow(db, workflow_project, create_user):
    """A published default workflow for the project."""
    return Workflow.objects.create(
        project=workflow_project,
        name="Default",
        is_default=True,
        is_active=True,
        created_by=create_user,
        updated_by=create_user,
    )


@pytest.fixture
def default_revision(db, workflow_project, default_workflow, create_user):
    """A first published revision on the default workflow."""
    return WorkflowRevision.objects.create(
        project=workflow_project,
        workflow=default_workflow,
        version=1,
        status=WorkflowRevisionStatus.PUBLISHED,
        published_by=create_user,
    )


@pytest.fixture
def workflow_state_rows(
    db,
    workflow_project,
    default_workflow,
    default_revision,
    workflow_states,
    create_user,
):
    """WorkflowState rows for the default revision covering all four states."""
    rows = {}
    for key, state in workflow_states.items():
        rows[key] = WorkflowState.objects.create(
            project=workflow_project,
            revision=default_revision,
            state=state,
            allow_new_work_items=(key == "todo"),
            sequence=(
                1 if key == "todo" else 2 if key == "in_progress" else 3 if key == "done" else 4
            ),
        )
    return rows


@pytest.fixture
def todo_to_done_flow(
    db,
    workflow_project,
    default_workflow,
    default_revision,
    workflow_state_rows,
    create_user,
):
    """A simple Todo → Done transition flow with a single ALL_PROJECT_MEMBERS actor."""
    flow = WorkflowFlow.objects.create(
        project=workflow_project,
        revision=default_revision,
        source_state=workflow_state_rows["todo"],
        target_state=workflow_state_rows["done"],
        flow_type=WorkflowFlowType.TRANSITION,
        is_active=True,
    )
    WorkflowFlowActor.objects.create(
        project=workflow_project,
        flow=flow,
        actor_type=WorkflowFlowActorType.ALL_PROJECT_MEMBERS,
        config={},
    )
    return flow


@pytest.fixture
def workflow_issue(
    db,
    workflow_project,
    workflow_states,
    create_user,
):
    """An Issue in the Todo state."""
    return Issue.objects.create(
        project=workflow_project,
        workspace=workflow_project.workspace,
        state=workflow_states["todo"],
        name="A test issue",
        created_by=create_user,
        updated_by=create_user,
    )


@pytest.fixture
def workflow_issue_type(db, workspace, create_user):
    """An IssueType used for type-specific assignments."""
    return IssueType.objects.create(
        workspace=workspace,
        name="Bug",
        created_by=create_user,
    )


@pytest.fixture
def enable_instance_flag(settings):
    """Enable ``ENABLE_WORKFLOWS`` for the duration of a test."""
    settings.ENABLE_WORKFLOWS = True
    return settings
