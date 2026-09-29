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
from rest_framework.exceptions import APIException

# Module imports
from plane.api.serializers.issue import IssueSerializer
from plane.db.models import (
    Issue,
    IssueTypeProperty,
    Project,
    ProjectMember,
    State,
    WorkspaceProperty,
    Workflow,
    WorkflowRevision,
    WorkflowRevisionStatus,
    WorkflowState,
)
from plane.services.workflow.errors import (
    WorkflowStateNotIncluded,
    WorkflowTransitionNotAllowed,
)
from plane.services.workflow.transitions import TransitionService


@pytest.fixture
def simple_workflow(db, property_project, property_state, create_user):
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
    WorkflowState.objects.create(
        project=property_project,
        workspace=property_project.workspace,
        revision=revision,
        state=property_state,
        allow_new_work_items=True,
    )
    return workflow, revision, property_state


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


# ---------------------------------------------------------------------------
# RD-489 — §30 P0.4 / §34: PAT-authenticated /api/v1/... create+update is
# blocked at the §17.3 boundary when workflows are active.
#
# This pins the *transitive* guarantee MCP will rely on (per
# docs/service-access-tokens-spec.md §15, the MCP server is external and
# speaks to this app over the public REST /api/v1/... surface). Even
# though no MCP server exists in this repo, every state-mutation call
# an MCP client can issue funnels through the same `IssueSerializer`
# code paths a PAT-authenticated request hits, so testing the
# serializer here is equivalent to testing the MCP-reachable surface.
# See docs/workflows-rd487-surface-inventory.md row 6.
# ---------------------------------------------------------------------------


@pytest.fixture
def v1_workflow_project(db, workspace, create_user):
    """A project with ``workflow_enabled`` flipped on — the
    precondition for the §17.3 boundary to actually fire on the
    public API v1 serializer."""
    proj = Project.objects.create(
        name="V1 Workflow Project",
        identifier="VWP",
        workspace=workspace,
        created_by=create_user,
        workflow_enabled=True,
    )
    ProjectMember.objects.create(
        project=proj, member=create_user, role=20, is_active=True
    )
    return proj


@pytest.fixture
def enable_workflows_instance_flag(settings):
    """Set ``settings.ENABLE_WORKFLOWS = True`` so
    ``workflows_active(project)`` returns True. Mirrors the
    ``enable_instance_flag`` fixture used by the workflow service
    tests in ``apps/api/plane/tests/unit/services/workflow/conftest.py``."""
    settings.ENABLE_WORKFLOWS = True
    return settings


@pytest.fixture
def v1_workflow_setup(
    db, v1_workflow_project, workspace, create_user
):
    """One published workflow on ``v1_workflow_project`` with a single
    Todo state (``allow_new_work_items=True``). Returns
    ``(project, revision, todo_state, extra_state)`` where
    ``extra_state`` is a second project state that is **not** bound
    to the workflow — exercising the §17.3 boundary on create."""
    todo = State.objects.create(
        name="Todo",
        project=v1_workflow_project,
        workspace=workspace,
        group="backlog",
        default=True,
        created_by=create_user,
    )
    extra = State.objects.create(
        name="Extra",
        project=v1_workflow_project,
        workspace=workspace,
        group="backlog",
        created_by=create_user,
    )
    workflow = Workflow.objects.create(
        project=v1_workflow_project,
        workspace=workspace,
        name="Default",
        is_default=True,
        is_active=True,
        created_by=create_user,
    )
    revision = WorkflowRevision.objects.create(
        project=v1_workflow_project,
        workspace=workspace,
        workflow=workflow,
        version=1,
        status=WorkflowRevisionStatus.PUBLISHED,
        published_by=create_user,
    )
    # Bind only `todo` to the revision; `extra` is intentionally
    # outside the workflow so a /api/v1/... create with `state_id=extra`
    # hits the §17.3 boundary.
    WorkflowState.objects.create(
        project=v1_workflow_project,
        workspace=workspace,
        revision=revision,
        state=todo,
        allow_new_work_items=True,
    )
    return v1_workflow_project, revision, todo, extra


@pytest.mark.unit
@pytest.mark.django_db
class TestPublicApiV1SurfaceGoverned:
    """RD-489 — the public API v1 ``IssueSerializer`` (the surface
    MCP will speak per docs/service-access-tokens-spec.md §15) routes
    state mutations through ``TransitionService``. A PAT-authenticated
    caller cannot bypass workflow enforcement via ``POST`` or
    ``PATCH`` on ``/api/v1/.../issues/``."""

    def test_v1_create_with_state_outside_workflow_is_blocked(
        self,
        db,
        enable_workflows_instance_flag,
        v1_workflow_setup,
        create_user,
    ):
        """A PAT POST ``/api/v1/.../issues/`` carrying a ``state_id``
        that is not part of the bound workflow revision is rejected at
        the §17.3 boundary (``WORKFLOW_STATE_NOT_INCLUDED``). This is
        the §34 invariant in the create path."""
        project, _revision, _todo, extra = v1_workflow_setup
        serializer = IssueSerializer(
            data={
                "name": "PAT-created issue",
                "state": str(extra.id),
            },
            context={
                "project_id": str(project.id),
                "workspace_id": str(project.workspace_id),
                "default_assignee_id": str(create_user.id),
            },
        )
        assert serializer.is_valid(raise_exception=True)
        with pytest.raises(APIException) as exc_info:
            serializer.save()
        # §17.3 surface — the serializer translates the workflow
        # dataclass into an APIException carrying the same code, so
        # MCP / PAT / web clients all see the same error envelope.
        assert exc_info.value.detail["code"] == WorkflowStateNotIncluded(
            state_id=str(extra.id)
        ).code
        # And no issue was persisted.
        assert not Issue.objects.filter(
            project=project, name="PAT-created issue"
        ).exists()

    def test_v1_update_to_state_without_transition_flow_is_blocked(
        self,
        db,
        enable_workflows_instance_flag,
        v1_workflow_setup,
        create_user,
    ):
        """A PAT PATCH ``/api/v1/.../issues/:id/`` moving an issue to a
        state that has no transition flow from the current state is
        rejected at the §17.3 boundary
        (``WORKFLOW_TRANSITION_NOT_ALLOWED``)."""
        project, _revision, todo, extra = v1_workflow_setup
        # Seed an issue that lives inside the workflow (Todo).
        issue = Issue.objects.create(
            project=project,
            workspace=project.workspace,
            state=todo,
            name="Seed",
            created_by=create_user,
            updated_by=create_user,
        )
        serializer = IssueSerializer(
            issue,
            data={"state": str(extra.id)},
            partial=True,
            context={
                "project_id": str(project.id),
                "workspace_id": str(project.workspace_id),
                "default_assignee_id": str(create_user.id),
            },
        )
        assert serializer.is_valid(raise_exception=True)
        with pytest.raises(APIException) as exc_info:
            serializer.save()
        assert exc_info.value.detail["code"] == WorkflowTransitionNotAllowed(
            source_state_id=str(todo.id),
            target_state_id=str(extra.id),
            allowed_target_ids=[],
        ).code
        # The issue's state must NOT have been mutated.
        issue.refresh_from_db()
        assert str(issue.state_id) == str(todo.id)
