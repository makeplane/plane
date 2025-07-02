import pytest
from uuid import uuid4

from plane.api.serializers import WorkspaceLiteSerializer
from plane.db.models import Workspace, User


@pytest.mark.unit
class TestWorkspaceLiteSerializer:
    """Test the WorkspaceLiteSerializer"""

    def test_workspace_lite_serializer_fields(self, db):
        """Test that the serializer includes the correct fields"""
        # Create a user to be the owner
        owner = User.objects.create(
            email="test@example.com", first_name="Test", last_name="User"
        )

        # Create a workspace with explicit ID to test serialization
        workspace_id = uuid4()
        workspace = Workspace.objects.create(
            name="Test Workspace", slug="test-workspace", id=workspace_id, owner=owner
        )

        # Serialize the workspace
        serialized_data = WorkspaceLiteSerializer(workspace).data

        # Check fields are present and correct
        assert "name" in serialized_data
        assert "slug" in serialized_data
        assert "id" in serialized_data

        assert serialized_data["name"] == "Test Workspace"
        assert serialized_data["slug"] == "test-workspace"
        assert str(serialized_data["id"]) == str(workspace_id)

    def test_workspace_lite_serializer_read_only(self, db):
        """Test that the serializer fields are read-only"""
        # Create a user to be the owner
        owner = User.objects.create(
            email="test2@example.com", first_name="Test", last_name="User"
        )

        # Create a workspace
        workspace = Workspace.objects.create(
            name="Test Workspace", slug="test-workspace", id=uuid4(), owner=owner
        )

        # Try to update via serializer
        serializer = WorkspaceLiteSerializer(
            workspace, data={"name": "Updated Name", "slug": "updated-slug"}
        )

        # Serializer should be valid (since read-only fields are ignored)
        assert serializer.is_valid()

        # Save should not update the read-only fields
        updated_workspace = serializer.save()
        assert updated_workspace.name == "Test Workspace"
        assert updated_workspace.slug == "test-workspace"
