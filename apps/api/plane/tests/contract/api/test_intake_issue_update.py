# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from rest_framework import status

from plane.celery import app as celery_app
from plane.db.models import Intake, IntakeIssue, Issue, Label, Project, ProjectMember, State


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
    project = Project.objects.create(
        name="Intake Project", identifier="IP", workspace=workspace, created_by=create_user, intake_view=True
    )
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    State.objects.create(
        name="Triage",
        color="#000000",
        group="triage",
        default=True,
        project=project,
        workspace=workspace,
        created_by=create_user,
    )
    return project


@pytest.fixture
def intake_issue(db, project, workspace, create_user):
    intake = Intake.objects.create(name="Intake", project=project, workspace=workspace, is_default=True)
    issue = Issue.objects.create(name="Intake Issue", project=project, workspace=workspace, created_by=create_user)
    IntakeIssue.objects.create(intake=intake, issue=issue, project=project, workspace=workspace)
    return issue


@pytest.mark.contract
class TestIntakeIssueUpdateContract:
    """
    Contract: updating the work item behind an intake issue through the external
    REST API validates assignees/labels against the intake's project, so
    in-project ids are accepted and foreign ids are rejected.
    """

    def get_detail_url(self, workspace_slug, project_id, issue_id):
        return f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}/intake-issues/{issue_id}/"

    @pytest.mark.django_db
    def test_update_with_project_assignee_and_label_succeeds(
        self, api_key_client, workspace, project, intake_issue, create_user
    ):
        label = Label.objects.create(name="Bug", project=project, workspace=workspace)
        url = self.get_detail_url(workspace.slug, project.id, intake_issue.id)

        response = api_key_client.patch(
            url,
            {"issue": {"assignees": [str(create_user.id)], "labels": [str(label.id)]}},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK, response.data
        assert list(intake_issue.assignees.values_list("id", flat=True)) == [create_user.id]
        assert list(intake_issue.labels.values_list("id", flat=True)) == [label.id]

    @pytest.mark.django_db
    def test_update_with_foreign_label_is_rejected(self, api_key_client, workspace, project, intake_issue):
        other_project = Project.objects.create(name="Other", identifier="OTH", workspace=workspace)
        foreign_label = Label.objects.create(name="Foreign", project=other_project, workspace=workspace)
        url = self.get_detail_url(workspace.slug, project.id, intake_issue.id)

        response = api_key_client.patch(url, {"issue": {"labels": [str(foreign_label.id)]}}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert list(intake_issue.labels.all()) == []
