# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Read-only work item fields sent through ``IntakeIssueViewSet.partial_update`` are
ignored and not recorded as activity."""

import pytest
from rest_framework import status

from plane.celery import app as celery_app
from plane.db.models import Intake, IntakeIssue, Issue, IssueActivity, Project, ProjectMember, State


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
def intake_issue(db, workspace, create_user):
    project = Project.objects.create(
        name="Intake Project", identifier="IP", workspace=workspace, created_by=create_user, intake_view=True
    )
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    State.objects.create(
        name="Triage", color="#000000", group="triage", default=True, project=project, workspace=workspace
    )
    intake = Intake.objects.create(name="Intake", project=project, workspace=workspace, is_default=True)
    issue = Issue.objects.create(name="Intake Issue", project=project, workspace=workspace, created_by=create_user)
    IntakeIssue.objects.create(intake=intake, issue=issue, project=project, workspace=workspace)
    return issue


@pytest.mark.contract
@pytest.mark.django_db
def test_intake_update_ignores_archived_at_and_records_no_archive_activity(session_client, workspace, intake_issue):
    response = session_client.patch(
        f"/api/workspaces/{workspace.slug}/projects/{intake_issue.project_id}/intake-issues/{intake_issue.id}/",
        {"issue": {"name": "Renamed", "archived_at": "2020-01-01"}},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK, response.data
    issue = Issue.all_objects.get(pk=intake_issue.id)
    assert issue.archived_at is None
    assert issue.name == "Renamed"
    activities = IssueActivity.objects.filter(issue_id=intake_issue.id)
    assert activities.filter(field="name").exists()
    assert not activities.filter(field="archived_at").exists()
