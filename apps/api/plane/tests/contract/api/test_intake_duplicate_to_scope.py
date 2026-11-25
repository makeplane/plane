# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""An intake work item can only be marked as a duplicate of a work item of its own project."""

import pytest
from rest_framework import status

from plane.celery import app as celery_app
from plane.db.models import Intake, IntakeIssue, Issue, Project, ProjectMember, Workspace


@pytest.fixture(autouse=True)
def celery_eager():
    """Run the issue activity task in-process; there is no broker in the test stack."""
    original_always_eager = celery_app.conf.task_always_eager
    original_eager_propagates = celery_app.conf.task_eager_propagates
    celery_app.conf.task_always_eager = True
    celery_app.conf.task_eager_propagates = False
    yield
    celery_app.conf.task_always_eager = original_always_eager
    celery_app.conf.task_eager_propagates = original_eager_propagates


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(name="Intake Project", identifier="IP", workspace=workspace, intake_view=True)
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    return project


@pytest.fixture
def intake_issue(project, workspace):
    intake = Intake.objects.create(name="Intake", project=project, workspace=workspace, is_default=True)
    issue = Issue.objects.create(name="Intake Issue", project=project, workspace=workspace)
    return IntakeIssue.objects.create(intake=intake, issue=issue, project=project, workspace=workspace)


@pytest.fixture
def other_project_issue(workspace):
    project = Project.objects.create(name="Other Project", identifier="OTH", workspace=workspace)
    return Issue.objects.create(name="Other project issue", project=project, workspace=workspace)


@pytest.fixture
def other_workspace_issue(create_user):
    workspace = Workspace.objects.create(name="Other Workspace", slug="other-workspace", owner=create_user)
    project = Project.objects.create(name="Foreign Project", identifier="FOR", workspace=workspace)
    return Issue.objects.create(name="Other workspace issue", project=project, workspace=workspace)


def _url(intake_issue):
    slug, project_id, issue_id = intake_issue.workspace.slug, intake_issue.project_id, intake_issue.issue_id
    return f"/api/v1/workspaces/{slug}/projects/{project_id}/intake-issues/{issue_id}/"


@pytest.mark.contract
@pytest.mark.django_db
class TestIntakeDuplicateToScope:
    @pytest.mark.parametrize("issue_fixture", ["other_project_issue", "other_workspace_issue"])
    def test_duplicate_to_outside_the_project_is_rejected(self, request, api_key_client, intake_issue, issue_fixture):
        outside_issue = request.getfixturevalue(issue_fixture)

        response = api_key_client.patch(
            _url(intake_issue), {"status": 2, "duplicate_to": str(outside_issue.id)}, format="json"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST, response.data
        intake_issue.refresh_from_db()
        assert intake_issue.duplicate_to_id is None

    def test_duplicate_to_same_project_is_accepted(self, api_key_client, intake_issue):
        duplicate = Issue.objects.create(
            name="Original issue", project=intake_issue.project, workspace=intake_issue.workspace
        )

        response = api_key_client.patch(
            _url(intake_issue), {"status": 2, "duplicate_to": str(duplicate.id)}, format="json"
        )

        assert response.status_code == status.HTTP_200_OK, response.data
        intake_issue.refresh_from_db()
        assert intake_issue.duplicate_to_id == duplicate.id
