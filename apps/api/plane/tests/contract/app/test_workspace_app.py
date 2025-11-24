import pytest
from django.urls import reverse
from rest_framework import status
from unittest.mock import patch

from plane.db.models import Workspace, WorkspaceMember


@pytest.mark.contract
class TestWorkspaceAPI:
    """Test workspace CRUD operations"""

    @pytest.mark.django_db
    def test_create_workspace_empty_data(self, session_client):
        """Test creating a workspace with empty data"""
        url = reverse("workspace")

        # Test with empty data
        response = session_client.post(url, {}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    @patch("plane.bgtasks.workspace_seed_task.workspace_seed.delay")
    def test_create_workspace_valid_data(self, mock_workspace_seed, session_client, create_user):
        """Test creating a workspace with valid data"""
        url = reverse("workspace")
        user = create_user  # Use the create_user fixture directly as it returns a user object

        # Test with valid data - include all required fields
        workspace_data = {
            "name": "Plane",
            "slug": "pla-ne-test",
            "company_name": "Plane Inc.",
        }

        # Make the request
        response = session_client.post(url, workspace_data, format="json")

        # Check response status
        assert response.status_code == status.HTTP_201_CREATED

        # Verify workspace was created
        assert Workspace.objects.count() == 1

        # Check if the member is created
        assert WorkspaceMember.objects.count() == 1

        # Check other values
        workspace = Workspace.objects.get(slug=workspace_data["slug"])
        workspace_member = WorkspaceMember.objects.filter(workspace=workspace, member=user).first()
        assert workspace.owner == user
        assert workspace_member.role == 20

        # Verify the workspace_seed task was called
        mock_workspace_seed.assert_called_once_with(response.data["id"])

    @pytest.mark.django_db
    @patch("plane.bgtasks.workspace_seed_task.workspace_seed.delay")
    def test_create_duplicate_workspace(self, mock_workspace_seed, session_client):
        """Test creating a duplicate workspace"""
        url = reverse("workspace")

        # Create first workspace
        session_client.post(url, {"name": "Plane", "slug": "pla-ne"}, format="json")

        # Try to create a workspace with the same slug
        response = session_client.post(url, {"name": "Plane", "slug": "pla-ne"}, format="json")

        # The API returns 400 BAD REQUEST for duplicate slugs, not 409 CONFLICT
        assert response.status_code == status.HTTP_400_BAD_REQUEST

        # Optionally check the error message to confirm it's related to the duplicate slug
        assert "slug" in response.data
