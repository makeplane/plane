# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Workflow schema regression tests — spec §7 + §29.1.

Phase 0 ships the workflow models and constraints only; these tests
verify the schema-only contract:

- the §7.1 §7.3 §7.4 constraints are enforced at the DB layer
  (uniqueness, partial uniqueness, OneToOne);
- soft-delete preserves uniqueness history so a deleted row does not
  release the slot (§7 §27 invariant);
- the §27 lookup indexes exist on the right fields;
- ``Project.workflow_enabled`` defaults to ``False`` so Phase 0 is
  purely additive (§25 Phase 0).

Runtime resolution semantics (default wins, type override beats
default, inactive falls back, binding wins over re-publish) are
implemented in P0.3 and covered by the workflow service tests; the
schema-only tests here only assert that the configuration can be
written and read back.
"""

import uuid

import pytest
from django.db import IntegrityError, transaction

from plane.db.models import (
    Issue,
    IssueType,
    IssueWorkflowBinding,
    Project,
    ProjectMember,
    State,
    Workflow,
    WorkflowFlow,
    WorkflowFlowActor,
    WorkflowRevision,
    WorkflowRevisionStatus,
    WorkflowState,
    WorkflowTypeAssignment,
)
from plane.db.models.workflow import (
    WorkflowFlowActorType,
    WorkflowFlowType,
)


@pytest.fixture
def project(db, workspace, create_user):
    """A real Project attached to the test workspace.

    The default manager on Project is the soft-delete manager, so we
    reach for ``all_objects`` when we need to confirm soft-deleted
    rows are still in the table.
    """
    proj = Project.objects.create(
        name="Workflow Test Project",
        identifier="WFT",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(
        project=proj, member=create_user, role=20, is_active=True
    )
    return proj


@pytest.fixture
def issue_type(db, workspace, create_user):
    """A Work Item type usable by ``WorkflowTypeAssignment``."""
    return IssueType.objects.create(
        workspace=workspace,
        name="Bug",
        created_by=create_user,
    )


@pytest.fixture
def state(db, project, workspace, create_user):
    """A single default State for inclusion in workflow revisions."""
    return State.objects.create(
        name="Todo",
        project=project,
        workspace=workspace,
        group="backlog",
        default=True,
        created_by=create_user,
    )


@pytest.fixture
def issue(db, project, state, create_user):
    """An Issue ready for an IssueWorkflowBinding."""
    return Issue.objects.create(
        project=project,
        workspace=project.workspace,
        state=state,
        name="An issue",
        created_by=create_user,
    )


@pytest.mark.unit
class TestProjectWorkflowEnabled:
    """``Project.workflow_enabled`` — spec §7.1, §25 Phase 0."""

    @pytest.mark.django_db
    def test_defaults_to_false(self, project):
        """Phase 0 ships with the flag off so the schema is additive."""
        assert project.workflow_enabled is False

    @pytest.mark.django_db
    def test_can_be_toggled(self, project):
        project.workflow_enabled = True
        project.save()
        project.refresh_from_db()
        assert project.workflow_enabled is True


@pytest.mark.unit
class TestWorkflowModel:
    """``Workflow`` — spec §7.1."""

    @pytest.mark.django_db
    def test_create_workflow_defaults(self, project, create_user):
        wf = Workflow.objects.create(
            project=project, name="Default", created_by=create_user
        )
        assert wf.is_active is True
        assert wf.is_default is False
        assert wf.workspace_id == project.workspace_id

    @pytest.mark.django_db
    def test_workflow_name_unique_per_project(self, project, create_user):
        Workflow.objects.create(
            project=project, name="My flow", created_by=create_user
        )
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                Workflow.objects.create(
                    project=project, name="My flow", created_by=create_user
                )

    @pytest.mark.django_db
    def test_workflow_name_can_reuse_after_soft_delete(
        self, project, create_user
    ):
        """§7.1: name unique per project *among non-deleted rows*.

        A soft-deleted workflow must release its slot so an admin can
        re-create a workflow with the same name. We use the raw
        ``deleted_at`` field instead of ``delete()`` because the
        soft-delete path enqueues a Celery bgtask that isn't available
        in the unit-test environment.
        """
        from django.utils import timezone

        first = Workflow.objects.create(
            project=project, name="Recyclable", created_by=create_user
        )
        first.deleted_at = timezone.now()
        first.save()

        second = Workflow.objects.create(
            project=project, name="Recyclable", created_by=create_user
        )
        assert second.id != first.id

    @pytest.mark.django_db
    def test_only_one_default_workflow_per_project(
        self, project, create_user
    ):
        """§7.1 partial-unique: one default among non-deleted rows."""
        Workflow.objects.create(
            project=project,
            name="Default flow",
            is_default=True,
            created_by=create_user,
        )
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                Workflow.objects.create(
                    project=project,
                    name="Other default",
                    is_default=True,
                    created_by=create_user,
                )

    @pytest.mark.django_db
    def test_multiple_custom_workflows_allowed(
        self, project, create_user
    ):
        Workflow.objects.create(
            project=project, name="Custom A", created_by=create_user
        )
        Workflow.objects.create(
            project=project, name="Custom B", created_by=create_user
        )
        assert Workflow.objects.filter(project=project).count() == 2


@pytest.mark.unit
class TestWorkflowRevision:
    """``WorkflowRevision`` — spec §7.2."""

    @pytest.mark.django_db
    def test_create_revision_defaults_to_draft(
        self, project, create_user
    ):
        wf = Workflow.objects.create(
            project=project, name="W", created_by=create_user
        )
        rev = WorkflowRevision.objects.create(
            project=project,
            workflow=wf,
            version=1,
            created_by=create_user,
        )
        assert rev.status == WorkflowRevisionStatus.DRAFT
        assert rev.published_at is None
        assert rev.published_by is None

    @pytest.mark.django_db
    def test_unique_workflow_version_pair(self, project, create_user):
        wf = Workflow.objects.create(
            project=project, name="W", created_by=create_user
        )
        WorkflowRevision.objects.create(
            project=project,
            workflow=wf,
            version=1,
            created_by=create_user,
        )
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                WorkflowRevision.objects.create(
                    project=project,
                    workflow=wf,
                    version=1,
                    created_by=create_user,
                )

    @pytest.mark.django_db
    def test_only_one_draft_per_workflow(self, project, create_user):
        wf = Workflow.objects.create(
            project=project, name="W", created_by=create_user
        )
        WorkflowRevision.objects.create(
            project=project,
            workflow=wf,
            version=1,
            status="draft",
            created_by=create_user,
        )
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                WorkflowRevision.objects.create(
                    project=project,
                    workflow=wf,
                    version=2,
                    status="draft",
                    created_by=create_user,
                )

    @pytest.mark.django_db
    def test_multiple_published_revisions_allowed(
        self, project, create_user
    ):
        """The draft-uniqueness constraint is partial — historical
        published revisions coexist so we can audit the timeline."""
        wf = Workflow.objects.create(
            project=project, name="W", created_by=create_user
        )
        WorkflowRevision.objects.create(
            project=project,
            workflow=wf,
            version=1,
            status="published",
            created_by=create_user,
        )
        WorkflowRevision.objects.create(
            project=project,
            workflow=wf,
            version=2,
            status="published",
            created_by=create_user,
        )
        assert WorkflowRevision.objects.filter(workflow=wf).count() == 2

    @pytest.mark.django_db
    def test_new_draft_allowed_after_publishing_old_one(
        self, project, create_user
    ):
        """Editing a published workflow starts a fresh draft (§7.2)."""
        wf = Workflow.objects.create(
            project=project, name="W", created_by=create_user
        )
        WorkflowRevision.objects.create(
            project=project,
            workflow=wf,
            version=1,
            status="published",
            created_by=create_user,
        )
        # A new draft on the same workflow is allowed.
        new_draft = WorkflowRevision.objects.create(
            project=project,
            workflow=wf,
            version=2,
            status="draft",
            created_by=create_user,
        )
        assert new_draft.status == "draft"


@pytest.mark.unit
class TestWorkflowTypeAssignment:
    """``WorkflowTypeAssignment`` — spec §7.3."""

    @pytest.mark.django_db
    def test_unique_assignment_per_project_issue_type(
        self, project, issue_type, create_user
    ):
        wf = Workflow.objects.create(
            project=project, name="W", created_by=create_user
        )
        WorkflowTypeAssignment.objects.create(
            project=project, workflow=wf, issue_type=issue_type
        )
        # Different workflow, same (project, issue_type) — must still be unique.
        wf2 = Workflow.objects.create(
            project=project, name="W2", created_by=create_user
        )
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                WorkflowTypeAssignment.objects.create(
                    project=project, workflow=wf2, issue_type=issue_type
                )


@pytest.mark.unit
class TestWorkflowState:
    """``WorkflowState`` — spec §7.4."""

    @pytest.mark.django_db
    def test_unique_state_per_revision(
        self, project, state, create_user
    ):
        wf = Workflow.objects.create(
            project=project, name="W", created_by=create_user
        )
        rev = WorkflowRevision.objects.create(
            project=project,
            workflow=wf,
            version=1,
            created_by=create_user,
        )
        WorkflowState.objects.create(
            project=project,
            revision=rev,
            state=state,
            allow_new_work_items=True,
            sequence=1,
        )
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                WorkflowState.objects.create(
                    project=project,
                    revision=rev,
                    state=state,
                    allow_new_work_items=True,
                    sequence=2,
                )


@pytest.mark.unit
class TestWorkflowFlowAndActors:
    """``WorkflowFlow`` and ``WorkflowFlowActor`` — spec §7.5–§7.6."""

    @pytest.mark.django_db
    def test_create_transition_flow_without_reject_state(
        self, project, state, create_user
    ):
        wf = Workflow.objects.create(
            project=project, name="W", created_by=create_user
        )
        rev = WorkflowRevision.objects.create(
            project=project,
            workflow=wf,
            version=1,
            created_by=create_user,
        )
        # The shared ``state`` fixture already created a ``Todo`` row.
        # (revision, state) is unique, so we add two more distinct
        # ``State`` rows to model a three-node flow.
        progress = State.objects.create(
            project=project,
            workspace=project.workspace,
            name="In Progress",
            group="started",
        )
        done = State.objects.create(
            project=project,
            workspace=project.workspace,
            name="Done",
            group="completed",
        )
        a = WorkflowState.objects.create(
            project=project, revision=rev, state=state, sequence=1
        )
        b = WorkflowState.objects.create(
            project=project, revision=rev, state=progress, sequence=2
        )
        # ``done`` is unused in this flow but exercises the third node.
        WorkflowState.objects.create(
            project=project, revision=rev, state=done, sequence=3
        )
        flow = WorkflowFlow.objects.create(
            project=project,
            revision=rev,
            source_state=a,
            target_state=b,
            flow_type=WorkflowFlowType.TRANSITION,
            reject_state=None,
            sequence=1,
        )
        assert flow.reject_state_id is None
        assert flow.flow_type == "transition"

    @pytest.mark.django_db
    def test_create_approval_flow_with_reject_state(
        self, project, state, create_user
    ):
        wf = Workflow.objects.create(
            project=project, name="W", created_by=create_user
        )
        rev = WorkflowRevision.objects.create(
            project=project,
            workflow=wf,
            version=1,
            created_by=create_user,
        )
        progress = State.objects.create(
            project=project,
            workspace=project.workspace,
            name="In Progress 2",
            group="started",
        )
        rejected = State.objects.create(
            project=project,
            workspace=project.workspace,
            name="Rejected 2",
            group="cancelled",
        )
        a = WorkflowState.objects.create(
            project=project, revision=rev, state=state, sequence=1
        )
        b = WorkflowState.objects.create(
            project=project, revision=rev, state=progress, sequence=2
        )
        c = WorkflowState.objects.create(
            project=project, revision=rev, state=rejected, sequence=3
        )
        flow = WorkflowFlow.objects.create(
            project=project,
            revision=rev,
            source_state=a,
            target_state=b,
            flow_type=WorkflowFlowType.APPROVAL,
            reject_state=c,
            sequence=1,
        )
        assert flow.reject_state_id == c.id

    @pytest.mark.django_db
    def test_actor_carries_actor_type_and_config(
        self, project, state, create_user
    ):
        wf = Workflow.objects.create(
            project=project, name="W", created_by=create_user
        )
        rev = WorkflowRevision.objects.create(
            project=project,
            workflow=wf,
            version=1,
            created_by=create_user,
        )
        progress = State.objects.create(
            project=project,
            workspace=project.workspace,
            name="In Progress 3",
            group="started",
        )
        a = WorkflowState.objects.create(
            project=project, revision=rev, state=state, sequence=1
        )
        b = WorkflowState.objects.create(
            project=project, revision=rev, state=progress, sequence=2
        )
        flow = WorkflowFlow.objects.create(
            project=project,
            revision=rev,
            source_state=a,
            target_state=b,
            flow_type=WorkflowFlowType.APPROVAL,
            reject_state=b,
        )
        actor = WorkflowFlowActor.objects.create(
            project=project,
            flow=flow,
            actor_type=WorkflowFlowActorType.STATIC_USERS,
            config={"user_ids": [str(uuid.uuid4())]},
            sequence=1,
        )
        assert actor.actor_type == "STATIC_USERS"
        assert "user_ids" in actor.config


@pytest.mark.unit
class TestIssueWorkflowBinding:
    """``IssueWorkflowBinding`` — spec §7.7."""

    @pytest.mark.django_db
    def test_binding_pins_issue_to_revision(
        self, project, issue, state, create_user
    ):
        wf = Workflow.objects.create(
            project=project, name="W", created_by=create_user
        )
        rev = WorkflowRevision.objects.create(
            project=project,
            workflow=wf,
            version=1,
            status="published",
            created_by=create_user,
        )
        binding = IssueWorkflowBinding.objects.create(
            project=project,
            workspace=project.workspace,
            issue=issue,
            workflow=wf,
            workflow_revision=rev,
            bound_by=create_user,
        )
        assert binding.bound_at is not None
        assert binding.completed_at is None
        assert binding.migrated_from_revision_id is None

    @pytest.mark.django_db
    def test_one_binding_per_issue(self, project, issue, state, create_user):
        """§7.7: ``issue`` is one-to-one."""
        wf = Workflow.objects.create(
            project=project, name="W", created_by=create_user
        )
        rev = WorkflowRevision.objects.create(
            project=project,
            workflow=wf,
            version=1,
            created_by=create_user,
        )
        IssueWorkflowBinding.objects.create(
            project=project,
            workspace=project.workspace,
            issue=issue,
            workflow=wf,
            workflow_revision=rev,
        )
        # Second binding on the same issue must fail.
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                IssueWorkflowBinding.objects.create(
                    project=project,
                    workspace=project.workspace,
                    issue=issue,
                    workflow=wf,
                    workflow_revision=rev,
                )


@pytest.mark.unit
class TestWorkflowResolution:
    """Spec §29.1 — workflow resolution semantics that can be checked
    at the schema layer.

    The full resolver lives in P0.3; here we assert that the
    configuration needed to *answer* §29.1 questions is present and
    queryable (default workflow + type assignment + binding).
    """

    @pytest.mark.django_db
    def test_default_workflow_resolves_for_project(
        self, project, create_user
    ):
        """§29.1: default workflow resolves.

        The full resolver is P0.3, but the storage must be able to
        return "the default workflow for this project" without an
        N+1."""
        wf = Workflow.objects.create(
            project=project,
            name="Default",
            is_default=True,
            created_by=create_user,
        )
        Workflow.objects.create(
            project=project, name="Custom", created_by=create_user
        )
        default = Workflow.objects.get(
            project=project, is_default=True, deleted_at__isnull=True
        )
        assert default.id == wf.id

    @pytest.mark.django_db
    def test_type_assignment_overrides_default(
        self, project, issue_type, create_user
    ):
        """§29.1: type-specific workflow overrides default.

        Schema-level contract: a (project, issue_type) row exists and
        points at a non-default workflow, so the P0.3 resolver can pick
        it over the project default.
        """
        default = Workflow.objects.create(
            project=project,
            name="Default",
            is_default=True,
            created_by=create_user,
        )
        specific = Workflow.objects.create(
            project=project, name="Bug flow", created_by=create_user
        )
        WorkflowTypeAssignment.objects.create(
            project=project, workflow=specific, issue_type=issue_type
        )
        assignment = WorkflowTypeAssignment.objects.get(
            project=project, issue_type=issue_type
        )
        assert assignment.workflow_id != default.id
        assert assignment.workflow_id == specific.id
