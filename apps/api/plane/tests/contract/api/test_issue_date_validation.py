# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import date
from unittest import mock

import pytest
from rest_framework import status

from plane.db.models import Issue, Project, ProjectMember, State


@pytest.fixture
def scheduled_issue(db, workspace, create_user):
    project = Project.objects.create(name="Test Project", identifier="TP", workspace=workspace)
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    state = State.objects.create(name="Todo", project=project, workspace=workspace, group="backlog", default=True)
    return Issue.objects.create(
        name="Scheduled work item",
        project=project,
        workspace=workspace,
        state=state,
        created_by=create_user,
        start_date=date(2026, 1, 10),
        target_date=date(2026, 1, 20),
    )


@pytest.fixture(params=["public-api", "app-api"])
def endpoint(request, workspace, scheduled_issue):
    project_path = f"workspaces/{workspace.slug}/projects/{scheduled_issue.project_id}"
    if request.param == "public-api":
        client = request.getfixturevalue("api_key_client")
        url = f"/api/v1/{project_path}/work-items/{scheduled_issue.id}/"
        success_status = status.HTTP_200_OK
    else:
        client = request.getfixturevalue("api_client")
        client.force_login(request.getfixturevalue("create_user"))
        url = f"/api/{project_path}/issues/{scheduled_issue.id}/"
        success_status = status.HTTP_204_NO_CONTENT
    return client, url, success_status


@pytest.fixture(autouse=True)
def mock_deferred_tasks():
    """Keep activity/webhook delivery outside these request and persistence tests."""
    with (
        mock.patch("plane.api.views.issue.issue_activity.delay"),
        mock.patch("plane.api.views.issue.model_activity.delay"),
        mock.patch("plane.app.views.issue.base.issue_description_version_task.delay"),
    ):
        yield


@pytest.mark.contract
@pytest.mark.django_db
class TestIssueDateValidation:
    @pytest.mark.parametrize("dates", [{"start_date": "2026-01-21"}, {"target_date": "2026-01-09"}])
    def test_invalid_partial_date_update_does_not_change_work_item(self, endpoint, scheduled_issue, dates):
        client, url, _ = endpoint
        updated_at = scheduled_issue.updated_at

        response = client.patch(url, {"name": "Should not be saved", **dates}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data == {"non_field_errors": ["Start date cannot exceed target date"]}
        scheduled_issue.refresh_from_db()
        assert scheduled_issue.name == "Scheduled work item"
        assert scheduled_issue.start_date == date(2026, 1, 10)
        assert scheduled_issue.target_date == date(2026, 1, 20)
        assert scheduled_issue.updated_at == updated_at

    def test_valid_partial_date_update_and_clearing_date_are_persisted(self, endpoint, scheduled_issue):
        client, url, success_status = endpoint

        response = client.patch(url, {"start_date": "2026-01-20"}, format="json")

        assert response.status_code == success_status
        scheduled_issue.refresh_from_db()
        assert scheduled_issue.start_date == date(2026, 1, 20)
        assert scheduled_issue.target_date == date(2026, 1, 20)

        response = client.patch(url, {"target_date": None}, format="json")

        assert response.status_code == success_status
        scheduled_issue.refresh_from_db()
        assert scheduled_issue.start_date == date(2026, 1, 20)
        assert scheduled_issue.target_date is None
