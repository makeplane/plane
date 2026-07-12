# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from uuid import uuid4

import pytest
from rest_framework import status

from plane.db.models import (
    Issue,
    Milestone,
    MilestoneIssue,
    Project,
    ProjectMember,
    State,
    User,
    WorkspaceMember,
)


def make_user(email=None, role_ws=None, workspace=None, project=None, role_project=15):
    user = User.objects.create_user(
        email=email or f"{uuid4().hex[:12]}@example.com",
        username=f"u-{uuid4().hex[:12]}",
    )
    if workspace is not None:
        WorkspaceMember.objects.create(
            workspace=workspace, member=user, role=role_ws if role_ws is not None else 15, is_active=True
        )
    if project is not None:
        ProjectMember.objects.create(project=project, member=user, role=role_project, is_active=True)
    return user


def milestones_url(slug, project_id):
    return f"/api/workspaces/{slug}/projects/{project_id}/milestones/"


def milestone_detail_url(slug, project_id, pk):
    return f"/api/workspaces/{slug}/projects/{project_id}/milestones/{pk}/"


def milestone_issues_url(slug, project_id, milestone_id):
    return f"/api/workspaces/{slug}/projects/{project_id}/milestones/{milestone_id}/milestone-issues/"


def milestone_issue_detail_url(slug, project_id, milestone_id, issue_id):
    return f"/api/workspaces/{slug}/projects/{project_id}/milestones/{milestone_id}/milestone-issues/{issue_id}/"


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Milestones App Project",
        identifier=f"MA{uuid4().hex[:3].upper()}",
        workspace=workspace,
        created_by=create_user,
        is_milestone_enabled=True,
    )
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    return project


def make_issue(project, state_group=None):
    state = None
    if state_group:
        state = State.objects.filter(project=project, group=state_group).first() or State.objects.create(
            name=f"{state_group}-{uuid4().hex[:4]}",
            color="#000",
            project=project,
            workspace=project.workspace,
            group=state_group,
        )
    return Issue.objects.create(
        name=f"I-{uuid4().hex[:4]}", project=project, workspace=project.workspace, state=state
    )


@pytest.mark.contract
class TestMilestonesAppCrud:
    @pytest.mark.django_db
    def test_create_and_list_with_counters(self, session_client, workspace, project):
        created = session_client.post(
            milestones_url(workspace.slug, project.id),
            {"name": "App milestone", "target_date": "2026-10-01T00:00:00Z", "description": "d"},
            format="json",
        )
        assert created.status_code == status.HTTP_201_CREATED
        milestone_id = created.data["id"]

        milestone = Milestone.objects.get(pk=milestone_id)
        done = make_issue(project, "completed")
        todo = make_issue(project, "backlog")
        for issue in (done, todo):
            MilestoneIssue.objects.create(
                milestone=milestone, issue=issue, project=project, workspace=workspace
            )

        listed = session_client.get(milestones_url(workspace.slug, project.id))
        assert listed.status_code == status.HTTP_200_OK
        row = next(m for m in listed.data if m["id"] == milestone_id)
        assert row["total_issues"] == 2
        assert row["completed_issues"] == 1

    @pytest.mark.django_db
    def test_writes_gated_when_disabled(self, session_client, workspace, project):
        Project.objects.filter(pk=project.pk).update(is_milestone_enabled=False)

        response = session_client.post(
            milestones_url(workspace.slug, project.id), {"name": "Nope"}, format="json"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_guest_can_read_but_not_write(self, session_client, workspace, project, create_user):
        milestone = Milestone.objects.create(name="G", project=project, workspace=workspace)
        guest = make_user(workspace=workspace, role_ws=5, project=project, role_project=5)
        session_client.force_authenticate(user=guest)

        listed = session_client.get(milestones_url(workspace.slug, project.id))
        assert listed.status_code == status.HTTP_200_OK
        assert [str(m["id"]) for m in listed.data] == [str(milestone.id)]

        created = session_client.post(
            milestones_url(workspace.slug, project.id), {"name": "Guest try"}, format="json"
        )
        assert created.status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_400_BAD_REQUEST)
        assert Milestone.objects.filter(project=project).count() == 1

    @pytest.mark.django_db
    def test_non_member_cannot_read(self, session_client, workspace, project, create_user):
        Milestone.objects.create(name="Hidden", project=project, workspace=workspace)
        outsider = make_user(workspace=workspace)
        session_client.force_authenticate(user=outsider)

        response = session_client.get(milestones_url(workspace.slug, project.id))

        assert response.status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND)

    @pytest.mark.django_db
    def test_update_and_destroy(self, session_client, workspace, project):
        milestone = Milestone.objects.create(name="Old", project=project, workspace=workspace)

        patched = session_client.patch(
            milestone_detail_url(workspace.slug, project.id, milestone.id),
            {"name": "New"},
            format="json",
        )
        assert patched.status_code == status.HTTP_200_OK
        assert Milestone.objects.get(pk=milestone.id).name == "New"

        deleted = session_client.delete(milestone_detail_url(workspace.slug, project.id, milestone.id))
        assert deleted.status_code == status.HTTP_204_NO_CONTENT


@pytest.mark.contract
class TestMilestoneIssuesApp:
    @pytest.mark.django_db
    def test_attach_list_detach(self, session_client, workspace, project):
        milestone = Milestone.objects.create(name="Links", project=project, workspace=workspace)
        issue_a, issue_b = make_issue(project), make_issue(project)

        added = session_client.post(
            milestone_issues_url(workspace.slug, project.id, milestone.id),
            {"issues": [str(issue_a.id), str(issue_b.id)]},
            format="json",
        )
        assert added.status_code == status.HTTP_201_CREATED
        assert MilestoneIssue.objects.filter(milestone=milestone).count() == 2

        listed = session_client.get(milestone_issues_url(workspace.slug, project.id, milestone.id))
        assert listed.status_code == status.HTTP_200_OK
        assert len(listed.data) == 2
        # the work item is expanded inline (name/sequence_id), not a bare UUID
        row = listed.data[0]
        assert "issue_detail" in row
        assert row["issue_detail"]["name"] in {issue_a.name, issue_b.name}
        assert "sequence_id" in row["issue_detail"]

        removed = session_client.delete(
            milestone_issue_detail_url(workspace.slug, project.id, milestone.id, issue_a.id)
        )
        assert removed.status_code == status.HTTP_204_NO_CONTENT
        assert [str(mi.issue_id) for mi in MilestoneIssue.objects.filter(milestone=milestone)] == [
            str(issue_b.id)
        ]

    @pytest.mark.django_db
    def test_attach_rejects_foreign_issue(self, session_client, workspace, project, create_user):
        milestone = Milestone.objects.create(name="Iso", project=project, workspace=workspace)
        other = Project.objects.create(
            name="Other", identifier=f"OA{uuid4().hex[:3].upper()}", workspace=workspace, created_by=create_user
        )
        ProjectMember.objects.create(project=other, member=create_user, role=20, is_active=True)
        foreign = make_issue(other)

        response = session_client.post(
            milestone_issues_url(workspace.slug, project.id, milestone.id),
            {"issues": [str(foreign.id)]},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert MilestoneIssue.objects.filter(milestone=milestone).count() == 0

    @pytest.mark.django_db
    def test_attach_non_dict_body_returns_400_not_500(self, session_client, workspace, project):
        # Top-level JSON array body -> clean 400, never a 500 (review finding BK-1).
        milestone = Milestone.objects.create(name="NonDict", project=project, workspace=workspace)
        response = session_client.post(
            milestone_issues_url(workspace.slug, project.id, milestone.id),
            ["some-uuid"],
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.contract
class TestMilestoneWriteSerializerHardening:
    """PATCH must not let a member reassign audit fields, soft-delete or reorder
    a milestone via mass-assignment (review finding SEC-ms-1)."""

    @pytest.mark.django_db
    def test_patch_ignores_audit_softdelete_and_sort_order(self, session_client, workspace, project, create_user):
        milestone = Milestone.objects.create(name="M", project=project, workspace=workspace)
        original_created_by = milestone.created_by_id
        stranger = make_user(workspace=workspace)

        response = session_client.patch(
            milestone_detail_url(workspace.slug, project.id, milestone.id),
            {
                "name": "Renamed",
                "created_by": str(stranger.id),
                "deleted_at": "2020-01-01T00:00:00Z",
                "sort_order": 1.0,
            },
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        milestone.refresh_from_db()
        assert milestone.name == "Renamed"
        assert milestone.created_by_id == original_created_by
        assert milestone.deleted_at is None
        assert milestone.sort_order != 1.0
