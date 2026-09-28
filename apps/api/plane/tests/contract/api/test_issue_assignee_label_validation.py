# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from rest_framework import status

from plane.celery import app as celery_app
from plane.db.models import Issue, Label, Project, ProjectMember, State, User


@pytest.fixture(autouse=True)
def celery_eager():
    """
    Run Celery tasks synchronously in-process instead of publishing to a
    broker. There's no RabbitMQ/broker in this local sandbox, and these
    tests only care about the HTTP response contract, not async delivery.
    """
    original = celery_app.conf.task_always_eager
    celery_app.conf.task_always_eager = True
    celery_app.conf.task_eager_propagates = False
    yield
    celery_app.conf.task_always_eager = original


@pytest.fixture
def project(db, workspace, create_user):
    """Create a test project with the user as an admin member and a default state."""
    project = Project.objects.create(
        name="Test Project", identifier="TP", workspace=workspace, created_by=create_user
    )
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    State.objects.create(
        name="Backlog",
        color="#000000",
        group="backlog",
        default=True,
        project=project,
        workspace=workspace,
        created_by=create_user,
    )
    return project


@pytest.fixture
def create_issue(db, project, workspace, create_user):
    return Issue.objects.create(name="Existing Issue", project=project, workspace=workspace, created_by=create_user)


@pytest.fixture
def outsider_user(db):
    """A user who exists in the workspace/system but is NOT a member of `project`."""
    user = User.objects.create(email="outsider@plane.so", username="outsider-user")
    user.set_password("outsider-password")
    user.save()
    return user


@pytest.mark.contract
class TestIssueAssigneeLabelValidationContract:
    """
    Contract: creating/updating a work item through the external REST API
    (``/api/v1/...``) must reject assignee/label ids that don't belong to the
    project with a 400, instead of silently dropping them and returning
    200/201. See makeplane/plane#9517.
    """

    def get_list_url(self, workspace_slug, project_id):
        return f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}/issues/"

    def get_detail_url(self, workspace_slug, project_id, issue_id):
        return f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/"

    @pytest.mark.django_db
    def test_create_with_non_member_assignee_is_rejected(self, api_key_client, workspace, project, outsider_user):
        url = self.get_list_url(workspace.slug, project.id)

        response = api_key_client.post(
            url, {"name": "New Issue", "assignees": [str(outsider_user.id)]}, format="json"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert not Issue.objects.filter(name="New Issue").exists()

    @pytest.mark.django_db
    def test_create_with_foreign_label_is_rejected(self, api_key_client, workspace, project):
        other_project = Project.objects.create(name="Other", identifier="OTH", workspace=workspace)
        foreign_label = Label.objects.create(name="Foreign", project=other_project)

        url = self.get_list_url(workspace.slug, project.id)
        response = api_key_client.post(
            url, {"name": "New Issue", "labels": [str(foreign_label.id)]}, format="json"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert not Issue.objects.filter(name="New Issue").exists()

    @pytest.mark.django_db
    def test_update_with_non_member_assignee_is_rejected_and_leaves_assignees_unchanged(
        self, api_key_client, workspace, project, create_issue, outsider_user
    ):
        url = self.get_detail_url(workspace.slug, project.id, create_issue.id)

        response = api_key_client.patch(url, {"assignees": [str(outsider_user.id)]}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert list(create_issue.assignees.all()) == []

    @pytest.mark.django_db
    def test_create_with_mix_of_valid_and_invalid_assignee_is_rejected_entirely(
        self, api_key_client, workspace, project, create_user, outsider_user
    ):
        """A partially-valid list must reject the whole request, not silently keep only the valid id."""
        url = self.get_list_url(workspace.slug, project.id)

        response = api_key_client.post(
            url,
            {"name": "New Issue", "assignees": [str(create_user.id), str(outsider_user.id)]},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert not Issue.objects.filter(name="New Issue").exists()

    @pytest.mark.django_db
    def test_create_with_valid_assignee_still_works(self, api_key_client, workspace, project, create_user):
        """Regression guard: a genuinely valid project member must still be assignable."""
        url = self.get_list_url(workspace.slug, project.id)

        response = api_key_client.post(
            url, {"name": "New Issue", "assignees": [str(create_user.id)]}, format="json"
        )

        assert response.status_code == status.HTTP_201_CREATED
        issue = Issue.objects.get(name="New Issue")
        assert list(issue.assignees.values_list("id", flat=True)) == [create_user.id]
