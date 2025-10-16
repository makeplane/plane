import pytest
from uuid import uuid4

from plane.db.models import Workspace, WorkspaceMember


@pytest.mark.unit
class TestWorkspaceModel:
    """Test the Workspace model"""

    @pytest.mark.django_db
    def test_workspace_creation(self, create_user):
        """Test creating a workspace"""
        # Create a workspace
        workspace = Workspace.objects.create(
            name="Test Workspace", slug="test-workspace", id=uuid4(), owner=create_user
        )

        # Verify it was created
        assert workspace.id is not None
        assert workspace.name == "Test Workspace"
        assert workspace.slug == "test-workspace"
        assert workspace.owner == create_user

    @pytest.mark.django_db
    def test_workspace_member_creation(self, create_user):
        """Test creating a workspace member"""
        # Create a workspace
        workspace = Workspace.objects.create(
            name="Test Workspace", slug="test-workspace", id=uuid4(), owner=create_user
        )

        # Create a workspace member
        workspace_member = WorkspaceMember.objects.create(
            workspace=workspace,
            member=create_user,
            role=20,  # Admin role
        )

        # Verify it was created
        assert workspace_member.id is not None
        assert workspace_member.workspace == workspace
        assert workspace_member.member == create_user
        assert workspace_member.role == 20
