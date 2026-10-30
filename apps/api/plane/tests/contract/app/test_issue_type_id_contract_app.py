# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for the web (``plane.app``) issue ``type_id`` alias.

The web app sends/reads ``type_id`` while the model field is ``type`` (FK to
``IssueType``). The app issue serializers/endpoints must therefore accept
``type_id`` on create/update and expose it on detail/list reads; otherwise the
default work item type is silently dropped on create and never rendered.
"""

import pytest
from rest_framework import status

from plane.celery import app as celery_app
from plane.db.models import Issue, IssueType, Project, ProjectIssueType, ProjectMember, State

ISSUES_URL = "/api/workspaces/{slug}/projects/{project_id}/issues/"
ISSUE_DETAIL_URL = "/api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/"
ISSUE_LIST_URL = "/api/workspaces/{slug}/projects/{project_id}/issues/list/"


@pytest.fixture(autouse=True)
def celery_eager():
    """Run Celery tasks in-process; there is no broker in the test sandbox."""
    original_always_eager = celery_app.conf.task_always_eager
    original_eager_propagates = celery_app.conf.task_eager_propagates
    celery_app.conf.task_always_eager = True
    celery_app.conf.task_eager_propagates = False
    yield
    celery_app.conf.task_always_eager = original_always_eager
    celery_app.conf.task_eager_propagates = original_eager_propagates


@pytest.fixture
def project(db, workspace, create_user):
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
def issue_type(db, workspace, project):
    issue_type = IssueType.objects.create(name="Task", workspace=workspace, is_default=True)
    ProjectIssueType.objects.create(project=project, issue_type=issue_type, is_default=True)
    return issue_type


@pytest.mark.contract
class TestIssueTypeIdContract:
    @pytest.mark.django_db
    def test_create_with_type_id_persists_and_returns_it(
        self, session_client, workspace, project, issue_type
    ):
        url = ISSUES_URL.format(slug=workspace.slug, project_id=project.id)

        response = session_client.post(
            url, {"name": "New Issue", "type_id": str(issue_type.id)}, format="json"
        )

        assert response.status_code == status.HTTP_201_CREATED, getattr(response, "data", None)
        assert str(response.data["type_id"]) == str(issue_type.id)
        issue = Issue.objects.get(name="New Issue")
        assert str(issue.type_id) == str(issue_type.id)

    @pytest.mark.django_db
    def test_retrieve_exposes_type_id(self, session_client, workspace, project, issue_type, create_user):
        issue = Issue.objects.create(
            name="Existing", project=project, workspace=workspace, type=issue_type
        )
        url = ISSUE_DETAIL_URL.format(slug=workspace.slug, project_id=project.id, issue_id=issue.id)

        response = session_client.get(url)

        assert response.status_code == status.HTTP_200_OK, getattr(response, "data", None)
        assert str(response.data["type_id"]) == str(issue_type.id)

    @pytest.mark.django_db
    def test_list_exposes_type_id(self, session_client, workspace, project, issue_type):
        issue = Issue.objects.create(
            name="Existing", project=project, workspace=workspace, type=issue_type
        )
        url = ISSUE_LIST_URL.format(slug=workspace.slug, project_id=project.id)

        response = session_client.get(url, {"issues": str(issue.id)})

        assert response.status_code == status.HTTP_200_OK, getattr(response, "data", None)
        assert str(response.data[0]["type_id"]) == str(issue_type.id)

    @pytest.mark.django_db
    def test_board_list_exposes_type_id(self, session_client, workspace, project, issue_type):
        issue = Issue.objects.create(
            name="Existing", project=project, workspace=workspace, type=issue_type
        )
        url = ISSUES_URL.format(slug=workspace.slug, project_id=project.id)

        response = session_client.get(url)

        assert response.status_code == status.HTTP_200_OK, getattr(response, "data", None)
        row = next(item for item in response.data["results"] if str(item["id"]) == str(issue.id))
        assert str(row["type_id"]) == str(issue_type.id)
