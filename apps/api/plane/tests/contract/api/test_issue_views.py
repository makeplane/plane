# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Contract tests for IssueView public REST API endpoints (/api/v1/.../views/ and project-views/).
"""

from concurrent.futures import ThreadPoolExecutor
from threading import Event, get_ident
from time import monotonic, sleep
from unittest.mock import patch
from uuid import uuid4

import pytest
from django.db import DatabaseError, close_old_connections, connection, connections
from django.db.models.query import QuerySet
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import (
    IssueView,
    Project,
    ProjectMember,
    State,
    User,
    UserFavorite,
    UserRecentVisit,
    Workspace,
    WorkspaceMember,
)
from plane.bgtasks.recent_visited_task import recent_visited_task
from plane.db.models.api import APIToken


@pytest.fixture
def project(db, workspace, create_user):
    """Create a test project with the requesting user as an active admin."""
    project = Project.objects.create(
        name="View Test Project",
        identifier="VTP",
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
    """Create a default backlog state for the project."""
    return State.objects.create(
        name="Backlog",
        project=project,
        workspace=workspace,
        group="backlog",
        default=True,
    )


@pytest.fixture
def test_view(db, workspace, project, create_user):
    """Create an existing saved view in the project."""
    return IssueView.objects.create(
        name="My Sprint View",
        description="Filter for current sprint",
        workspace=workspace,
        project=project,
        owned_by=create_user,
        access=1,
        filters={"priority": ["urgent", "high"]},
    )


@pytest.mark.contract
class TestIssueViewPublicAPI:
    """Test suite verifying IssueView public REST API endpoints."""

    def get_list_url(self, workspace_slug, project_id):
        """Construct the project views list endpoint URL."""
        return f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}/views/"

    def get_alias_url(self, workspace_slug, project_id):
        """Construct the project views alias endpoint URL (/project-views/)."""
        return f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}/project-views/"

    def get_detail_url(self, workspace_slug, project_id, view_id):
        """Construct the project view detail endpoint URL."""
        return f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}/views/{view_id}/"

    def get_alias_detail_url(self, workspace_slug, project_id, view_id):
        """Construct the legacy project-views detail endpoint URL."""
        return f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}/project-views/{view_id}/"

    def get_workspace_views_url(self, workspace_slug):
        """Construct the workspace-wide views list endpoint URL."""
        return f"/api/v1/workspaces/{workspace_slug}/views/"

    def get_workspace_view_detail_url(self, workspace_slug, view_id):
        """Construct the workspace view detail endpoint URL."""
        return f"{self.get_workspace_views_url(workspace_slug)}{view_id}/"

    @pytest.mark.django_db
    def test_list_project_views_empty(self, api_key_client, workspace, project):
        """Listing views in a project with no views returns empty results list."""
        url = self.get_list_url(workspace.slug, project.id)
        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data.get("results") == []

    @pytest.mark.django_db
    def test_create_project_view(self, api_key_client, workspace, project, create_user):
        """Creating a named project view via public API sets query criteria and metadata."""
        url = self.get_list_url(workspace.slug, project.id)
        payload = {
            "name": "High Priority Bugs",
            "description": "All urgent and high priority work items",
            "access": 1,
            "filters": {"priority": ["urgent", "high"]},
            "display_filters": {"layout": "list", "order_by": "-created_at"},
            "display_properties": {"priority": True, "assignee": True},
        }
        response = api_key_client.post(url, payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        data = response.data
        assert data.get("name") == "High Priority Bugs"
        assert data.get("description") == "All urgent and high priority work items"
        assert data.get("access") == 1
        assert "query" in data

        view = IssueView.objects.get(pk=data["id"])
        assert view.project_id == project.id
        assert view.workspace_id == workspace.id
        assert view.owned_by_id == create_user.id
        assert view.query.get("priority__in") == ["urgent", "high"]

    @pytest.mark.django_db
    def test_create_project_view_via_alias(self, api_key_client, workspace, project, create_user):
        """Calling /project-views/ POST creates named saved view rather than 404."""
        url = self.get_alias_url(workspace.slug, project.id)
        payload = {
            "name": "Alias Created View",
            "description": "Created through /project-views/ route",
            "filters": {},
        }
        response = api_key_client.post(url, payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data.get("name") == "Alias Created View"
        assert IssueView.objects.filter(name="Alias Created View", project=project).exists()

    @pytest.mark.django_db
    def test_create_project_view_rejects_non_object_filters(self, api_key_client, workspace, project):
        """A non-object filters payload is rejected with HTTP 400, not a server error."""
        url = self.get_list_url(workspace.slug, project.id)
        response = api_key_client.post(url, {"name": "Invalid filters", "filters": 42}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "filters" in response.data

        invalid_nested_value = api_key_client.post(
            url,
            {"name": "Invalid nested filters", "filters": {"state": 42}},
            format="json",
        )
        assert invalid_nested_value.status_code == status.HTTP_400_BAD_REQUEST
        assert "state" in invalid_nested_value.data.get("filters", {})

    @pytest.mark.django_db
    def test_retrieve_project_view_via_alias_detail_route(self, api_key_client, workspace, project, test_view):
        """The legacy /project-views/ alias supports its detail operations."""
        url = self.get_alias_detail_url(workspace.slug, project.id, test_view.id)

        retrieve_response = api_key_client.get(url)
        assert retrieve_response.status_code == status.HTTP_200_OK
        assert retrieve_response.data.get("id") == str(test_view.id)

        update_response = api_key_client.patch(url, {"name": "Updated through alias"}, format="json")
        assert update_response.status_code == status.HTTP_200_OK
        assert update_response.data.get("name") == "Updated through alias"

        delete_response = api_key_client.delete(url)
        assert delete_response.status_code == status.HTTP_204_NO_CONTENT

    @pytest.mark.django_db
    def test_retrieve_project_view(self, api_key_client, workspace, project, test_view):
        """Retrieving an existing saved view by ID returns its details."""
        url = self.get_detail_url(workspace.slug, project.id, test_view.id)
        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data.get("id") == str(test_view.id)
        assert response.data.get("name") == test_view.name
        assert response.data.get("description") == test_view.description

    @pytest.mark.django_db
    def test_update_project_view(self, api_key_client, workspace, project, test_view, create_user):
        """Owner can partially update an existing view and recalculate query criteria."""
        url = self.get_detail_url(workspace.slug, project.id, test_view.id)
        UserFavorite.objects.create(
            user=create_user,
            workspace=workspace,
            project=project,
            entity_type="view",
            entity_identifier=test_view.id,
        )
        payload = {
            "name": "Updated Sprint View",
            "filters": {"priority": ["urgent"]},
        }
        response = api_key_client.patch(url, payload, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data.get("name") == "Updated Sprint View"
        assert response.data.get("is_favorite") is True

        test_view.refresh_from_db()
        assert test_view.name == "Updated Sprint View"
        assert test_view.filters == {"priority": ["urgent"]}
        assert test_view.query.get("priority__in") == ["urgent"]

        query_after_filter_update = test_view.query.copy()
        omitted_filters_response = api_key_client.patch(
            url, {"description": "Filters omitted from this update"}, format="json"
        )
        assert omitted_filters_response.status_code == status.HTTP_200_OK
        test_view.refresh_from_db()
        assert test_view.filters == {"priority": ["urgent"]}
        assert test_view.query == query_after_filter_update

        empty_filters_response = api_key_client.patch(url, {"filters": {}}, format="json")
        assert empty_filters_response.status_code == status.HTTP_200_OK
        test_view.refresh_from_db()
        assert test_view.filters == {}
        assert test_view.query == {}

    @pytest.mark.django_db
    def test_archived_project_views_cannot_be_updated_or_deleted(
        self, api_key_client, workspace, project, test_view
    ):
        """Project view mutations return 404 after the parent project is archived."""
        from django.utils import timezone

        project.archived_at = timezone.now()
        project.save(update_fields=["archived_at"])
        url = self.get_detail_url(workspace.slug, project.id, test_view.id)

        update_response = api_key_client.patch(url, {"name": "Must not update"}, format="json")
        delete_response = api_key_client.delete(url)

        assert update_response.status_code == status.HTTP_404_NOT_FOUND
        assert delete_response.status_code == status.HTTP_404_NOT_FOUND
        assert IssueView.objects.filter(pk=test_view.id).exists()

    @pytest.mark.django_db
    def test_update_locked_view_rejected(self, api_key_client, workspace, project, test_view):
        """Updating a locked view returns HTTP 400 Bad Request."""
        test_view.is_locked = True
        test_view.save()

        url = self.get_detail_url(workspace.slug, project.id, test_view.id)
        response = api_key_client.patch(url, {"name": "Should Fail"}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "locked" in response.data.get("error", "").lower()

        unlock_response = api_key_client.patch(url, {"is_locked": False}, format="json")
        assert unlock_response.status_code == status.HTTP_200_OK
        test_view.refresh_from_db()
        assert test_view.is_locked is False

    @pytest.mark.django_db
    def test_delete_project_view(self, api_key_client, workspace, project, test_view, create_user):
        """Deleting a saved view also removes its favorite and recent-visit metadata."""
        UserFavorite.objects.create(
            user=create_user,
            workspace=workspace,
            project=project,
            entity_type="view",
            entity_identifier=test_view.id,
        )
        UserRecentVisit.objects.create(
            user=create_user,
            workspace=workspace,
            project=project,
            entity_name="view",
            entity_identifier=test_view.id,
        )

        url = self.get_detail_url(workspace.slug, project.id, test_view.id)
        response = api_key_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not IssueView.objects.filter(pk=test_view.id).exists()
        assert not UserFavorite.objects.filter(
            user=create_user, project=project, entity_type="view", entity_identifier=test_view.id
        ).exists()
        assert not UserRecentVisit.objects.filter(
            user=create_user, project=project, entity_name="view", entity_identifier=test_view.id
        ).exists()

    @pytest.mark.django_db
    def test_private_view_visibility(self, api_key_client, workspace, project, create_user):
        """Private view (access=0) is hidden from other project members."""
        other_user = User.objects.create(email=f"other-{uuid4().hex[:6]}@plane.so", username=f"other_{uuid4().hex[:6]}")
        ProjectMember.objects.create(
            project=project,
            workspace=workspace,
            member=other_user,
            role=15,  # Member
            is_active=True,
        )

        public_view = IssueView.objects.create(
            name="Shared View",
            workspace=workspace,
            project=project,
            owned_by=other_user,
            access=1,  # Public
        )
        private_view = IssueView.objects.create(
            name="Secret View",
            workspace=workspace,
            project=project,
            owned_by=other_user,
            access=0,  # Private
        )

        url = self.get_list_url(workspace.slug, project.id)
        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        results = response.data.get("results", [])
        result_ids = [r["id"] for r in results]
        assert str(private_view.id) not in result_ids
        assert str(public_view.id) in result_ids

    @pytest.mark.django_db
    def test_workspace_view_list_and_create(self, api_key_client, workspace, create_user):
        """Public API supports creating and listing workspace-level saved views."""
        url = self.get_workspace_views_url(workspace.slug)
        payload = {
            "name": "Global Workspace View",
            "description": "Cross-project view",
            "filters": {"priority": ["urgent"]},
        }
        response = api_key_client.post(url, payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data.get("name") == "Global Workspace View"

        list_response = api_key_client.get(url)
        assert list_response.status_code == status.HTTP_200_OK
        results = list_response.data.get("results", [])
        assert any(r["name"] == "Global Workspace View" for r in results)

    @pytest.mark.django_db
    def test_workspace_view_detail_retrieve_update_delete_and_favorite_state(
        self, api_key_client, workspace, create_user
    ):
        """Workspace view detail methods work and favorite metadata is exposed and cleaned up."""
        view = IssueView.objects.create(
            name="Workspace Detail View",
            workspace=workspace,
            project=None,
            owned_by=create_user,
            access=1,
        )
        detail_url = self.get_workspace_view_detail_url(workspace.slug, view.id)

        initial_detail = api_key_client.get(detail_url)
        assert initial_detail.status_code == status.HTTP_200_OK
        assert initial_detail.data.get("is_favorite") is False

        UserFavorite.objects.create(
            user=create_user,
            workspace=workspace,
            project=None,
            entity_type="view",
            entity_identifier=view.id,
        )
        UserRecentVisit.objects.create(
            user=create_user,
            workspace=workspace,
            project=None,
            entity_name="view",
            entity_identifier=view.id,
        )
        other_user_suffix = uuid4().hex
        other_user = User.objects.create(
            email=f"visit-{other_user_suffix}@plane.so",
            username=f"visit_{other_user_suffix}",
        )
        WorkspaceMember.objects.create(
            workspace=workspace, member=other_user, role=15, is_active=True
        )
        UserRecentVisit.objects.create(
            user=other_user,
            workspace=workspace,
            project=None,
            entity_name="view",
            entity_identifier=view.id,
        )

        favorited_detail = api_key_client.get(detail_url)
        assert favorited_detail.status_code == status.HTTP_200_OK
        assert favorited_detail.data.get("is_favorite") is True

        list_response = api_key_client.get(self.get_workspace_views_url(workspace.slug))
        matching = [item for item in list_response.data.get("results", []) if item["id"] == str(view.id)]
        assert matching and matching[0].get("is_favorite") is True

        update_response = api_key_client.patch(detail_url, {"name": "Updated Workspace View"}, format="json")
        assert update_response.status_code == status.HTTP_200_OK
        assert update_response.data.get("name") == "Updated Workspace View"
        assert update_response.data.get("is_favorite") is True

        lock_response = api_key_client.patch(detail_url, {"is_locked": True}, format="json")
        assert lock_response.status_code == status.HTTP_200_OK
        locked_edit_response = api_key_client.patch(
            detail_url, {"name": "Must stay locked"}, format="json"
        )
        assert locked_edit_response.status_code == status.HTTP_400_BAD_REQUEST
        unlock_response = api_key_client.patch(detail_url, {"is_locked": False}, format="json")
        assert unlock_response.status_code == status.HTTP_200_OK
        assert unlock_response.data.get("is_locked") is False

        delete_response = api_key_client.delete(detail_url)
        assert delete_response.status_code == status.HTTP_204_NO_CONTENT
        assert not IssueView.objects.filter(pk=view.id).exists()
        assert not UserFavorite.objects.filter(
            user=create_user, workspace=workspace, entity_type="view", entity_identifier=view.id
        ).exists()
        assert not UserRecentVisit.objects.filter(
            user=create_user, workspace=workspace, entity_name="view", entity_identifier=view.id
        ).exists()
        assert not UserRecentVisit.objects.filter(
            user=other_user, workspace=workspace, entity_name="view", entity_identifier=view.id
        ).exists()

    @pytest.mark.django_db
    def test_workspace_favorite_patch_updates_view_favorite_metadata(
        self, session_client, workspace, create_user
    ):
        """A workspace favorite for an active saved view can still be renamed."""
        view = IssueView.objects.create(
            name="Favorite Patch View",
            workspace=workspace,
            project=None,
            owned_by=create_user,
            access=1,
        )
        favorite = UserFavorite.objects.create(
            user=create_user,
            workspace=workspace,
            project=None,
            entity_type="view",
            entity_identifier=view.id,
            name="Old favorite name",
        )

        response = session_client.patch(
            f"/api/workspaces/{workspace.slug}/user-favorites/{favorite.id}/",
            {"name": "Updated favorite name"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        favorite.refresh_from_db()
        assert favorite.name == "Updated favorite name"
        assert response.data["entity_data"]["id"] == str(view.id)

    @pytest.mark.django_db
    def test_workspace_favorite_patch_rejects_a_soft_deleted_view(
        self, session_client, workspace, create_user
    ):
        """Favorite metadata cannot be saved when its referenced view is no longer active."""
        view = IssueView.objects.create(
            name="Deleted Favorite View",
            workspace=workspace,
            project=None,
            owned_by=create_user,
            access=1,
        )
        favorite = UserFavorite.objects.create(
            user=create_user,
            workspace=workspace,
            project=None,
            entity_type="view",
            entity_identifier=view.id,
            name="Do not restore",
        )
        with patch("plane.db.mixins.soft_delete_related_objects.delay"):
            view.delete()

        response = session_client.patch(
            f"/api/workspaces/{workspace.slug}/user-favorites/{favorite.id}/",
            {"name": "Stale update"},
            format="json",
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND
        favorite.refresh_from_db()
        assert favorite.name == "Do not restore"

    @pytest.mark.parametrize("payload", [["name"], "name", 17, None])
    @pytest.mark.django_db
    def test_workspace_favorite_patch_rejects_non_object_request_bodies(
        self, session_client, workspace, create_user, payload
    ):
        """Non-object favorite update bodies return HTTP 400 without saving changes."""
        view = IssueView.objects.create(
            name="Favorite Body Validation View",
            workspace=workspace,
            project=None,
            owned_by=create_user,
            access=1,
        )
        favorite = UserFavorite.objects.create(
            user=create_user,
            workspace=workspace,
            project=None,
            entity_type="view",
            entity_identifier=view.id,
            name="Original favorite name",
        )

        favorite_url = f"/api/workspaces/{workspace.slug}/user-favorites/{favorite.id}/"
        if payload is None:
            # Passing Python None with format="json" can create an empty body.
            # Send the literal JSON token so the parser returns None explicitly.
            response = session_client.patch(
                favorite_url, data="null", content_type="application/json"
            )
        else:
            response = session_client.patch(favorite_url, payload, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["error"] == "Request body must be an object."
        favorite.refresh_from_db()
        assert favorite.name == "Original favorite name"

    @pytest.mark.django_db
    def test_workspace_guest_can_only_list_and_retrieve_own_views(self, workspace, create_user):
        """Workspace guests can access their own views but not public views owned by others."""
        guest_suffix = uuid4().hex
        guest = User.objects.create(
            email=f"guest-{guest_suffix}@plane.so",
            username=f"guest_{guest_suffix}",
        )
        WorkspaceMember.objects.create(
            workspace=workspace, member=guest, role=5, is_active=True
        )
        guest_token = APIToken.objects.create(
            user=guest,
            label="Guest API Token",
            token=f"guest-api-token-{guest_suffix}",
        )
        guest_client = APIClient()
        guest_client.credentials(HTTP_X_API_KEY=guest_token.token)

        own_view = IssueView.objects.create(
            name="Guest Private View",
            workspace=workspace,
            project=None,
            owned_by=guest,
            access=0,
        )
        another_members_public_view = IssueView.objects.create(
            name="Another Member Public View",
            workspace=workspace,
            project=None,
            owned_by=create_user,
            access=1,
        )

        list_response = guest_client.get(self.get_workspace_views_url(workspace.slug))
        assert list_response.status_code == status.HTTP_200_OK
        listed_ids = {item["id"] for item in list_response.data.get("results", [])}
        assert str(own_view.id) in listed_ids
        assert str(another_members_public_view.id) not in listed_ids

        own_detail_response = guest_client.get(
            self.get_workspace_view_detail_url(workspace.slug, own_view.id)
        )
        assert own_detail_response.status_code == status.HTTP_200_OK

        another_members_detail_response = guest_client.get(
            self.get_workspace_view_detail_url(workspace.slug, another_members_public_view.id)
        )
        assert another_members_detail_response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_non_owner_cannot_unlock_locked_project_or_workspace_views(
        self, workspace, project, create_user
    ):
        """A member cannot unlock another user's locked project or workspace view."""
        suffix = uuid4().hex
        other_user = User.objects.create(email=f"member-{suffix}@plane.so", username=f"member_{suffix}")
        WorkspaceMember.objects.create(workspace=workspace, member=other_user, role=15, is_active=True)
        ProjectMember.objects.create(project=project, member=other_user, role=15, is_active=True)
        token = APIToken.objects.create(
            user=other_user, label="Member API Token", token=f"member-api-token-{suffix}"
        )
        member_client = APIClient()
        member_client.credentials(HTTP_X_API_KEY=token.token)

        project_view = IssueView.objects.create(
            name="Owner Locked Project View",
            workspace=workspace,
            project=project,
            owned_by=create_user,
            is_locked=True,
        )
        workspace_view = IssueView.objects.create(
            name="Owner Locked Workspace View",
            workspace=workspace,
            project=None,
            owned_by=create_user,
            is_locked=True,
        )

        project_response = member_client.patch(
            self.get_detail_url(workspace.slug, project.id, project_view.id),
            {"is_locked": False},
            format="json",
        )
        workspace_response = member_client.patch(
            self.get_workspace_view_detail_url(workspace.slug, workspace_view.id),
            {"is_locked": False},
            format="json",
        )

        assert project_response.status_code == status.HTTP_400_BAD_REQUEST
        assert workspace_response.status_code == status.HTTP_400_BAD_REQUEST
        project_view.refresh_from_db()
        workspace_view.refresh_from_db()
        assert project_view.is_locked is True
        assert workspace_view.is_locked is True

    @pytest.mark.parametrize("view_scope", ["project", "workspace"])
    @pytest.mark.django_db
    def test_delete_rolls_back_view_metadata_when_view_deletion_fails(
        self, api_key_client, workspace, project, create_user, view_scope
    ):
        """A failed view delete must roll back favorite and recent-visit cleanup."""
        if view_scope == "project":
            view = IssueView.objects.create(
                name="Project View Delete Rollback",
                workspace=workspace,
                project=project,
                owned_by=create_user,
            )
            detail_url = self.get_detail_url(workspace.slug, project.id, view.id)
        else:
            view = IssueView.objects.create(
                name="Workspace View Delete Rollback",
                workspace=workspace,
                project=None,
                owned_by=create_user,
            )
            detail_url = self.get_workspace_view_detail_url(workspace.slug, view.id)

        UserFavorite.objects.create(
            user=create_user, workspace=workspace,
            project=project if view_scope == "project" else None,
            entity_type="view", entity_identifier=view.id,
        )
        UserRecentVisit.objects.create(
            user=create_user, workspace=workspace,
            project=project if view_scope == "project" else None,
            entity_name="view", entity_identifier=view.id,
        )

        with patch.object(IssueView, "delete", side_effect=DatabaseError("simulated delete failure")):
            response = api_key_client.delete(detail_url)

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert IssueView.objects.filter(pk=view.id).exists()
        assert UserFavorite.objects.filter(
            user=create_user, entity_type="view", entity_identifier=view.id
        ).exists()
        assert UserRecentVisit.objects.filter(
            user=create_user, entity_name="view", entity_identifier=view.id
        ).exists()

    @pytest.mark.django_db
    def test_queued_workspace_view_visit_does_not_recreate_after_delete(
        self, api_key_client, workspace, create_user
    ):
        """An already-queued task must not recreate recent-visit metadata after view deletion."""
        view = IssueView.objects.create(
            name="Queued Visit View",
            workspace=workspace,
            project=None,
            owned_by=create_user,
            access=1,
        )
        detail_url = self.get_workspace_view_detail_url(workspace.slug, view.id)

        # The public v1 workspace-view GET does not enqueue this task. Build the
        # already-queued task payload explicitly to exercise the stale-task case.
        queued_task_kwargs = {
            "slug": workspace.slug,
            "project_id": None,
            "entity_name": "view",
            "entity_identifier": view.id,
            "user_id": create_user.id,
        }
        delete_response = api_key_client.delete(detail_url)
        assert delete_response.status_code == status.HTTP_204_NO_CONTENT

        recent_visited_task.run(**queued_task_kwargs)
        assert not UserRecentVisit.objects.filter(
            user=create_user, workspace=workspace, entity_name="view", entity_identifier=view.id
        ).exists()

    @pytest.mark.parametrize("view_scope", ["project", "workspace"])
    @pytest.mark.django_db(transaction=True)
    def test_public_view_delete_waits_for_in_flight_recent_visit_task(
        self, workspace, project, create_user, api_token, view_scope, monkeypatch
    ):
        """Both public DELETE routes wait for a locked task and then remove its visit."""
        if connection.vendor != "postgresql" or not connection.features.has_select_for_update:
            pytest.skip("This lock-order regression requires PostgreSQL row-level locks.")

        project_id = project.id if view_scope == "project" else None
        view = IssueView.objects.create(
            name=f"Concurrent {view_scope} Visit View",
            workspace=workspace,
            project=project if view_scope == "project" else None,
            owned_by=create_user,
            access=1,
        )
        detail_url = (
            self.get_detail_url(workspace.slug, project.id, view.id)
            if view_scope == "project"
            else self.get_workspace_view_detail_url(workspace.slug, view.id)
        )
        task_at_insert = Event()
        allow_task_to_commit = Event()
        visit_inserted = Event()
        delete_lock_requested = Event()
        delete_finished = Event()
        delete_pid_ready = Event()
        delete_pid = {}
        delete_worker = {}
        queued_task_kwargs = {
            "slug": workspace.slug,
            "project_id": project_id,
            "entity_name": "view",
            "entity_identifier": view.id,
            "user_id": create_user.id,
        }
        original_create = QuerySet.create
        original_first = QuerySet.first

        def pause_recent_visit_insert(queryset, *args, **kwargs):
            """Pause visit insertion while the task holds the saved-view row lock."""
            is_target_visit = (
                queryset.model is UserRecentVisit
                and kwargs.get("entity_name") == "view"
                and kwargs.get("entity_identifier") == view.id
            )
            if is_target_visit:
                task_at_insert.set()
                if not allow_task_to_commit.wait(timeout=10):
                    raise TimeoutError("The test did not release the recent-visit task.")
                result = original_create(queryset, *args, **kwargs)
                visit_inserted.set()
                return result
            return original_create(queryset, *args, **kwargs)

        def observe_delete_lock_request(queryset, *args, **kwargs):
            """Signal when the public DELETE worker evaluates its saved-view lock query."""
            is_delete_worker = get_ident() == delete_worker.get("thread_id")
            if is_delete_worker and queryset.model is IssueView and queryset.query.select_for_update:
                delete_lock_requested.set()
            return original_first(queryset, *args, **kwargs)

        monkeypatch.setattr(QuerySet, "create", pause_recent_visit_insert)
        monkeypatch.setattr(QuerySet, "first", observe_delete_lock_request)

        def run_recent_visit_task():
            """Run the recent-visit task on an independent database connection."""
            close_old_connections()
            try:
                return recent_visited_task.run(**queued_task_kwargs)
            finally:
                close_old_connections()

        def run_view_delete():
            """Call the public DELETE route on its own database connection."""
            close_old_connections()
            delete_worker["thread_id"] = get_ident()
            try:
                with connections["default"].cursor() as cursor:
                    cursor.execute("SELECT pg_backend_pid()")
                    delete_pid["value"] = cursor.fetchone()[0]
                delete_pid_ready.set()

                client = APIClient()
                client.credentials(HTTP_X_API_KEY=api_token.token)
                response = client.delete(detail_url)
                return response.status_code
            finally:
                delete_finished.set()
                close_old_connections()

        executor = ThreadPoolExecutor(max_workers=2)
        task_future = None
        delete_future = None
        try:
            task_future = executor.submit(run_recent_visit_task)
            assert task_at_insert.wait(timeout=5), "The task did not reach the insert while holding the view lock."

            delete_future = executor.submit(run_view_delete)
            assert delete_pid_ready.wait(timeout=5), "The delete worker did not open its own database connection."
            assert delete_lock_requested.wait(timeout=5), "The public DELETE handler did not request the view row lock."

            # Confirm PostgreSQL reports the DELETE connection waiting on the task's row lock.
            deadline = monotonic() + 5
            waiting_for_lock = False
            while monotonic() < deadline:
                with connection.cursor() as cursor:
                    cursor.execute(
                        "SELECT wait_event_type FROM pg_stat_activity WHERE pid = %s",
                        [delete_pid["value"]],
                    )
                    row = cursor.fetchone()
                if row and row[0] == "Lock":
                    waiting_for_lock = True
                    break
                sleep(0.01)

            assert waiting_for_lock, "The public DELETE handler did not block on the task's saved-view lock."
            assert not delete_finished.is_set()
        finally:
            allow_task_to_commit.set()
            executor.shutdown(wait=True, cancel_futures=True)

        assert visit_inserted.is_set()
        assert task_future is not None
        task_future.result(timeout=5)
        assert delete_future is not None
        assert delete_future.result(timeout=5) == status.HTTP_204_NO_CONTENT
        assert not UserRecentVisit.objects.filter(
            user=create_user,
            workspace=workspace,
            project_id=project_id,
            entity_name="view",
            entity_identifier=view.id,
        ).exists()
        assert not IssueView.objects.filter(pk=view.id).exists()

    @pytest.mark.parametrize(
        "relative_filter",
        [
            "999999999_weeks;after;fromnow",
            "999999999_months;before;fromnow",
        ],
    )
    @pytest.mark.django_db
    def test_create_project_view_rejects_out_of_range_relative_date_filters(
        self, api_key_client, workspace, project, relative_filter
    ):
        """Unrepresentable relative date filters return HTTP 400 instead of HTTP 500."""
        response = api_key_client.post(
            self.get_list_url(workspace.slug, project.id),
            {"name": "Out of range date filter", "filters": {"created_at": [relative_filter]}},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "created_at" in response.data.get("filters", {})

    @pytest.mark.parametrize("view_scope", ["project", "workspace"])
    @pytest.mark.parametrize("payload_format", ["json", "multipart"])
    @pytest.mark.django_db
    def test_owner_can_unlock_locked_view_using_validated_boolean_false(
        self, api_key_client, workspace, project, create_user, view_scope, payload_format
    ):
        """Owner unlock accepts serializer-normalized false for JSON and form data."""
        view = IssueView.objects.create(
            name=f"Locked {view_scope} view",
            workspace=workspace,
            project=project if view_scope == "project" else None,
            owned_by=create_user,
            is_locked=True,
        )
        detail_url = (
            self.get_detail_url(workspace.slug, project.id, view.id)
            if view_scope == "project"
            else self.get_workspace_view_detail_url(workspace.slug, view.id)
        )

        response = api_key_client.patch(
            detail_url, {"is_locked": "false"}, format=payload_format
        )

        assert response.status_code == status.HTTP_200_OK
        view.refresh_from_db()
        assert view.is_locked is False

    @pytest.mark.django_db
    def test_legacy_project_view_delete_cleans_recent_visits_and_blocks_stale_task(
        self, session_client, workspace, project, create_user
    ):
        """Legacy project view deletion shares the visit-task lock and clears metadata."""
        view = IssueView.objects.create(
            name="Legacy Project View",
            workspace=workspace,
            project=project,
            owned_by=create_user,
            access=1,
        )
        UserFavorite.objects.create(
            user=create_user,
            workspace=workspace,
            project=project,
            entity_type="view",
            entity_identifier=view.id,
        )
        UserRecentVisit.objects.create(
            user=create_user,
            workspace=workspace,
            project=project,
            entity_name="view",
            entity_identifier=view.id,
        )
        queued_task_kwargs = {
            "slug": workspace.slug,
            "project_id": project.id,
            "entity_name": "view",
            "entity_identifier": view.id,
            "user_id": create_user.id,
        }

        delete_response = session_client.delete(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/views/{view.id}/"
        )

        assert delete_response.status_code == status.HTTP_204_NO_CONTENT
        assert not IssueView.objects.filter(pk=view.id).exists()
        assert not UserFavorite.objects.filter(
            user=create_user, project=project, entity_type="view", entity_identifier=view.id
        ).exists()
        assert not UserRecentVisit.objects.filter(
            user=create_user, project=project, entity_name="view", entity_identifier=view.id
        ).exists()

        recent_visited_task.run(**queued_task_kwargs)
        assert not UserRecentVisit.objects.filter(
            user=create_user, project=project, entity_name="view", entity_identifier=view.id
        ).exists()

    @pytest.mark.django_db
    def test_legacy_workspace_view_delete_cleans_recent_visits_and_blocks_stale_task(
        self, session_client, workspace, create_user
    ):
        """Legacy workspace view deletion shares the visit-task lock and removes visit metadata."""
        view = IssueView.objects.create(
            name="Legacy Workspace View",
            workspace=workspace,
            project=None,
            owned_by=create_user,
            access=1,
        )
        UserFavorite.objects.create(
            user=create_user,
            workspace=workspace,
            project=None,
            entity_type="view",
            entity_identifier=view.id,
        )
        UserRecentVisit.objects.create(
            user=create_user,
            workspace=workspace,
            project=None,
            entity_name="view",
            entity_identifier=view.id,
        )
        queued_task_kwargs = {
            "slug": workspace.slug,
            "project_id": None,
            "entity_name": "view",
            "entity_identifier": view.id,
            "user_id": create_user.id,
        }

        delete_response = session_client.delete(f"/api/workspaces/{workspace.slug}/views/{view.id}/")

        assert delete_response.status_code == status.HTTP_204_NO_CONTENT
        assert not IssueView.objects.filter(pk=view.id).exists()
        assert not UserFavorite.objects.filter(
            user=create_user, workspace=workspace, entity_type="view", entity_identifier=view.id
        ).exists()
        assert not UserRecentVisit.objects.filter(
            user=create_user, workspace=workspace, entity_name="view", entity_identifier=view.id
        ).exists()

        recent_visited_task.run(**queued_task_kwargs)
        assert not UserRecentVisit.objects.filter(
            user=create_user, workspace=workspace, entity_name="view", entity_identifier=view.id
        ).exists()

    @pytest.mark.parametrize("guest_view_all_features", [False, True])
    @pytest.mark.django_db
    def test_project_guest_visibility_respects_guest_view_all_features(
        self, workspace, project, create_user, guest_view_all_features
    ):
        """Project guests see own views always and other public views only when enabled."""
        project.guest_view_all_features = guest_view_all_features
        project.save(update_fields=["guest_view_all_features"])

        suffix = uuid4().hex
        guest = User.objects.create(
            email=f"project-guest-{suffix}@plane.so",
            username=f"project_guest_{suffix}",
        )
        WorkspaceMember.objects.create(workspace=workspace, member=guest, role=5, is_active=True)
        ProjectMember.objects.create(project=project, member=guest, role=5, is_active=True)
        token = APIToken.objects.create(
            user=guest,
            label="Project Guest API Token",
            token=f"project-guest-api-token-{suffix}",
        )
        guest_client = APIClient()
        guest_client.credentials(HTTP_X_API_KEY=token.token)

        own_view = IssueView.objects.create(
            name="Guest Private Project View",
            workspace=workspace,
            project=project,
            owned_by=guest,
            access=0,
        )
        another_members_public_view = IssueView.objects.create(
            name="Member Public Project View",
            workspace=workspace,
            project=project,
            owned_by=create_user,
            access=1,
        )

        list_response = guest_client.get(self.get_list_url(workspace.slug, project.id))
        assert list_response.status_code == status.HTTP_200_OK
        listed_ids = {item["id"] for item in list_response.data.get("results", [])}
        assert str(own_view.id) in listed_ids
        assert (str(another_members_public_view.id) in listed_ids) is guest_view_all_features

        own_detail_response = guest_client.get(
            self.get_detail_url(workspace.slug, project.id, own_view.id)
        )
        assert own_detail_response.status_code == status.HTTP_200_OK

        public_detail_response = guest_client.get(
            self.get_detail_url(workspace.slug, project.id, another_members_public_view.id)
        )
        expected_public_status = (
            status.HTTP_200_OK if guest_view_all_features else status.HTTP_403_FORBIDDEN
        )
        assert public_detail_response.status_code == expected_public_status

