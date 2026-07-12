# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from uuid import uuid4

import pytest
from rest_framework import status

from plane.db.models import IssueView, Project, ProjectMember, User, WorkspaceMember


def make_user(email=None, role_ws=None, workspace=None, project=None, role_project=15):
    user = User.objects.create_user(
        email=email or f"{uuid4().hex[:12]}@example.com",
        username=f"u-{uuid4().hex[:12]}",
    )
    if workspace is not None:
        WorkspaceMember.objects.create(
            workspace=workspace, member=user, role=role_ws if role_ws is not None else 15, is_active=True
        )
    if project is not None:
        ProjectMember.objects.create(project=project, member=user, role=role_project, is_active=True)
    return user


def project_views_url(slug, project_id):
    return f"/api/workspaces/{slug}/projects/{project_id}/views/"


def project_view_detail_url(slug, project_id, pk):
    return f"/api/workspaces/{slug}/projects/{project_id}/views/{pk}/"


def workspace_views_url(slug):
    return f"/api/workspaces/{slug}/views/"


def workspace_view_detail_url(slug, pk):
    return f"/api/workspaces/{slug}/views/{pk}/"


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Views Project",
        identifier=f"VA{uuid4().hex[:3].upper()}",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    return project


@pytest.mark.contract
class TestProjectViewAccessWrite:
    @pytest.mark.django_db
    def test_create_private_view_persists_access(self, session_client, workspace, project):
        response = session_client.post(
            project_views_url(workspace.slug, project.id),
            {"name": "Private view", "access": 0},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["access"] == 0
        assert IssueView.objects.get(pk=response.data["id"]).access == 0

    @pytest.mark.django_db
    def test_owner_can_toggle_access(self, session_client, workspace, project):
        created = session_client.post(
            project_views_url(workspace.slug, project.id),
            {"name": "Toggling", "access": 1},
            format="json",
        )
        pk = created.data["id"]

        response = session_client.patch(
            project_view_detail_url(workspace.slug, project.id, pk),
            {"access": 0},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert IssueView.objects.get(pk=pk).access == 0

    @pytest.mark.django_db
    def test_non_owner_cannot_change_access(self, session_client, workspace, project, create_user):
        created = session_client.post(
            project_views_url(workspace.slug, project.id),
            {"name": "Mine", "access": 1},
            format="json",
        )
        pk = created.data["id"]
        other = make_user(workspace=workspace, project=project)
        session_client.force_authenticate(user=other)

        response = session_client.patch(
            project_view_detail_url(workspace.slug, project.id, pk),
            {"access": 0},
            format="json",
        )

        # the project viewset rejects via permission (403), the workspace one
        # via an owner check (400) — either way the write must not land
        assert response.status_code in (status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN)
        assert IssueView.objects.get(pk=pk).access == 1

    @pytest.mark.django_db
    def test_invalid_access_value_rejected(self, session_client, workspace, project):
        response = session_client.post(
            project_views_url(workspace.slug, project.id),
            {"name": "Bad", "access": 5},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_private_view_hidden_from_other_members(self, session_client, workspace, project, create_user):
        session_client.post(
            project_views_url(workspace.slug, project.id),
            {"name": "Secret", "access": 0},
            format="json",
        )
        other = make_user(workspace=workspace, project=project)
        session_client.force_authenticate(user=other)

        response = session_client.get(project_views_url(workspace.slug, project.id))

        assert response.status_code == status.HTTP_200_OK
        assert [v["name"] for v in response.data] == []

    @pytest.mark.django_db
    def test_private_view_visible_to_its_owner(self, session_client, workspace, project):
        session_client.post(
            project_views_url(workspace.slug, project.id),
            {"name": "Secret", "access": 0},
            format="json",
        )

        response = session_client.get(project_views_url(workspace.slug, project.id))

        assert [v["name"] for v in response.data] == ["Secret"]


@pytest.mark.contract
class TestWorkspaceViewAccessWrite:
    @pytest.mark.django_db
    def test_create_private_workspace_view_persists_access(self, session_client, workspace):
        response = session_client.post(
            workspace_views_url(workspace.slug),
            {"name": "WS private", "access": 0},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert IssueView.objects.get(pk=response.data["id"]).access == 0

    @pytest.mark.django_db
    def test_owner_can_toggle_workspace_view_access(self, session_client, workspace):
        created = session_client.post(
            workspace_views_url(workspace.slug),
            {"name": "WS toggling", "access": 0},
            format="json",
        )
        pk = created.data["id"]

        response = session_client.patch(
            workspace_view_detail_url(workspace.slug, pk),
            {"access": 1},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert IssueView.objects.get(pk=pk).access == 1

    @pytest.mark.django_db
    def test_private_workspace_view_hidden_from_other_members(self, session_client, workspace):
        session_client.post(
            workspace_views_url(workspace.slug),
            {"name": "WS secret", "access": 0},
            format="json",
        )
        other = make_user(workspace=workspace)
        session_client.force_authenticate(user=other)

        response = session_client.get(workspace_views_url(workspace.slug))

        assert response.status_code == status.HTTP_200_OK
        assert [v["name"] for v in response.data] == []

    @pytest.mark.django_db
    def test_is_locked_still_not_writable(self, session_client, workspace):
        created = session_client.post(
            workspace_views_url(workspace.slug),
            {"name": "Lock attempt", "access": 1, "is_locked": True},
            format="json",
        )

        assert created.status_code == status.HTTP_201_CREATED
        view = IssueView.objects.get(pk=created.data["id"])
        assert view.is_locked is False

        response = session_client.patch(
            workspace_view_detail_url(workspace.slug, created.data["id"]),
            {"is_locked": True},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        view.refresh_from_db()
        assert view.is_locked is False
