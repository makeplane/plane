import pytest
from plane.db.models import User, Workspace, Project, ProjectMember, Issue, FileAsset
from unittest.mock import patch, MagicMock
from plane.bgtasks.copy_s3_object import copy_s3_objects
import base64


@pytest.mark.unit
class TestCopyS3Objects:
    """Test the copy_s3_objects function"""

    @pytest.mark.django_db
    @patch("plane.bgtasks.copy_s3_object.S3Storage")
    def test_copy_s3_objects(self, mock_s3_storage):
        # Create test data
        test_user = User.objects.create(
            email="test_user@example.com", first_name="Test", last_name="User"
        )

        workspace = Workspace.objects.create(
            name="Test Workspace", slug="test-workspace", owner=test_user
        )

        project = Project.objects.create(
            name="Test Project", identifier="test-project", workspace=workspace
        )
        ProjectMember.objects.create(project=project, member=test_user)

        issue = Issue.objects.create(
            name="Test Issue",
            workspace=workspace,
            project=project,
            description_html=f'<div><image-component src="35e8b958-6ee5-43ce-ae56-fb0e776f421e"></image-component><image-component src="97988198-274f-4dfe-aa7a-4c0ffc684214"></image-component></div>',
        )

        # Create test file assets
        asset1 = FileAsset.objects.create(
            issue=issue,
            workspace=workspace,
            project=project,
            asset="workspace1/test-asset-1.jpg",
            attributes={
                "name": "test-asset-1.jpg",
                "size": 100,
                "type": "image/jpeg",
            },
            id="35e8b958-6ee5-43ce-ae56-fb0e776f421e",
            entity_type="ISSUE_DESCRIPTION",  # Set the correct entity type
        )

        asset2 = FileAsset.objects.create(
            issue=issue,
            workspace=workspace,
            project=project,
            asset="workspace1/test-asset-2.pdf",
            attributes={
                "name": "test-asset-2.pdf",
                "size": 100,
                "type": "application/pdf",
            },
            id="97988198-274f-4dfe-aa7a-4c0ffc684214",
            entity_type="ISSUE_DESCRIPTION",  # Set the correct entity type
        )

        # Set up mock S3 storage
        mock_storage_instance = MagicMock()
        mock_s3_storage.return_value = mock_storage_instance

        # Mock the external service call to avoid actual HTTP requests
        with patch(
            "plane.bgtasks.copy_s3_object.sync_with_external_service"
        ) as mock_sync:
            mock_sync.return_value = {
                "description": "test description",
                "description_binary": base64.b64encode(b"test binary").decode(),
            }

            # Call the actual function (not .delay())
            copy_s3_objects(
                "ISSUE", issue.id, project.id, "test-workspace", test_user.id
            )

        # Assert that copy_object was called for each asset
        assert mock_storage_instance.copy_object.call_count == 2

        # Get the copy operations that were performed
        copy_calls = mock_storage_instance.copy_object.call_args_list

        # Sort assets and calls by asset name to ensure they match
        assets = sorted([asset1, asset2], key=lambda x: str(x.asset))
        sorted_calls = sorted(
            copy_calls, key=lambda x: str(x[0][0])
        )  # Sort by source path as string

        # Verify both assets were copied
        for asset, call in zip(assets, sorted_calls):
            args = call[0]
            # Verify source path matches original asset
            assert str(asset.asset) == str(
                args[0]
            )  # Convert both to strings for comparison
            # Verify destination path
            assert str(workspace.id) in str(args[1])
            assert asset.attributes["name"] in str(args[1])

        # Get the updated issue and its new assets
        updated_issue = Issue.objects.get(id=issue.id)
        new_assets = FileAsset.objects.filter(
            issue=updated_issue,
            entity_type="ISSUE_DESCRIPTION",  # Filter by the correct entity type
        )

        # Verify new assets were created
        assert new_assets.count() == 4
