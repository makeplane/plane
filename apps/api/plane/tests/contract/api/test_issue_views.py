# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Contract tests for IssueView public REST API endpoints (/api/v1/.../views/ and project-views/).
"""

from uuid import uuid4
import pytest
from rest_framework import status

from plane.db.models import IssueView, Project, ProjectMember, State, User, Workspace, WorkspaceMember


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

    def get_workspace_views_url(self, workspace_slug):
        """Construct the workspace-wide views list endpoint URL."""
        return f"/api/v1/workspaces/{workspace_slug}/views/"

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
    def test_retrieve_project_view(self, api_key_client, workspace, project, test_view):
        """Retrieving an existing saved view by ID returns its details."""
        url = self.get_detail_url(workspace.slug, project.id, test_view.id)
        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data.get("id") == str(test_view.id)
        assert response.data.get("name") == test_view.name
        assert response.data.get("description") == test_view.description

    @pytest.mark.django_db
    def test_update_project_view(self, api_key_client, workspace, project, test_view):
        """Owner can partially update an existing view and recalculate query criteria."""
        url = self.get_detail_url(workspace.slug, project.id, test_view.id)
        payload = {
            "name": "Updated Sprint View",
            "filters": {"priority": ["urgent"]},
        }
        response = api_key_client.patch(url, payload, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data.get("name") == "Updated Sprint View"

        test_view.refresh_from_db()
        assert test_view.name == "Updated Sprint View"
        assert test_view.query.get("priority__in") == ["urgent"]

    @pytest.mark.django_db
    def test_update_locked_view_rejected(self, api_key_client, workspace, project, test_view):
        """Updating a locked view returns HTTP 400 Bad Request."""
        test_view.is_locked = True
        test_view.save()

        url = self.get_detail_url(workspace.slug, project.id, test_view.id)
        response = api_key_client.patch(url, {"name": "Should Fail"}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "locked" in response.data.get("error", "").lower()

    @pytest.mark.django_db
    def test_delete_project_view(self, api_key_client, workspace, project, test_view):
        """Owner or admin can permanently delete a saved view."""
        url = self.get_detail_url(workspace.slug, project.id, test_view.id)
        response = api_key_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not IssueView.objects.filter(pk=test_view.id).exists()

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

    @pytest.mark.django_db
    def test_workspace_view_list_and_create(self, api_key_client, workspace, create_user):
        """Public API supports creating and listing workspace-level saved views."""
        WorkspaceMember.objects.create(
            workspace=workspace,
            member=create_user,
            role=20,
            is_active=True,
        )

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
