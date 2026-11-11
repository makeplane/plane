# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Creating a view requires membership: workspace views need an active workspace
member, project views an active project member."""

from unittest.mock import patch
from uuid import uuid4

import pytest
from django.utils import timezone
from rest_framework import status

from plane.db.models import IssueView, Project, ProjectMember, User, Workspace, WorkspaceMember


def _user(prefix):
    suffix = uuid4().hex[:8]
    return User.objects.create(email=f"{prefix}-{suffix}@plane.so", username=f"{prefix}_{suffix}")


def _project(workspace, identifier, member):
    project = Project.objects.create(name=f"{identifier} project", identifier=identifier, workspace=workspace)
    ProjectMember.objects.create(workspace=workspace, project=project, member=member, role=20)
    return project


@pytest.mark.contract
class TestViewCreateMembership:
    @pytest.mark.django_db
    def test_workspace_member_can_create_workspace_view(self, session_client, workspace, create_user):
        response = session_client.post(f"/api/workspaces/{workspace.slug}/views/", {"name": "Mine"}, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        view = IssueView.objects.get(pk=response.json()["id"])
        assert view.workspace_id == workspace.id
        assert view.project_id is None
        assert view.owned_by_id == create_user.id

    @pytest.mark.django_db
    def test_non_member_cannot_create_workspace_view(self, session_client, workspace):
        other = _user("other")
        foreign = Workspace.objects.create(name="Foreign", owner=other, slug=f"foreign-{uuid4().hex[:8]}")

        response = session_client.post(f"/api/workspaces/{foreign.slug}/views/", {"name": "Nope"}, format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert not IssueView.objects.filter(workspace=foreign).exists()

    @pytest.mark.django_db
    def test_project_member_can_create_project_view(self, session_client, workspace, create_user):
        project = _project(workspace, "OWN", create_user)

        response = session_client.post(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/views/", {"name": "Mine"}, format="json"
        )

        assert response.status_code == status.HTTP_201_CREATED
        view = IssueView.objects.get(pk=response.json()["id"])
        assert view.project_id == project.id
        assert view.owned_by_id == create_user.id

    @pytest.mark.django_db
    def test_non_member_cannot_create_project_view(self, session_client, workspace):
        project = _project(workspace, "SEC", _user("other"))

        response = session_client.post(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/views/", {"name": "Nope"}, format="json"
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert not IssueView.objects.filter(project=project).exists()

    @pytest.mark.parametrize("view_scope", ["workspace", "project"])
    @pytest.mark.django_db
    def test_owner_can_delete_legacy_view_when_created_by_is_missing(
        self, session_client, workspace, view_scope
    ):
        """A view owner can reach the explicit owner check even when created_by is null."""
        owner = _user("view_owner_without_creator")
        WorkspaceMember.objects.create(
            workspace=workspace, member=owner, role=15, is_active=True
        )

        project = None
        if view_scope == "project":
            project = Project.objects.create(
                name="Member-owned view project",
                identifier=f"DEL{uuid4().hex[:4].upper()}",
                workspace=workspace,
            )
            ProjectMember.objects.create(
                workspace=workspace,
                project=project,
                member=owner,
                role=15,
                is_active=True,
            )

        view = IssueView.objects.create(
            name="Owner view with missing creator",
            workspace=workspace,
            project=project,
            owned_by=owner,
            access=0,
        )
        IssueView.objects.filter(pk=view.id).update(created_by=None)
        view.refresh_from_db()
        assert view.created_by_id is None

        session_client.force_authenticate(user=owner)
        detail_url = (
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/views/{view.id}/"
            if project
            else f"/api/workspaces/{workspace.slug}/views/{view.id}/"
        )
        response = session_client.delete(detail_url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not IssueView.objects.filter(pk=view.id).exists()

    @pytest.mark.parametrize("view_scope", ["workspace", "project"])
    @pytest.mark.django_db
    def test_owner_can_unlock_locked_view_through_legacy_app_api(
        self, session_client, workspace, create_user, view_scope
    ):
        """The owner can unlock a public-API-locked view from the existing web app."""
        project = _project(workspace, "UNL", create_user) if view_scope == "project" else None
        list_url = (
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/views/"
            if project
            else f"/api/workspaces/{workspace.slug}/views/"
        )
        created = session_client.post(list_url, {"name": "Locked view"}, format="json")
        assert created.status_code == status.HTTP_201_CREATED
        view = IssueView.objects.get(pk=created.data["id"])
        IssueView.objects.filter(pk=view.id).update(is_locked=True)
        detail_url = (
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/views/{view.id}/"
            if project
            else f"/api/workspaces/{workspace.slug}/views/{view.id}/"
        )

        mixed_update = session_client.patch(
            detail_url, {"is_locked": False, "name": "Must remain locked"}, format="json"
        )
        assert mixed_update.status_code == status.HTTP_400_BAD_REQUEST
        view.refresh_from_db()
        assert view.is_locked is True
        assert view.name == "Locked view"

        unlock = session_client.patch(detail_url, {"is_locked": False}, format="json")
        assert unlock.status_code == status.HTTP_200_OK
        assert unlock.data["is_locked"] is False
        view.refresh_from_db()
        assert view.is_locked is False
        assert view.updated_by_id == create_user.id

    @pytest.mark.django_db
    def test_archived_project_rejects_legacy_view_create_update_and_delete(
        self, session_client, workspace, create_user
    ):
        """Legacy app saved-view mutations cannot proceed after the project is archived."""
        project = _project(workspace, "ARC", create_user)
        list_url = f"/api/workspaces/{workspace.slug}/projects/{project.id}/views/"
        created = session_client.post(list_url, {"name": "Existing view"}, format="json")
        assert created.status_code == status.HTTP_201_CREATED
        view = IssueView.objects.get(pk=created.data["id"])
        detail_url = f"{list_url}{view.id}/"

        Project.objects.filter(pk=project.id).update(archived_at=timezone.now())
        create_after_archive = session_client.post(list_url, {"name": "Must not exist"}, format="json")
        update_after_archive = session_client.patch(detail_url, {"name": "Must not update"}, format="json")
        delete_after_archive = session_client.delete(detail_url)

        assert create_after_archive.status_code == status.HTTP_404_NOT_FOUND
        assert update_after_archive.status_code == status.HTTP_404_NOT_FOUND
        assert delete_after_archive.status_code == status.HTTP_404_NOT_FOUND
        surviving_view = IssueView.all_objects.get(pk=view.id)
        assert surviving_view.name == "Existing view"
        assert surviving_view.deleted_at is None
        assert not IssueView.objects.filter(project=project, name="Must not exist").exists()

    @pytest.mark.parametrize("view_scope", ["workspace", "project"])
    @pytest.mark.django_db
    def test_legacy_view_retrieve_is_best_effort_when_visit_dispatch_fails(
        self, session_client, workspace, create_user, view_scope
    ):
        """A broker failure while recording a visit must not fail the view GET."""
        project = _project(workspace, "VIS", create_user) if view_scope == "project" else None
        list_url = (
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/views/"
            if project
            else f"/api/workspaces/{workspace.slug}/views/"
        )
        created = session_client.post(list_url, {"name": "Visit failure view"}, format="json")
        assert created.status_code == status.HTTP_201_CREATED
        view = IssueView.objects.get(pk=created.data["id"])
        detail_url = (
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/views/{view.id}/"
            if project
            else f"/api/workspaces/{workspace.slug}/views/{view.id}/"
        )

        with patch(
            "plane.app.views.view.base.recent_visited_task.delay",
            side_effect=RuntimeError("broker unavailable"),
        ) as dispatch, patch("plane.app.views.view.base.log_exception") as log_error:
            response = session_client.get(detail_url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["id"] == str(view.id)
        dispatch.assert_called_once()
        log_error.assert_called_once()
        assert isinstance(log_error.call_args.args[0], RuntimeError)

    @pytest.mark.django_db
    def test_project_view_retrieve_returns_404_for_missing_view(self, session_client, workspace, create_user):
        """A missing project view must produce 404 rather than serializing None."""
        project = _project(workspace, "MIS", create_user)
        response = session_client.get(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/views/{uuid4()}/"
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
