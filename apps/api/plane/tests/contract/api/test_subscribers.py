# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from uuid import uuid4

from rest_framework import status

from plane.db.models import (
    Issue,
    IssueSubscriber,
    Project,
    ProjectMember,
    State,
    User,
    WorkspaceMember,
)


@pytest.fixture
def project(db, workspace, create_user):
    """Create a test project with the requesting user as an active admin member."""
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
def state(db, workspace, project):
    return State.objects.create(
        name="Todo",
        project=project,
        workspace=workspace,
        group="backlog",
        default=True,
    )


@pytest.fixture
def issue(db, workspace, project, state, create_user):
    return Issue.objects.create(
        name="Test Issue",
        workspace=workspace,
        project=project,
        state=state,
        created_by=create_user,
    )


@pytest.fixture
def member_user(db, workspace, project):
    """A second user who is an active member of the workspace and project."""
    user = User.objects.create(
        email="member@plane.so",
        username="subscriber-member",
        first_name="Member",
        last_name="User",
    )
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=15)
    ProjectMember.objects.create(project=project, member=user, role=15, is_active=True)
    return user


@pytest.fixture
def non_member_user(db):
    """A user who is not a member of the workspace/project."""
    return User.objects.create(
        email="outsider@plane.so",
        username="subscriber-outsider",
        first_name="Out",
        last_name="Sider",
    )


@pytest.mark.contract
class TestIssueSubscriberListCreateAPIEndpoint:
    """Test the public work-item subscriber (watcher) list/create endpoint."""

    def get_url(self, workspace_slug, project_id, issue_id):
        return f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}/work-items/{issue_id}/subscribers/"

    @pytest.mark.django_db
    def test_list_subscribers_empty(self, api_key_client, workspace, project, issue):
        """A work item with no subscribers returns an empty paginated list."""
        url = self.get_url(workspace.slug, project.id, issue.id)
        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert "results" in response.data
        assert response.data["results"] == []

    @pytest.mark.django_db
    def test_list_subscribers_issue_not_found(self, api_key_client, workspace, project):
        """Listing subscribers of a non-existent work item returns a 404,
        not a misleading empty list (mirrors add/remove)."""
        url = self.get_url(workspace.slug, project.id, uuid4())
        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_list_subscribers_returns_subscribers(self, api_key_client, workspace, project, issue, member_user):
        """Listing returns the subscribers with the embedded user under ``member``."""
        IssueSubscriber.objects.create(issue=issue, subscriber=member_user, project=project)

        url = self.get_url(workspace.slug, project.id, issue.id)
        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1
        result = response.data["results"][0]
        assert str(result["subscriber"]) == str(member_user.id)
        assert str(result["member"]["id"]) == str(member_user.id)
        assert result["member"]["email"] == member_user.email

    @pytest.mark.django_db
    def test_list_subscribers_expand_member_preserved(self, api_key_client, workspace, project, issue, member_user):
        """``expand=member`` must keep the embedded subscriber profile.

        ``member`` is not a real relation on IssueSubscriber, so the generic
        expansion fallback would otherwise overwrite it with a non-existent
        ``member_id`` (``None``). It must stay the UserLite profile.
        """
        IssueSubscriber.objects.create(issue=issue, subscriber=member_user, project=project)

        url = self.get_url(workspace.slug, project.id, issue.id)
        response = api_key_client.get(url, {"expand": "member"})

        assert response.status_code == status.HTTP_200_OK
        result = response.data["results"][0]
        assert result["member"] is not None
        assert str(result["member"]["id"]) == str(member_user.id)
        assert result["member"]["email"] == member_user.email

    @pytest.mark.django_db
    def test_add_subscriber_success(self, api_key_client, workspace, project, issue, member_user):
        """A project member can be subscribed by user id."""
        url = self.get_url(workspace.slug, project.id, issue.id)
        response = api_key_client.post(url, {"subscriber_id": str(member_user.id)}, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert str(response.data["subscriber"]) == str(member_user.id)
        assert IssueSubscriber.objects.filter(issue=issue, subscriber=member_user).exists()

    @pytest.mark.django_db
    def test_add_subscriber_missing_id(self, api_key_client, workspace, project, issue):
        """Missing subscriber_id returns a 400 with field errors."""
        url = self.get_url(workspace.slug, project.id, issue.id)
        response = api_key_client.post(url, {}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_add_subscriber_non_member(self, api_key_client, workspace, project, issue, non_member_user):
        """A user who is not a project member cannot be subscribed."""
        url = self.get_url(workspace.slug, project.id, issue.id)
        response = api_key_client.post(url, {"subscriber_id": str(non_member_user.id)}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert not IssueSubscriber.objects.filter(issue=issue, subscriber=non_member_user).exists()

    @pytest.mark.django_db
    def test_add_subscriber_duplicate(self, api_key_client, workspace, project, issue, member_user):
        """Subscribing the same user twice is rejected cleanly."""
        IssueSubscriber.objects.create(issue=issue, subscriber=member_user, project=project)

        url = self.get_url(workspace.slug, project.id, issue.id)
        response = api_key_client.post(url, {"subscriber_id": str(member_user.id)}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert IssueSubscriber.objects.filter(issue=issue, subscriber=member_user).count() == 1

    @pytest.mark.django_db
    def test_add_subscriber_issue_not_found(self, api_key_client, workspace, project, member_user):
        """Subscribing on a non-existent work item returns a 404."""
        url = self.get_url(workspace.slug, project.id, uuid4())
        response = api_key_client.post(url, {"subscriber_id": str(member_user.id)}, format="json")

        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_list_requires_authentication(self, api_client, workspace, project, issue):
        """Without an API key the endpoint rejects the request."""
        url = self.get_url(workspace.slug, project.id, issue.id)
        response = api_client.get(url)

        assert response.status_code in (
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        )


@pytest.mark.contract
class TestIssueSubscriberDetailAPIEndpoint:
    """Test the public work-item subscriber (watcher) delete endpoint."""

    def get_url(self, workspace_slug, project_id, issue_id, subscriber_id):
        return (
            f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}"
            f"/work-items/{issue_id}/subscribers/{subscriber_id}/"
        )

    @pytest.mark.django_db
    def test_remove_subscriber_success(self, api_key_client, workspace, project, issue, member_user):
        """A subscriber can be removed by user id."""
        IssueSubscriber.objects.create(issue=issue, subscriber=member_user, project=project)

        url = self.get_url(workspace.slug, project.id, issue.id, member_user.id)
        response = api_key_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not IssueSubscriber.objects.filter(issue=issue, subscriber=member_user).exists()

    @pytest.mark.django_db
    def test_remove_subscriber_not_found(self, api_key_client, workspace, project, issue, member_user):
        """Removing a non-existent subscription returns a 404."""
        url = self.get_url(workspace.slug, project.id, issue.id, member_user.id)
        response = api_key_client.delete(url)

        assert response.status_code == status.HTTP_404_NOT_FOUND
