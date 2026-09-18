# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from unittest.mock import patch

import pytest
from rest_framework import status

from plane.db.models import Issue, Project, ProjectMember, State, User


@pytest.fixture
def project(db, workspace, create_user):
    """Create a test project with the user as an admin member and a default state."""
    project = Project.objects.create(
        name="Test Project",
        identifier="TP",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(
        project=project,
        member=create_user,
        role=20,  # Admin role
        is_active=True,
    )
    # A default state is required to create work items through the API
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
    """Create an existing work item to update/assign in tests."""
    return Issue.objects.create(
        name="Existing Issue",
        project=project,
        workspace=workspace,
        created_by=create_user,
    )


@pytest.fixture
def assignee_user(db):
    """Create a second user that can be assigned to a work item."""
    user = User.objects.create(
        email="assignee@plane.so",
        username="assignee-user",
        first_name="Assignee",
        last_name="User",
    )
    user.set_password("assignee-password")
    user.save()
    return user


@pytest.mark.contract
class TestIssueNotificationContract:
    """
    Contract: creating and updating/assigning a work item through the external
    REST API (``/api/v1/...``) must trigger notifications, i.e. ``issue_activity``
    is dispatched with ``notification=True`` so subscribers and assignees are
    notified the same way the web app does. See makeplane/plane#9306.
    """

    def get_list_url(self, workspace_slug, project_id):
        """Helper to build the work item list/create endpoint URL."""
        return f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}/issues/"

    def get_detail_url(self, workspace_slug, project_id, issue_id):
        """Helper to build the work item detail endpoint URL."""
        return f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/"

    @pytest.mark.django_db
    def test_create_issue_triggers_notification(self, api_key_client, workspace, project):
        """Creating a work item via the external API dispatches a notifying activity."""
        url = self.get_list_url(workspace.slug, project.id)

        with patch("plane.api.views.issue.issue_activity") as mock_issue_activity:
            response = api_key_client.post(url, {"name": "New Issue"}, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert Issue.objects.filter(name="New Issue").exists()

        mock_issue_activity.delay.assert_called_once()
        kwargs = mock_issue_activity.delay.call_args.kwargs
        assert kwargs["type"] == "issue.activity.created"
        assert kwargs["notification"] is True

    @pytest.mark.django_db
    def test_update_issue_triggers_notification(self, api_key_client, workspace, project, create_issue):
        """Updating a work item via the external API dispatches a notifying activity."""
        url = self.get_detail_url(workspace.slug, project.id, create_issue.id)

        with patch("plane.api.views.issue.issue_activity") as mock_issue_activity:
            response = api_key_client.patch(url, {"name": "Renamed Issue"}, format="json")

        assert response.status_code == status.HTTP_200_OK
        create_issue.refresh_from_db()
        assert create_issue.name == "Renamed Issue"

        mock_issue_activity.delay.assert_called_once()
        kwargs = mock_issue_activity.delay.call_args.kwargs
        assert kwargs["type"] == "issue.activity.updated"
        assert kwargs["notification"] is True

    @pytest.mark.django_db
    def test_assign_issue_triggers_notification(self, api_key_client, workspace, project, create_issue, assignee_user):
        """Assigning a work item via the external API dispatches a notifying activity."""
        ProjectMember.objects.create(
            project=project,
            member=assignee_user,
            role=15,  # Member role
            is_active=True,
        )
        url = self.get_detail_url(workspace.slug, project.id, create_issue.id)

        with patch("plane.api.views.issue.issue_activity") as mock_issue_activity:
            response = api_key_client.patch(url, {"assignees": [str(assignee_user.id)]}, format="json")

        assert response.status_code == status.HTTP_200_OK

        mock_issue_activity.delay.assert_called_once()
        kwargs = mock_issue_activity.delay.call_args.kwargs
        assert kwargs["type"] == "issue.activity.updated"
        assert kwargs["notification"] is True
