# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for the Questimus move-work-item endpoint (QUESTIMUS-30).

POST /api/workspaces/<slug>/projects/<project_id>/issues/<issue_id>/move/
with body {"target_project_id": "<uuid>"} moves the work item — together with
its whole descendant subtree — into another project of the same workspace:

- new per-destination sequence (max(dest IssueSequence.sequence) + 1), old
  source IssueSequence row kept, new destination row created;
- state remap (same-name state in the destination, then destination default,
  then first non-triage destination state);
- label handling (workspace labels untouched, source-project labels cloned
  into the destination and the moved issues re-pointed to the clones — unless
  a same-named destination label exists, then merged onto it);
- an IssueActivity row (verb="updated", field="project") recording the move.

Errors: 403 when the caller is not an active role >= 15 member of the
destination project (the allow_permission decorator checks the source project
from the URL kwargs only); 404 for a missing issue; 400 for a missing/invalid
target project, a cross-workspace target, an intake-linked issue, or an
archived issue.
"""

from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import (
    Cycle,
    CycleIssue,
    Estimate,
    EstimatePoint,
    Intake,
    IntakeIssue,
    Issue,
    IssueActivity,
    IssueAssignee,
    IssueLabel,
    IssueRelation,
    IssueSequence,
    IssueType,
    IssueVersion,
    Label,
    Module,
    ModuleIssue,
    Project,
    ProjectMember,
    State,
    User,
    Workspace,
    WorkspaceMember,
)
from plane.db.models.issue_type import ProjectIssueType


def make_state(name, project, workspace, group="backlog", default=False):
    return State.objects.create(
        name=name,
        project=project,
        workspace=workspace,
        group=group,
        default=default,
    )


def make_issue(name, project, workspace, state=None, parent=None):
    return Issue.objects.create(
        name=name,
        project=project,
        workspace=workspace,
        state=state,
        parent=parent,
    )


def move_url(slug, project_id, issue_id):
    return f"/api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/move/"


def make_user(label):
    uid = uuid4().hex[:8]
    return User.objects.create(
        email=f"{label}-{uid}@plane.so",
        username=f"{label}_{uid}",
        first_name=label.title(),
        last_name="User",
    )


@pytest.fixture
def project_a(db, workspace, create_user):
    """Source project; create_user is an admin member."""
    project = Project.objects.create(
        name="Source Project",
        identifier="SRC",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    make_state("Backlog", project, workspace, default=True)
    return project


@pytest.fixture
def project_b(db, workspace, create_user):
    """Destination project; create_user is an admin member."""
    project = Project.objects.create(
        name="Target Project",
        identifier="DST",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    make_state("Backlog", project, workspace, default=True)
    return project


@pytest.mark.contract
class TestIssueMove:
    @pytest.mark.django_db
    def test_move_happy_path(
        self, session_client, workspace, project_a, project_b
    ):
        """A full member of both projects moves a work item.

        New sequence is max(destination IssueSequence) + 1, state is remapped
        to the same-named destination state, workspace labels survive while
        source-project labels are dropped, only destination members stay
        assigned, and the move is recorded as an ``updated``/``project``
        activity row.
        """
        # Destination already holds a work item, so the moved issue must take
        # the next sequence number (max + 1 = 2), not reuse 1.
        dst_existing = make_issue("Existing dest work item", project_b, workspace)
        dst_state_in_progress = make_state("In Progress", project_b, workspace, group="started")
        src_state_in_progress = make_state("In Progress", project_a, workspace, group="started")

        root = make_issue("Move me", project_a, workspace, state=src_state_in_progress)

        ws_label = Label.objects.create(workspace=workspace, name="WS Label")
        src_label = Label.objects.create(workspace=workspace, project=project_a, name="Source Label")
        IssueLabel.objects.create(issue=root, label=ws_label, project=project_a)
        IssueLabel.objects.create(issue=root, label=src_label, project=project_a)

        allowed_user = make_user("allowed")
        other_user = make_user("other")
        ProjectMember.objects.create(project=project_b, member=allowed_user, role=20, is_active=True)
        IssueAssignee.objects.create(issue=root, assignee=allowed_user, project=project_a)
        IssueAssignee.objects.create(issue=root, assignee=other_user, project=project_a)

        response = session_client.post(
            move_url(workspace.slug, project_a.id, root.id),
            {"target_project_id": str(project_b.id)},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        data = response.data
        assert str(data["id"]) == str(root.id)
        assert data["name"] == "Move me"
        assert str(data["project_id"]) == str(project_b.id)
        assert data["sequence_id"] == dst_existing.sequence_id + 1
        assert str(data["state_id"]) == str(dst_state_in_progress.id)

        root.refresh_from_db()
        assert root.project_id == project_b.id
        assert root.sequence_id == dst_existing.sequence_id + 1
        assert root.state_id == dst_state_in_progress.id
        assert root.parent_id is None

        # Old source IssueSequence row kept, new destination row created.
        assert IssueSequence.objects.filter(issue_id=root.id, project_id=project_a.id).exists()
        new_rows = IssueSequence.objects.filter(issue_id=root.id, project_id=project_b.id)
        assert new_rows.count() == 1
        assert new_rows.first().sequence == root.sequence_id

        # Labels: workspace label survives under the destination project,
        # source-project label is CLONED into the destination and the moved
        # item re-pointed to the clone (the original label row stays behind
        # for source issues that share it).
        kept_label_row = IssueLabel.objects.filter(issue_id=root.id, label_id=ws_label.id).first()
        assert kept_label_row is not None
        assert kept_label_row.project_id == project_b.id
        cloned_label = Label.objects.filter(project_id=project_b.id, name=src_label.name).first()
        assert cloned_label is not None
        assert cloned_label.pk != src_label.id
        assert cloned_label.project_id == project_b.id
        moved_src_label_row = IssueLabel.objects.filter(issue_id=root.id, label_id=cloned_label.id).first()
        assert moved_src_label_row is not None
        assert moved_src_label_row.project_id == project_b.id
        assert Label.objects.get(pk=src_label.id).project_id == project_a.id

        # Assignees: destination member kept (row points at destination),
        # non-member dropped.
        kept_assignee_row = IssueAssignee.objects.filter(
            issue_id=root.id, assignee_id=allowed_user.id
        ).first()
        assert kept_assignee_row is not None
        assert kept_assignee_row.project_id == project_b.id
        assert not IssueAssignee.objects.filter(issue_id=root.id, assignee_id=other_user.id).exists()

        # Move activity row.
        activity = (
            IssueActivity.objects.filter(issue_id=root.id, verb="updated", field="project")
            .order_by("-created_at")
            .first()
        )
        assert activity is not None, "No project-move activity row was recorded"
        assert activity.old_value == str(project_a.id)
        assert activity.new_value == str(project_b.id)

    @pytest.mark.django_db
    def test_move_sequence_is_next_number_after_collision(
        self, session_client, workspace, project_a, project_b
    ):
        """The new sequence is max(dest)+1 regardless of the source sequence.

        The source issue carries a sequence number (10) higher than every
        destination sequence; a naive global max would collide/reuse, the
        correct behaviour is to take over the next destination number (4).
        """
        for i in range(3):
            make_issue(f"dst-{i}", project_b, workspace)
        src_state = make_state("Todo", project_a, workspace, group="unstarted")
        root = make_issue("Collision", project_a, workspace, state=src_state)
        # Give the source issue an inflated sequence that also exists in dest.
        root.sequence_id = 10
        root.save(update_fields=["sequence_id"])
        IssueSequence.objects.filter(issue_id=root.id, project_id=project_a.id).update(sequence=10)

        response = session_client.post(
            move_url(workspace.slug, project_a.id, root.id),
            {"target_project_id": str(project_b.id)},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert response.data["sequence_id"] == 4, (
            f"Expected max(dest)+1 = 4, got {response.data['sequence_id']}"
        )
        root.refresh_from_db()
        assert root.sequence_id == 4
        # Only one destination sequence row carries the new number.
        assert IssueSequence.objects.filter(project_id=project_b.id, sequence=4).count() == 1

    @pytest.mark.django_db
    def test_move_moves_entire_subtree(
        self, session_client, workspace, project_a, project_b
    ):
        """Moving the root moves every descendant in the same transaction.

        Internal parent/child links are preserved; the root detaches from its
        (non-moving) parent; every moved issue gets its own destination
        sequence and IssueSequence row while the old source row is kept.
        """
        src_state = make_state("Todo", project_a, workspace, group="unstarted")
        root = make_issue("Root", project_a, workspace, state=src_state)
        child1 = make_issue("Child 1", project_a, workspace, state=src_state, parent=root)
        child2 = make_issue("Child 2", project_a, workspace, state=src_state, parent=root)
        grandchild = make_issue("Grandchild", project_a, workspace, state=src_state, parent=child1)

        make_issue("Existing dest", project_b, workspace)

        response = session_client.post(
            move_url(workspace.slug, project_a.id, root.id),
            {"target_project_id": str(project_b.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

        for issue in (root, child1, child2, grandchild):
            issue.refresh_from_db()
            assert issue.project_id == project_b.id
            # Own destination sequence row + kept source row.
            new_rows = IssueSequence.objects.filter(issue_id=issue.id, project_id=project_b.id)
            assert new_rows.count() == 1
            assert new_rows.first().sequence == issue.sequence_id
            assert IssueSequence.objects.filter(issue_id=issue.id, project_id=project_a.id).exists()

        # Every moved issue carries a distinct destination sequence.
        sequences = [
            Issue.objects.get(pk=pk).sequence_id for pk in (root.id, child1.id, child2.id, grandchild.id)
        ]
        assert len(set(sequences)) == len(sequences)

        # Internal links preserved; root detached.
        root.refresh_from_db()
        child1.refresh_from_db()
        child2.refresh_from_db()
        grandchild.refresh_from_db()
        assert root.parent_id is None
        assert child1.parent_id == root.id
        assert child2.parent_id == root.id
        assert grandchild.parent_id == child1.id

    @pytest.mark.django_db
    def test_move_403_without_destination_membership(
        self, db, workspace, project_a, project_b
    ):
        """A source-project member without destination membership is denied."""
        outsider = make_user("outsider")
        ProjectMember.objects.create(project=project_a, member=outsider, role=20, is_active=True)

        src_state = make_state("Todo", project_a, workspace, group="unstarted")
        root = make_issue("No access", project_a, workspace, state=src_state)

        client = APIClient()
        client.force_authenticate(user=outsider)
        response = client.post(
            move_url(workspace.slug, project_a.id, root.id),
            {"target_project_id": str(project_b.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
        root.refresh_from_db()
        assert root.project_id == project_a.id, "The move must not have happened"

    @pytest.mark.django_db
    def test_move_403_guest_in_destination(
        self, db, workspace, project_a, project_b
    ):
        """A role-5 guest in the destination is denied even if a source member."""
        guest = make_user("guest")
        ProjectMember.objects.create(project=project_a, member=guest, role=20, is_active=True)
        ProjectMember.objects.create(project=project_b, member=guest, role=5, is_active=True)

        src_state = make_state("Todo", project_a, workspace, group="unstarted")
        root = make_issue("Guest target", project_a, workspace, state=src_state)

        client = APIClient()
        client.force_authenticate(user=guest)
        response = client.post(
            move_url(workspace.slug, project_a.id, root.id),
            {"target_project_id": str(project_b.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
        root.refresh_from_db()
        assert root.project_id == project_a.id

    @pytest.mark.django_db
    def test_move_404_issue_not_found(
        self, session_client, workspace, project_a, project_b
    ):
        """A nonexistent issue id in the source project returns 404."""
        response = session_client.post(
            move_url(workspace.slug, project_a.id, uuid4()),
            {"target_project_id": str(project_b.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_move_404_issue_in_other_project(
        self, session_client, workspace, project_a, project_b
    ):
        """An issue that lives in another project is not found via this URL."""
        src_state = make_state("Todo", project_b, workspace, group="unstarted")
        root = make_issue("Other project", project_b, workspace, state=src_state)
        response = session_client.post(
            move_url(workspace.slug, project_a.id, root.id),
            {"target_project_id": str(project_b.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_move_400_intake_linked_issue(
        self, session_client, workspace, project_a, project_b, create_user
    ):
        """Issues submitted through intake cannot be moved."""
        src_state = make_state("Todo", project_a, workspace, group="unstarted")
        root = make_issue("Intake", project_a, workspace, state=src_state)
        intake = Intake.objects.create(
            name="Intake", project=project_a, workspace=workspace, created_by=create_user
        )
        IntakeIssue.objects.create(
            intake=intake, issue=root, project=project_a, workspace=workspace, created_by=create_user
        )

        response = session_client.post(
            move_url(workspace.slug, project_a.id, root.id),
            {"target_project_id": str(project_b.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        root.refresh_from_db()
        assert root.project_id == project_a.id

    @pytest.mark.django_db
    def test_move_400_archived_issue(
        self, session_client, workspace, project_a, project_b
    ):
        """Archived issues cannot be moved."""
        from django.utils import timezone

        src_state = make_state("Todo", project_a, workspace, group="unstarted")
        root = make_issue("Archived", project_a, workspace, state=src_state)
        root.archived_at = timezone.localdate()
        root.save(update_fields=["archived_at"])

        response = session_client.post(
            move_url(workspace.slug, project_a.id, root.id),
            {"target_project_id": str(project_b.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        root.refresh_from_db()
        assert root.project_id == project_a.id

    @pytest.mark.django_db
    def test_move_400_missing_target_project_id(
        self, session_client, workspace, project_a
    ):
        """Omitting target_project_id is a 400."""
        src_state = make_state("Todo", project_a, workspace, group="unstarted")
        root = make_issue("No target", project_a, workspace, state=src_state)

        response = session_client.post(move_url(workspace.slug, project_a.id, root.id), {}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        root.refresh_from_db()
        assert root.project_id == project_a.id

    @pytest.mark.django_db
    def test_move_400_invalid_target_project(
        self, session_client, workspace, project_a
    ):
        """A target_project_id that matches no project is a 400."""
        src_state = make_state("Todo", project_a, workspace, group="unstarted")
        root = make_issue("Bad target", project_a, workspace, state=src_state)

        response = session_client.post(
            move_url(workspace.slug, project_a.id, root.id),
            {"target_project_id": str(uuid4())},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        root.refresh_from_db()
        assert root.project_id == project_a.id

    @pytest.mark.django_db
    def test_move_400_cross_workspace_target(
        self, db, session_client, workspace, project_a, create_user
    ):
        """A target project outside the source workspace is a 400."""
        uid = uuid4().hex[:8]
        victim_user = User.objects.create(
            email=f"victim-{uid}@plane.so",
            username=f"victim_{uid}",
            first_name="Victim",
            last_name="User",
        )
        victim_ws = Workspace.objects.create(name="Victim WS", owner=victim_user, slug=f"victim-{uid}")
        WorkspaceMember.objects.create(workspace=victim_ws, member=victim_user, role=20)
        victim_project = Project.objects.create(
            name="Victim Project",
            identifier="VIC",
            workspace=victim_ws,
            created_by=victim_user,
        )
        ProjectMember.objects.create(project=victim_project, member=victim_user, role=20, is_active=True)

        src_state = make_state("Todo", project_a, workspace, group="unstarted")
        root = make_issue("Cross ws", project_a, workspace, state=src_state)

        response = session_client.post(
            move_url(workspace.slug, project_a.id, root.id),
            {"target_project_id": str(victim_project.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        root.refresh_from_db()
        assert root.project_id == project_a.id

    @pytest.mark.django_db
    def test_move_detaches_root_from_live_parent(
        self, session_client, workspace, project_a, project_b
    ):
        """The moved root detaches from a live (non-moving) parent; the
        sibling stays behind and internal subtree links survive (REAL-7)."""
        src_state = make_state("Todo", project_a, workspace, group="unstarted")
        grandparent = make_issue("Grandparent stays", project_a, workspace, state=src_state)
        root = make_issue("Root moves", project_a, workspace, state=src_state, parent=grandparent)
        sibling = make_issue("Sibling stays", project_a, workspace, state=src_state, parent=grandparent)
        child = make_issue("Child moves", project_a, workspace, state=src_state, parent=root)

        response = session_client.post(
            move_url(workspace.slug, project_a.id, root.id),
            {"target_project_id": str(project_b.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK, response.data

        root.refresh_from_db()
        child.refresh_from_db()
        grandparent.refresh_from_db()
        sibling.refresh_from_db()
        assert root.parent_id is None
        assert root.project_id == project_b.id
        assert child.parent_id == root.id
        assert child.project_id == project_b.id
        assert grandparent.project_id == project_a.id
        assert sibling.parent_id == grandparent.id
        assert sibling.project_id == project_a.id

    @pytest.mark.django_db
    def test_move_type_remap_to_destination_default(
        self, session_client, workspace, project_a, project_b
    ):
        """An issue type not linked to the destination is reset to the
        destination's default type (REAL-8)."""
        src_type = IssueType.objects.create(workspace=workspace, name="Plan")
        dest_default_type = IssueType.objects.create(workspace=workspace, name="Ticket")
        ProjectIssueType.objects.create(project=project_a, issue_type=src_type)
        ProjectIssueType.objects.create(project=project_b, issue_type=dest_default_type, is_default=True)

        src_state = make_state("Todo", project_a, workspace, group="unstarted")
        root = make_issue("Type remap", project_a, workspace, state=src_state)
        root.type_id = src_type.id
        root.save(update_fields=["type_id"])

        response = session_client.post(
            move_url(workspace.slug, project_a.id, root.id),
            {"target_project_id": str(project_b.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK, response.data
        root.refresh_from_db()
        assert root.type_id == dest_default_type.id

    @pytest.mark.django_db
    def test_move_relations_pruned_and_kept(
        self, session_client, workspace, project_a, project_b
    ):
        """Relations to staying-behind issues are dropped; relations between
        co-moving issues survive under the destination project (REAL-8)."""
        src_state = make_state("Todo", project_a, workspace, group="unstarted")
        root = make_issue("Related root", project_a, workspace, state=src_state)
        child = make_issue("Related child", project_a, workspace, state=src_state, parent=root)
        staying = make_issue("Stays behind", project_a, workspace, state=src_state)
        keep = IssueRelation.objects.create(
            issue=root, related_issue=child, project=project_a, workspace=workspace
        )
        drop = IssueRelation.objects.create(
            issue=root, related_issue=staying, project=project_a, workspace=workspace
        )

        response = session_client.post(
            move_url(workspace.slug, project_a.id, root.id),
            {"target_project_id": str(project_b.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK, response.data

        keep.refresh_from_db()
        assert keep.project_id == project_b.id
        assert not IssueRelation.objects.filter(pk=drop.id).exists()

    @pytest.mark.django_db
    def test_move_drops_cycle_module_membership(
        self, session_client, workspace, project_a, project_b, create_user
    ):
        """Cycle and module bridge rows are removed on move (REAL-8)."""
        cycle = Cycle.objects.create(
            name="Cycle", project=project_a, workspace=workspace, owned_by=create_user, created_by=create_user
        )
        module = Module.objects.create(
            name="Module", project=project_a, workspace=workspace, created_by=create_user
        )
        src_state = make_state("Todo", project_a, workspace, group="unstarted")
        root = make_issue("Bridged", project_a, workspace, state=src_state)
        CycleIssue.objects.create(issue=root, cycle=cycle, project=project_a, workspace=workspace)
        ModuleIssue.objects.create(issue=root, module=module, project=project_a, workspace=workspace)

        response = session_client.post(
            move_url(workspace.slug, project_a.id, root.id),
            {"target_project_id": str(project_b.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK, response.data
        assert not CycleIssue.objects.filter(issue_id=root.id).exists()
        assert not ModuleIssue.objects.filter(issue_id=root.id).exists()

    @pytest.mark.django_db
    def test_move_response_fresh_fields_and_side_effects(
        self, session_client, workspace, project_a, project_b, create_user
    ):
        """The response carries fresh label_ids/assignee_ids, a reset estimate,
        a recomputed sort_order, synced completed_at, and a version row
        (REAL-8; also pins the serializer annotations)."""
        from django.utils import timezone

        dst_done = make_state("Done", project_b, workspace, group="unstarted")
        dst_done_existing = make_issue("Existing done", project_b, workspace, state=dst_done)
        src_done = make_state("Done", project_a, workspace, group="completed")

        root = make_issue("Fresh fields", project_a, workspace, state=src_done)
        root.completed_at = timezone.now()
        estimate = Estimate.objects.create(
            name="Estimate", project=project_a, workspace=workspace, created_by=create_user
        )
        estimate_point = EstimatePoint.objects.create(
            estimate=estimate,
            key=1,
            value="S",
            project=project_a,
            workspace=workspace,
            created_by=create_user,
        )
        root.estimate_point_id = estimate_point.id
        root.save(update_fields=["completed_at", "estimate_point"])

        ws_label = Label.objects.create(workspace=workspace, name="WS2")
        src_label = Label.objects.create(workspace=workspace, project=project_a, name="Src2")
        IssueLabel.objects.create(issue=root, label=ws_label, project=project_a)
        IssueLabel.objects.create(issue=root, label=src_label, project=project_a)

        kept_user = make_user("kept2")
        ProjectMember.objects.create(project=project_b, member=kept_user, role=20, is_active=True)
        IssueAssignee.objects.create(issue=root, assignee=kept_user, project=project_a)

        response = session_client.post(
            move_url(workspace.slug, project_a.id, root.id),
            {"target_project_id": str(project_b.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK, response.data
        data = response.data
        # workspace label kept + source label CLONED into the destination
        cloned_label = Label.objects.get(project_id=project_b.id, name="Src2")
        assert set(data["label_ids"]) == {str(ws_label.id), str(cloned_label.id)}
        assert set(data["assignee_ids"]) == {str(kept_user.id)}
        assert data["estimate_point"] is None
        assert data["moved_ids"] == [str(root.id)]
        assert data["sort_order"] > dst_done_existing.sort_order
        # The annotation mirrors apply_annotations: no children -> NULL
        assert not data["sub_issues_count"]
        assert data["cycle_id"] is None

        root.refresh_from_db()
        assert root.completed_at is None, "completed_at must sync when the state group changes"
        assert root.estimate_point_id is None, "the source estimate point must be reset"
        assert IssueVersion.objects.filter(issue_id=root.id).exists(), "a version row must be written"

    @pytest.mark.django_db
    def test_move_400_same_project(self, session_client, workspace, project_a):
        """Moving a work item into its own project is a 400 (REAL-8)."""
        src_state = make_state("Todo", project_a, workspace, group="unstarted")
        root = make_issue("Same project", project_a, workspace, state=src_state)

        response = session_client.post(
            move_url(workspace.slug, project_a.id, root.id),
            {"target_project_id": str(project_a.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        root.refresh_from_db()
        assert root.project_id == project_a.id

    @pytest.mark.django_db
    def test_move_400_non_uuid_target(self, session_client, workspace, project_a):
        """A non-UUID target_project_id is a 400, not a 500 (REAL-8)."""
        src_state = make_state("Todo", project_a, workspace, group="unstarted")
        root = make_issue("Bad uuid", project_a, workspace, state=src_state)

        response = session_client.post(
            move_url(workspace.slug, project_a.id, root.id),
            {"target_project_id": "not-a-uuid"},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        root.refresh_from_db()
        assert root.project_id == project_a.id

    @pytest.mark.django_db
    def test_move_404_soft_deleted_source(self, session_client, workspace, project_a, project_b):
        """A soft-deleted source work item cannot be moved (404) (REAL-8)."""
        from django.utils import timezone

        src_state = make_state("Todo", project_a, workspace, group="unstarted")
        root = make_issue("Soft deleted", project_a, workspace, state=src_state)
        root.deleted_at = timezone.now()
        root.save(update_fields=["deleted_at"])

        response = session_client.post(
            move_url(workspace.slug, project_a.id, root.id),
            {"target_project_id": str(project_b.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_move_state_fallback_to_destination_default(
        self, session_client, workspace, project_a, project_b
    ):
        """Without a same-name state in the destination, the work item lands
        on the destination default state (REAL-8)."""
        src_state = make_state("Custom Source", project_a, workspace, group="started")
        make_issue("Occupier", project_b, workspace)  # forces dst state usage
        root = make_issue("Fallback", project_a, workspace, state=src_state)

        response = session_client.post(
            move_url(workspace.slug, project_a.id, root.id),
            {"target_project_id": str(project_b.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK, response.data
        root.refresh_from_db()
        dst_default = State.objects.filter(project_id=project_b.id, default=True).first()
        assert root.state_id == dst_default.id

    @pytest.mark.django_db
    def test_move_400_destination_without_states(
        self, session_client, workspace, project_a, project_b
    ):
        """A destination without any non-triage state is a 400 and nothing
        moves (pins the REAL-6 guard)."""
        # project_b fixture creates its default state; remove it.
        State.objects.filter(project_id=project_b.id).delete()

        src_state = make_state("Todo", project_a, workspace, group="unstarted")
        root = make_issue("No dest states", project_a, workspace, state=src_state)

        response = session_client.post(
            move_url(workspace.slug, project_a.id, root.id),
            {"target_project_id": str(project_b.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        root.refresh_from_db()
        assert root.project_id == project_a.id

    @pytest.mark.django_db
    def test_move_moves_soft_deleted_descendants(
        self, session_client, workspace, project_a, project_b
    ):
        """Soft-deleted children move with the subtree (REAL-4): the whole
        tree stays in one project, and each moved issue gets destination
        sequence rows."""
        from django.utils import timezone

        src_state = make_state("Todo", project_a, workspace, group="unstarted")
        root = make_issue("Root", project_a, workspace, state=src_state)
        deleted_child = make_issue("Deleted child", project_a, workspace, state=src_state, parent=root)
        deleted_child.deleted_at = timezone.now()
        deleted_child.save(update_fields=["deleted_at"])
        live_child = make_issue("Live child", project_a, workspace, state=src_state, parent=root)

        response = session_client.post(
            move_url(workspace.slug, project_a.id, root.id),
            {"target_project_id": str(project_b.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK, response.data

        deleted_child.refresh_from_db()
        live_child.refresh_from_db()
        assert deleted_child.project_id == project_b.id
        assert deleted_child.parent_id == root.id
        assert live_child.project_id == project_b.id
        assert IssueSequence.objects.filter(issue_id=deleted_child.id, project_id=project_b.id).exists()

    @pytest.mark.django_db
    def test_move_drops_source_label_on_name_collision(
        self, session_client, workspace, project_a, project_b
    ):
        """When the destination already has a same-named label, the moved
        issues are merged onto that existing label (unique (project, name)
        constraint; the source label row stays behind untouched)."""
        src_label = Label.objects.create(workspace=workspace, project=project_a, name="Collide")
        dest_twin = Label.objects.create(workspace=workspace, project=project_b, name="Collide")

        src_state = make_state("Todo", project_a, workspace, group="unstarted")
        root = make_issue("Collision label", project_a, workspace, state=src_state)
        IssueLabel.objects.create(issue=root, label=src_label, project=project_a)

        response = session_client.post(
            move_url(workspace.slug, project_a.id, root.id),
            {"target_project_id": str(project_b.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK, response.data
        moved_bridge = IssueLabel.objects.filter(issue_id=root.id, label_id=dest_twin.id).first()
        assert moved_bridge is not None
        assert moved_bridge.project_id == project_b.id
        assert not IssueLabel.objects.filter(issue_id=root.id, label_id=src_label.id).exists()
        assert Label.objects.get(pk=src_label.id).project_id == project_a.id

    @pytest.mark.django_db
    def test_move_label_clone_keeps_shared_source_label(
        self, session_client, workspace, project_a, project_b
    ):
        """Cloning a moved item's label must not disturb source issues that
        share it: the stay-behind issue keeps its binding to the original
        label row in the source project."""
        src_state = make_state("Todo", project_a, workspace, group="unstarted")
        root = make_issue("Moves with label", project_a, workspace, state=src_state)
        stays = make_issue("Stays with label", project_a, workspace, state=src_state)
        shared_label = Label.objects.create(workspace=workspace, project=project_a, name="Shared")
        IssueLabel.objects.create(issue=root, label=shared_label, project=project_a)
        IssueLabel.objects.create(issue=stays, label=shared_label, project=project_a)

        response = session_client.post(
            move_url(workspace.slug, project_a.id, root.id),
            {"target_project_id": str(project_b.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK, response.data

        # The moved issue points at a CLONE in the destination project.
        moved_bridge = IssueLabel.objects.filter(issue_id=root.id).first()
        assert moved_bridge is not None
        moved_label = Label.objects.get(pk=moved_bridge.label_id)
        assert moved_label.name == "Shared"
        assert moved_label.project_id == project_b.id
        assert moved_label.pk != shared_label.pk

        # The stay-behind issue keeps its binding to the ORIGINAL label row,
        # still scoped to the source project.
        stays_bridge = IssueLabel.objects.filter(issue_id=stays.id).first()
        assert stays_bridge is not None
        assert stays_bridge.label_id == shared_label.id
        assert Label.objects.get(pk=shared_label.id).project_id == project_a.id
