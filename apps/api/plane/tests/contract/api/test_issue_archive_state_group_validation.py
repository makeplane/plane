# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from django.utils import timezone
from rest_framework import status

from plane.celery import app as celery_app
from plane.db.models import Issue, Project, ProjectMember, State


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
    """Create a test project with the user as an admin member and a default backlog state."""
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
def backlog_state(db, project):
    return State.objects.get(project=project, group="backlog")


@pytest.fixture
def completed_state(db, project, workspace, create_user):
    return State.objects.create(
        name="Done",
        color="#000000",
        group="completed",
        default=True,
        project=project,
        workspace=workspace,
        created_by=create_user,
    )


@pytest.fixture
def backlog_issue(db, project, workspace, create_user, backlog_state):
    return Issue.objects.create(
        name="Backlog Issue",
        project=project,
        workspace=workspace,
        state=backlog_state,
        created_by=create_user,
    )


@pytest.fixture
def completed_issue(db, project, workspace, create_user, completed_state):
    return Issue.objects.create(
        name="Completed Issue",
        project=project,
        workspace=workspace,
        state=completed_state,
        created_by=create_user,
    )


@pytest.mark.contract
class TestIssueArchiveStateGroupValidationContract:
    """
    Contract: ``archived_at`` sent directly to the external REST API
    (``/api/v1/...``) must be validated against the state group, exactly like
    the dedicated archive/bulk-archive endpoints do, instead of silently
    archiving work items that are still in progress. See makeplane/plane#9115.
    """

    def get_list_url(self, workspace_slug, project_id):
        return f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}/issues/"

    def get_detail_url(self, workspace_slug, project_id, issue_id):
        return f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/"

    @pytest.mark.django_db
    def test_patch_archived_at_on_backlog_issue_is_rejected(
        self, api_key_client, workspace, project, backlog_issue
    ):
        url = self.get_detail_url(workspace.slug, project.id, backlog_issue.id)

        response = api_key_client.patch(
            url, {"archived_at": timezone.now().date().isoformat()}, format="json"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "archived_at" in response.data
        backlog_issue.refresh_from_db()
        assert backlog_issue.archived_at is None

    @pytest.mark.django_db
    def test_patch_archived_at_on_completed_issue_is_allowed(
        self, api_key_client, workspace, project, completed_issue
    ):
        url = self.get_detail_url(workspace.slug, project.id, completed_issue.id)

        response = api_key_client.patch(
            url, {"archived_at": timezone.now().date().isoformat()}, format="json"
        )

        assert response.status_code == status.HTTP_200_OK
        completed_issue.refresh_from_db()
        assert completed_issue.archived_at is not None

    @pytest.mark.django_db
    def test_patch_archived_at_together_with_state_change_is_allowed(
        self, api_key_client, workspace, project, backlog_issue, completed_state
    ):
        """Moving to a completed state and archiving in the same request is valid."""
        url = self.get_detail_url(workspace.slug, project.id, backlog_issue.id)

        response = api_key_client.patch(
            url,
            {"state": str(completed_state.id), "archived_at": timezone.now().date().isoformat()},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        backlog_issue.refresh_from_db()
        assert backlog_issue.archived_at is not None
        assert backlog_issue.state.group == "completed"

    @pytest.mark.django_db
    def test_patch_archived_at_null_unarchives(self, api_key_client, workspace, project, completed_issue):
        Issue.objects.filter(id=completed_issue.id).update(archived_at=timezone.now().date())
        url = self.get_detail_url(workspace.slug, project.id, completed_issue.id)

        response = api_key_client.patch(url, {"archived_at": None}, format="json")

        assert response.status_code == status.HTTP_200_OK
        completed_issue.refresh_from_db()
        assert completed_issue.archived_at is None

    @pytest.mark.django_db
    def test_create_with_archived_at_on_backlog_state_is_rejected(
        self, api_key_client, workspace, project, backlog_state
    ):
        url = self.get_list_url(workspace.slug, project.id)

        response = api_key_client.post(
            url,
            {
                "name": "New Issue",
                "state": str(backlog_state.id),
                "archived_at": timezone.now().date().isoformat(),
            },
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "archived_at" in response.data
        assert not Issue.objects.filter(name="New Issue").exists()

    @pytest.mark.django_db
    def test_create_with_archived_at_on_completed_state_still_works(
        self, api_key_client, workspace, project, completed_state
    ):
        """Regression guard: creating an already-archived completed item remains valid."""
        url = self.get_list_url(workspace.slug, project.id)

        response = api_key_client.post(
            url,
            {
                "name": "Archived Completed Issue",
                "state": str(completed_state.id),
                "archived_at": timezone.now().date().isoformat(),
            },
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        issue = Issue.objects.get(name="Archived Completed Issue")
        assert issue.archived_at is not None
