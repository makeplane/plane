# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from unittest import mock
from rest_framework import status
from uuid import uuid4

from plane.db.models import (
    Issue,
    IssuePage,
    Page,
    Project,
    ProjectMember,
    ProjectPage,
    User,
    Workspace,
    WorkspaceMember,
)

ACTIVITY_TARGET = "plane.app.views.issue.page.issue_activity"
HOST_TARGET = "plane.app.views.issue.page.base_host"


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Test Project",
        identifier="TP",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    return project


@pytest.fixture
def issue(db, project):
    return Issue.objects.create(name="Test Issue", project=project, workspace=project.workspace)


def make_page(project, owner, access=Page.PUBLIC_ACCESS, name="Test Page"):
    page = Page.objects.create(workspace=project.workspace, owned_by=owner, name=name, access=access)
    ProjectPage.objects.create(workspace=project.workspace, project=project, page=page)
    return page


@pytest.fixture
def page(db, project, create_user):
    return make_page(project, create_user)


def list_url(slug, project_id, issue_id):
    return f"/api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/issue-pages/"


def detail_url(slug, project_id, issue_id, page_id):
    return f"/api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/issue-pages/{page_id}/"


@pytest.mark.contract
class TestIssuePagesAppAttach:
    @pytest.mark.django_db
    def test_attach_page_success(self, session_client, workspace, project, issue, page):
        url = list_url(workspace.slug, project.id, issue.id)
        with mock.patch(ACTIVITY_TARGET) as activity, mock.patch(HOST_TARGET, return_value="http://localhost"):
            response = session_client.post(url, {"page_id": str(page.id)}, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.json()["id"] == str(page.id)
        assert IssuePage.objects.filter(issue=issue, page=page).count() == 1
        activity.delay.assert_called_once()
        assert activity.delay.call_args.kwargs["type"] == "page.activity.created"

    @pytest.mark.django_db
    def test_attach_missing_page_id(self, session_client, workspace, project, issue):
        url = list_url(workspace.slug, project.id, issue.id)
        response = session_client.post(url, {}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_attach_nonexistent_page(self, session_client, workspace, project, issue):
        url = list_url(workspace.slug, project.id, issue.id)
        response = session_client.post(url, {"page_id": str(uuid4())}, format="json")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert IssuePage.objects.count() == 0

    @pytest.mark.django_db
    def test_attach_forbidden_for_guest(self, session_client, workspace, project, issue, page):
        guest = User.objects.create_user(email="guest@example.com", username="guest")
        WorkspaceMember.objects.create(workspace=workspace, member=guest, role=5, is_active=True)
        ProjectMember.objects.create(project=project, member=guest, role=5, is_active=True)

        session_client.force_authenticate(user=guest)
        url = list_url(workspace.slug, project.id, issue.id)
        response = session_client.post(url, {"page_id": str(page.id)}, format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert IssuePage.objects.count() == 0

    @pytest.mark.django_db
    def test_attach_private_page_of_other_user_hidden(self, session_client, workspace, project, issue):
        other = User.objects.create_user(email="other@example.com", username="other")
        ProjectMember.objects.create(project=project, member=other, role=15, is_active=True)
        private_page = make_page(project, other, access=Page.PRIVATE_ACCESS, name="Private")

        url = list_url(workspace.slug, project.id, issue.id)
        response = session_client.post(url, {"page_id": str(private_page.id)}, format="json")

        # No existence oracle: a private page owned by someone else looks like a 404
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert IssuePage.objects.count() == 0

    @pytest.mark.django_db
    def test_attach_cross_workspace_rejected(self, session_client, workspace, project, issue, create_user):
        other_ws = Workspace.objects.create(name="Other WS", owner=create_user, slug="other-ws")
        WorkspaceMember.objects.create(workspace=other_ws, member=create_user, role=20, is_active=True)
        other_project = Project.objects.create(name="Other", identifier="OT", workspace=other_ws)
        ProjectMember.objects.create(project=other_project, member=create_user, role=20, is_active=True)
        foreign_page = make_page(other_project, create_user, name="Foreign")

        url = list_url(workspace.slug, project.id, issue.id)
        response = session_client.post(url, {"page_id": str(foreign_page.id)}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert IssuePage.objects.count() == 0

    @pytest.mark.django_db
    def test_attach_unauthenticated(self, client, workspace, project, issue, page):
        url = list_url(workspace.slug, project.id, issue.id)
        response = client.post(url, {"page_id": str(page.id)}, format="json")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.contract
class TestIssuePagesAppList:
    @pytest.mark.django_db
    def test_list_returns_linked_pages(self, session_client, workspace, project, issue, page):
        IssuePage.objects.create(workspace=project.workspace, project=project, issue=issue, page=page)

        url = list_url(workspace.slug, project.id, issue.id)
        response = session_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == str(page.id)

    @pytest.mark.django_db
    def test_list_excludes_private_page_of_other_user(self, session_client, workspace, project, issue, page):
        other = User.objects.create_user(email="other@example.com", username="other")
        ProjectMember.objects.create(project=project, member=other, role=15, is_active=True)
        private_page = make_page(project, other, access=Page.PRIVATE_ACCESS, name="Private")

        IssuePage.objects.create(workspace=project.workspace, project=project, issue=issue, page=page)
        IssuePage.objects.create(workspace=project.workspace, project=project, issue=issue, page=private_page)

        url = list_url(workspace.slug, project.id, issue.id)
        response = session_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        returned_ids = {row["id"] for row in response.json()}
        assert str(page.id) in returned_ids
        assert str(private_page.id) not in returned_ids

    @pytest.mark.django_db
    def test_list_unauthenticated(self, client, workspace, project, issue):
        url = list_url(workspace.slug, project.id, issue.id)
        response = client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.contract
class TestIssuePagesAppDetach:
    @pytest.mark.django_db
    def test_detach_success(self, session_client, workspace, project, issue, page):
        IssuePage.objects.create(workspace=project.workspace, project=project, issue=issue, page=page)

        url = detail_url(workspace.slug, project.id, issue.id, page.id)
        with mock.patch(ACTIVITY_TARGET) as activity, mock.patch(HOST_TARGET, return_value="http://localhost"):
            response = session_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert IssuePage.objects.filter(issue=issue, page=page).count() == 0
        activity.delay.assert_called_once()
        assert activity.delay.call_args.kwargs["type"] == "page.activity.deleted"

    @pytest.mark.django_db
    def test_detach_missing_link(self, session_client, workspace, project, issue, page):
        url = detail_url(workspace.slug, project.id, issue.id, page.id)
        response = session_client.delete(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_detach_forbidden_for_guest(self, session_client, workspace, project, issue, page):
        IssuePage.objects.create(workspace=project.workspace, project=project, issue=issue, page=page)
        guest = User.objects.create_user(email="guest@example.com", username="guest")
        WorkspaceMember.objects.create(workspace=workspace, member=guest, role=5, is_active=True)
        ProjectMember.objects.create(project=project, member=guest, role=5, is_active=True)

        session_client.force_authenticate(user=guest)
        url = detail_url(workspace.slug, project.id, issue.id, page.id)
        response = session_client.delete(url)

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert IssuePage.objects.filter(issue=issue, page=page).count() == 1
