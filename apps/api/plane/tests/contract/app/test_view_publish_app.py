# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import uuid

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import (
    DeployBoard,
    Issue,
    IssueView,
    Project,
    ProjectMember,
    State,
    User,
    WorkspaceMember,
)


@pytest.fixture
def project(db, create_user, workspace):
    """Create a project with the session user as project administrator"""
    project = Project.objects.create(name="Test Project", identifier="TESTP", workspace=workspace)
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    return project


@pytest.fixture
def member_user(db, workspace, project):
    """Create a user with the member role on the workspace and the project"""
    user = User.objects.create(email="member@plane.so", username="member-user")
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=15, is_active=True)
    ProjectMember.objects.create(project=project, member=user, role=15, is_active=True)
    return user


@pytest.fixture
def issue_view(db, create_user, workspace, project):
    """Create a project view filtered on urgent priority"""
    return IssueView.objects.create(
        name="Urgent work items",
        project=project,
        workspace=workspace,
        owned_by=create_user,
        filters={"priority": ["urgent"]},
    )


class TestViewPublishBase:
    def get_publish_url(self, workspace_slug: str, project_id: uuid.UUID, view_id: uuid.UUID) -> str:
        return f"/api/workspaces/{workspace_slug}/projects/{project_id}/views/{view_id}/publish/"

    def get_public_settings_url(self, anchor: str) -> str:
        return f"/api/public/anchor/{anchor}/views/settings/"

    def get_public_issues_url(self, anchor: str) -> str:
        return f"/api/public/anchor/{anchor}/issues/"


@pytest.mark.contract
class TestViewPublishAPI(TestViewPublishBase):
    """Test publish/unpublish operations on a project view"""

    @pytest.mark.django_db
    def test_publish_view_by_admin(self, session_client, workspace, project, issue_view):
        url = self.get_publish_url(workspace.slug, project.id, issue_view.id)

        response = session_client.post(url, {}, format="json")

        assert response.status_code == status.HTTP_200_OK

        deploy_board = DeployBoard.objects.get(entity_name="view", entity_identifier=issue_view.id)
        assert response.data["anchor"] == deploy_board.anchor
        assert deploy_board.project_id == project.id
        assert deploy_board.workspace_id == workspace.id

    @pytest.mark.django_db
    def test_publish_view_by_member_is_refused(self, api_client, workspace, project, issue_view, member_user):
        api_client.force_authenticate(user=member_user)
        url = self.get_publish_url(workspace.slug, project.id, issue_view.id)

        response = api_client.post(url, {}, format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert not DeployBoard.objects.filter(entity_name="view", entity_identifier=issue_view.id).exists()

    @pytest.mark.django_db
    def test_unpublish_view_by_admin(self, session_client, workspace, project, issue_view):
        url = self.get_publish_url(workspace.slug, project.id, issue_view.id)
        session_client.post(url, {}, format="json")

        response = session_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not DeployBoard.objects.filter(entity_name="view", entity_identifier=issue_view.id).exists()

    @pytest.mark.django_db
    def test_unpublish_view_not_published(self, session_client, workspace, project, issue_view):
        url = self.get_publish_url(workspace.slug, project.id, issue_view.id)

        response = session_client.delete(url)

        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.contract
class TestViewPublicAccess(TestViewPublishBase):
    """Test anonymous access to a published view through its anchor"""

    @pytest.mark.django_db
    def test_anonymous_access_by_anchor(self, session_client, workspace, project, issue_view):
        url = self.get_publish_url(workspace.slug, project.id, issue_view.id)
        publish_response = session_client.post(url, {}, format="json")
        anchor = publish_response.data["anchor"]

        anonymous_client = APIClient()
        response = anonymous_client.get(self.get_public_settings_url(anchor))

        assert response.status_code == status.HTTP_200_OK
        assert response.data["anchor"] == anchor
        assert str(response.data["entity_identifier"]) == str(issue_view.id)

    @pytest.mark.django_db
    def test_anonymous_access_after_unpublish(self, session_client, workspace, project, issue_view):
        url = self.get_publish_url(workspace.slug, project.id, issue_view.id)
        publish_response = session_client.post(url, {}, format="json")
        anchor = publish_response.data["anchor"]

        session_client.delete(url)

        anonymous_client = APIClient()
        response = anonymous_client.get(self.get_public_settings_url(anchor))
        assert response.status_code == status.HTTP_404_NOT_FOUND

        issues_response = anonymous_client.get(self.get_public_issues_url(anchor))
        assert issues_response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_public_issues_respect_view_filters(self, session_client, workspace, project, issue_view):
        state = State.objects.create(name="Todo", project=project, group="unstarted", default=True)
        urgent_issue = Issue.objects.create(
            name="Urgent work item",
            project=project,
            workspace=workspace,
            state=state,
            priority="urgent",
        )
        low_issue = Issue.objects.create(
            name="Low work item",
            project=project,
            workspace=workspace,
            state=state,
            priority="low",
        )

        url = self.get_publish_url(workspace.slug, project.id, issue_view.id)
        publish_response = session_client.post(url, {}, format="json")
        anchor = publish_response.data["anchor"]

        anonymous_client = APIClient()
        response = anonymous_client.get(self.get_public_issues_url(anchor))

        assert response.status_code == status.HTTP_200_OK
        result_ids = {str(result["id"]) for result in response.data["results"]}
        assert str(urgent_issue.id) in result_ids
        assert str(low_issue.id) not in result_ids

    @pytest.mark.django_db
    def test_public_issues_query_params_cannot_widen_view_filters(
        self, session_client, workspace, project, issue_view
    ):
        state = State.objects.create(name="Todo", project=project, group="unstarted", default=True)
        low_issue = Issue.objects.create(
            name="Low work item",
            project=project,
            workspace=workspace,
            state=state,
            priority="low",
        )

        url = self.get_publish_url(workspace.slug, project.id, issue_view.id)
        publish_response = session_client.post(url, {}, format="json")
        anchor = publish_response.data["anchor"]

        anonymous_client = APIClient()
        response = anonymous_client.get(self.get_public_issues_url(anchor), {"priority": "low"})

        assert response.status_code == status.HTTP_200_OK
        result_ids = {str(result["id"]) for result in response.data["results"]}
        assert str(low_issue.id) not in result_ids

    @pytest.mark.django_db
    def test_public_issues_respect_rich_filters(self, session_client, create_user, workspace, project):
        """A view filtered only via rich_filters (the current UI path, legacy
        `filters`/`query` empty) must still be filtered on the public endpoint."""
        rich_view = IssueView.objects.create(
            name="Urgent via rich filters",
            project=project,
            workspace=workspace,
            owned_by=create_user,
            rich_filters={"priority": "urgent"},
        )
        assert rich_view.query == {}

        state = State.objects.create(name="Todo", project=project, group="unstarted", default=True)
        urgent_issue = Issue.objects.create(
            name="Urgent work item",
            project=project,
            workspace=workspace,
            state=state,
            priority="urgent",
        )
        low_issue = Issue.objects.create(
            name="Low work item",
            project=project,
            workspace=workspace,
            state=state,
            priority="low",
        )

        url = self.get_publish_url(workspace.slug, project.id, rich_view.id)
        publish_response = session_client.post(url, {}, format="json")
        anchor = publish_response.data["anchor"]

        anonymous_client = APIClient()
        list_response = anonymous_client.get(self.get_public_issues_url(anchor))
        assert list_response.status_code == status.HTTP_200_OK
        result_ids = {str(result["id"]) for result in list_response.data["results"]}
        assert str(urgent_issue.id) in result_ids
        assert str(low_issue.id) not in result_ids

        # The detail endpoint must not leak an issue outside the view's filter
        detail_url = f"/api/public/anchor/{anchor}/issues/{low_issue.id}/"
        detail_response = anonymous_client.get(detail_url)
        assert detail_response.status_code == status.HTTP_200_OK
        assert detail_response.data is None
