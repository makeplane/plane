# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import Issue, Milestone, MilestoneIssue, Project, ProjectMember
from plane.db.models.api import APIToken


def api_client_for(user):
    token = APIToken.objects.create(user=user, label="Token", token=f"tok-{uuid4().hex[:16]}")
    client = APIClient()
    client.credentials(HTTP_X_API_KEY=token.token)
    return client


def milestones_url(slug, project_id):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/milestones/"


def milestone_detail_url(slug, project_id, milestone_id):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/milestones/{milestone_id}/"


def work_items_url(slug, project_id, milestone_id):
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/milestones/{milestone_id}/work-items/"


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Milestones Project",
        identifier=f"MS{uuid4().hex[:3].upper()}",
        workspace=workspace,
        created_by=create_user,
        is_milestone_enabled=True,
    )
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    return project


@pytest.fixture
def v1(create_user, db):
    return api_client_for(create_user)


def make_issue(project):
    return Issue.objects.create(name=f"I-{uuid4().hex[:4]}", project=project, workspace=project.workspace)


@pytest.mark.contract
class TestMilestonesV1Crud:
    """The SDK/MCP contract: field `title` (NOT name), trailing-slash routes,
    cursor envelope."""

    @pytest.mark.django_db
    def test_create_returns_201_with_title(self, v1, workspace, project):
        response = v1.post(
            milestones_url(workspace.slug, project.id),
            {"title": "V1 milestone", "target_date": "2026-09-30T00:00:00Z"},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["title"] == "V1 milestone"
        assert "name" not in response.data
        for key in ("id", "target_date", "external_source", "external_id", "created_at", "updated_at"):
            assert key in response.data
        assert Milestone.objects.get(pk=response.data["id"]).name == "V1 milestone"

    @pytest.mark.django_db
    def test_create_requires_title(self, v1, workspace, project):
        response = v1.post(milestones_url(workspace.slug, project.id), {"target_date": None}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_list_returns_cursor_envelope(self, v1, workspace, project):
        Milestone.objects.create(name="M1", project=project, workspace=workspace)
        Milestone.objects.create(name="M2", project=project, workspace=workspace)

        response = v1.get(milestones_url(workspace.slug, project.id))

        assert response.status_code == status.HTTP_200_OK
        for key in (
            "grouped_by",
            "total_count",
            "next_cursor",
            "prev_cursor",
            "next_page_results",
            "prev_page_results",
            "count",
            "total_pages",
            "results",
        ):
            assert key in response.data
        assert response.data["total_count"] == 2
        assert {m["title"] for m in response.data["results"]} == {"M1", "M2"}

    @pytest.mark.django_db
    def test_retrieve_patch_delete(self, v1, workspace, project):
        milestone = Milestone.objects.create(name="Before", project=project, workspace=workspace)

        got = v1.get(milestone_detail_url(workspace.slug, project.id, milestone.id))
        assert got.status_code == status.HTTP_200_OK
        assert got.data["title"] == "Before"

        patched = v1.patch(
            milestone_detail_url(workspace.slug, project.id, milestone.id),
            {"title": "After"},
            format="json",
        )
        assert patched.status_code == status.HTTP_200_OK
        assert patched.data["title"] == "After"
        assert Milestone.objects.get(pk=milestone.id).name == "After"

        deleted = v1.delete(milestone_detail_url(workspace.slug, project.id, milestone.id))
        assert deleted.status_code == status.HTTP_204_NO_CONTENT
        assert Milestone.objects.filter(pk=milestone.id).count() == 0

    @pytest.mark.django_db
    def test_external_id_dedup_conflict(self, v1, workspace, project):
        v1.post(
            milestones_url(workspace.slug, project.id),
            {"title": "Ext", "external_source": "jira", "external_id": "J-1"},
            format="json",
        )

        response = v1.post(
            milestones_url(workspace.slug, project.id),
            {"title": "Ext again", "external_source": "jira", "external_id": "J-1"},
            format="json",
        )

        assert response.status_code == status.HTTP_409_CONFLICT

    @pytest.mark.django_db
    def test_writes_gated_when_milestones_disabled(self, v1, workspace, project):
        Project.objects.filter(pk=project.pk).update(is_milestone_enabled=False)

        response = v1.post(milestones_url(workspace.slug, project.id), {"title": "Nope"}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_unauthenticated_rejected(self, workspace, project):
        response = APIClient().get(milestones_url(workspace.slug, project.id))

        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)


@pytest.mark.contract
class TestMilestoneWorkItemsV1:
    @pytest.mark.django_db
    def test_add_list_remove_work_items(self, v1, workspace, project):
        milestone = Milestone.objects.create(name="WI", project=project, workspace=workspace)
        issue_a, issue_b = make_issue(project), make_issue(project)

        added = v1.post(
            work_items_url(workspace.slug, project.id, milestone.id),
            {"issues": [str(issue_a.id), str(issue_b.id), str(issue_a.id)]},
            format="json",
        )
        assert added.status_code == status.HTTP_201_CREATED
        assert MilestoneIssue.objects.filter(milestone=milestone).count() == 2

        listed = v1.get(work_items_url(workspace.slug, project.id, milestone.id))
        assert listed.status_code == status.HTTP_200_OK
        assert listed.data["total_count"] == 2
        row = listed.data["results"][0]
        assert "issue" in row and "milestone" in row

        removed = v1.delete(
            work_items_url(workspace.slug, project.id, milestone.id),
            {"issues": [str(issue_a.id)]},
            format="json",
        )
        assert removed.status_code == status.HTTP_204_NO_CONTENT
        remaining = MilestoneIssue.objects.filter(milestone=milestone)
        assert [str(mi.issue_id) for mi in remaining] == [str(issue_b.id)]

    @pytest.mark.django_db
    def test_add_already_attached_is_ignored(self, v1, workspace, project):
        milestone = Milestone.objects.create(name="Dup", project=project, workspace=workspace)
        issue = make_issue(project)
        MilestoneIssue.objects.create(
            milestone=milestone, issue=issue, project=project, workspace=workspace
        )

        response = v1.post(
            work_items_url(workspace.slug, project.id, milestone.id),
            {"issues": [str(issue.id)]},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data == []
        assert MilestoneIssue.objects.filter(milestone=milestone).count() == 1

    @pytest.mark.django_db
    def test_add_rejects_foreign_project_issue(self, v1, workspace, project, create_user):
        milestone = Milestone.objects.create(name="Iso", project=project, workspace=workspace)
        other_project = Project.objects.create(
            name="Other", identifier=f"O{uuid4().hex[:3].upper()}", workspace=workspace, created_by=create_user
        )
        ProjectMember.objects.create(project=other_project, member=create_user, role=20, is_active=True)
        foreign_issue = make_issue(other_project)

        response = v1.post(
            work_items_url(workspace.slug, project.id, milestone.id),
            {"issues": [str(foreign_issue.id)]},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert MilestoneIssue.objects.filter(milestone=milestone).count() == 0

    @pytest.mark.django_db
    def test_add_rejects_empty_or_malformed_payload(self, v1, workspace, project):
        milestone = Milestone.objects.create(name="Val", project=project, workspace=workspace)

        empty = v1.post(work_items_url(workspace.slug, project.id, milestone.id), {"issues": []}, format="json")
        assert empty.status_code == status.HTTP_400_BAD_REQUEST

        malformed = v1.post(
            work_items_url(workspace.slug, project.id, milestone.id),
            {"issues": ["not-a-uuid"]},
            format="json",
        )
        assert malformed.status_code == status.HTTP_400_BAD_REQUEST
