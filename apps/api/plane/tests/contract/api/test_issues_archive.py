# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from rest_framework import status

from plane.db.models import Issue, Project, ProjectMember, State


@pytest.fixture
def project(db, workspace, create_user):
    """Create a test project with the requesting user as an active member."""
    project = Project.objects.create(
        name="Test Project",
        identifier="TP",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(
        project=project,
        member=create_user,
        role=20,  # Admin
        is_active=True,
    )
    return project


@pytest.fixture
def backlog_state(db, workspace, project):
    return State.objects.create(
        name="Todo",
        project=project,
        workspace=workspace,
        group="backlog",
        default=True,
    )


@pytest.fixture
def completed_state(db, workspace, project):
    return State.objects.create(
        name="Done",
        project=project,
        workspace=workspace,
        group="completed",
    )


@pytest.fixture
def completed_issue(db, workspace, project, completed_state, create_user):
    return Issue.objects.create(
        name="Completed Issue",
        workspace=workspace,
        project=project,
        state=completed_state,
        created_by=create_user,
    )


@pytest.fixture
def backlog_issue(db, workspace, project, backlog_state, create_user):
    return Issue.objects.create(
        name="Backlog Issue",
        workspace=workspace,
        project=project,
        state=backlog_state,
        created_by=create_user,
    )


@pytest.mark.contract
class TestIssueArchiveUnarchiveAPIEndpoint:
    """Contract tests for work item archive / unarchive / archived list.

    POST   /api/v1/workspaces/{slug}/projects/{project_id}/work-items/{pk}/archive/
    DELETE /api/v1/workspaces/{slug}/projects/{project_id}/work-items/{pk}/unarchive/
    GET    /api/v1/workspaces/{slug}/projects/{project_id}/archived-work-items/

    (plus the deprecated /issues/-prefixed aliases)
    """

    def archive_url(self, slug, project_id, pk, prefix="work-items"):
        return f"/api/v1/workspaces/{slug}/projects/{project_id}/{prefix}/{pk}/archive/"

    def unarchive_url(self, slug, project_id, pk, prefix="work-items"):
        return f"/api/v1/workspaces/{slug}/projects/{project_id}/{prefix}/{pk}/unarchive/"

    def archived_list_url(self, slug, project_id, prefix="archived-work-items"):
        return f"/api/v1/workspaces/{slug}/projects/{project_id}/{prefix}/"

    def test_archive_completed_issue(self, api_key_client, workspace, project, completed_issue):
        url = self.archive_url(workspace.slug, project.id, completed_issue.id)
        response = api_key_client.post(url, {}, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data.get("archived_at")
        completed_issue.refresh_from_db()
        assert completed_issue.archived_at is not None

    def test_archive_requires_terminal_state_group(self, api_key_client, workspace, project, backlog_issue):
        url = self.archive_url(workspace.slug, project.id, backlog_issue.id)
        response = api_key_client.post(url, {}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        backlog_issue.refresh_from_db()
        assert backlog_issue.archived_at is None

    def test_archive_nonexistent_issue_returns_404(self, api_key_client, workspace, project):
        url = self.archive_url(workspace.slug, project.id, "00000000-0000-0000-0000-000000000000")
        response = api_key_client.post(url, {}, format="json")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_archived_issue_leaves_active_list_and_shows_in_archived_list(
        self, api_key_client, workspace, project, completed_issue
    ):
        archive = self.archive_url(workspace.slug, project.id, completed_issue.id)
        assert api_key_client.post(archive, {}, format="json").status_code == status.HTTP_200_OK

        active = api_key_client.get(
            f"/api/v1/workspaces/{workspace.slug}/projects/{project.id}/work-items/"
        )
        assert active.status_code == status.HTTP_200_OK
        assert str(completed_issue.id) not in [str(i["id"]) for i in active.data["results"]]

        archived = api_key_client.get(self.archived_list_url(workspace.slug, project.id))
        assert archived.status_code == status.HTTP_200_OK
        assert str(completed_issue.id) in [str(i["id"]) for i in archived.data["results"]]

    def test_archive_already_archived_returns_404(self, api_key_client, workspace, project, completed_issue):
        url = self.archive_url(workspace.slug, project.id, completed_issue.id)
        assert api_key_client.post(url, {}, format="json").status_code == status.HTTP_200_OK
        # Issue.issue_objects excludes archived issues, so a second archive is a 404.
        assert api_key_client.post(url, {}, format="json").status_code == status.HTTP_404_NOT_FOUND

    def test_unarchive_restores_issue(self, api_key_client, workspace, project, completed_issue):
        archive = self.archive_url(workspace.slug, project.id, completed_issue.id)
        assert api_key_client.post(archive, {}, format="json").status_code == status.HTTP_200_OK

        unarchive = self.unarchive_url(workspace.slug, project.id, completed_issue.id)
        response = api_key_client.delete(unarchive)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        completed_issue.refresh_from_db()
        assert completed_issue.archived_at is None

    def test_unarchive_active_issue_returns_404(self, api_key_client, workspace, project, completed_issue):
        url = self.unarchive_url(workspace.slug, project.id, completed_issue.id)
        response = api_key_client.delete(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_deprecated_issues_prefix_aliases(self, api_key_client, workspace, project, completed_issue):
        url = self.archive_url(workspace.slug, project.id, completed_issue.id, prefix="issues")
        assert api_key_client.post(url, {}, format="json").status_code == status.HTTP_200_OK

        archived = api_key_client.get(
            self.archived_list_url(workspace.slug, project.id, prefix="archived-issues")
        )
        assert archived.status_code == status.HTTP_200_OK
        assert str(completed_issue.id) in [str(i["id"]) for i in archived.data["results"]]

        unarchive = self.unarchive_url(workspace.slug, project.id, completed_issue.id, prefix="issues")
        assert api_key_client.delete(unarchive).status_code == status.HTTP_204_NO_CONTENT
