import pytest
from plane.db.models import Project, ProjectMember, Issue, FileAsset
from unittest.mock import patch, MagicMock
from plane.bgtasks.copy_s3_object import (
    copy_s3_objects_of_description_and_assets,
    copy_assets,
)
import base64


@pytest.mark.unit
class TestCopyS3Objects:
    """Test the copy_s3_objects_of_description_and_assets function"""

    @pytest.fixture
    def project(self, create_user, workspace):
        project = Project.objects.create(name="Test Project", identifier="test-project", workspace=workspace)

        ProjectMember.objects.create(project=project, member=create_user)
        return project

    @pytest.fixture
    def issue(self, workspace, project):
        return Issue.objects.create(
            name="Test Issue",
            workspace=workspace,
            project_id=project.id,
            description_html='<div><image-component src="35e8b958-6ee5-43ce-ae56-fb0e776f421e"></image-component><image-component src="97988198-274f-4dfe-aa7a-4c0ffc684214"></image-component></div>',  # noqa: E501
        )

    @pytest.fixture
    def file_asset(self, workspace, project, issue):
        return FileAsset.objects.create(
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
            entity_type="ISSUE_DESCRIPTION",
        )

    @pytest.mark.django_db
    @patch("plane.bgtasks.copy_s3_object.S3Storage")
    def test_copy_s3_objects_of_description_and_assets(
        self, mock_s3_storage, create_user, workspace, project, issue, file_asset
    ):
        FileAsset.objects.create(
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
            entity_type="ISSUE_DESCRIPTION",
        )

        issue.save()

        # Set up mock S3 storage
        mock_storage_instance = MagicMock()
        mock_s3_storage.return_value = mock_storage_instance

        # Mock the external service call to avoid actual HTTP requests
        with patch("plane.bgtasks.copy_s3_object.sync_with_external_service") as mock_sync:
            mock_sync.return_value = {
                "description": "test description",
                "description_binary": base64.b64encode(b"test binary").decode(),
            }

            # Call the actual function (not .delay())
            copy_s3_objects_of_description_and_assets("ISSUE", issue.id, project.id, "test-workspace", create_user.id)

        # Assert that copy_object was called for each asset
        assert mock_storage_instance.copy_object.call_count == 2

        # Get the updated issue and its new assets
        updated_issue = Issue.objects.get(id=issue.id)
        new_assets = FileAsset.objects.filter(
            issue=updated_issue,
            entity_type="ISSUE_DESCRIPTION",
        )

        # Verify new assets were created
        assert new_assets.count() == 4  # 2 original + 2 copied

    @pytest.mark.django_db
    @patch("plane.bgtasks.copy_s3_object.S3Storage")
    def test_copy_assets_successful(self, mock_s3_storage, workspace, project, issue, file_asset):
        """Test successful copying of assets"""
        # Arrange
        mock_storage_instance = MagicMock()
        mock_s3_storage.return_value = mock_storage_instance

        # Act
        result = copy_assets(
            entity=issue,
            entity_identifier=issue.id,
            project_id=project.id,
            asset_ids=[file_asset.id],
            user_id=issue.created_by_id,
        )

        # Assert
        # Verify S3 copy was called
        mock_storage_instance.copy_object.assert_called_once()

        # Verify new asset was created
        assert len(result) == 1
        new_asset_id = result[0]["new_asset_id"]
        new_asset = FileAsset.objects.get(id=new_asset_id)

        # Verify asset properties were copied correctly
        assert new_asset.workspace == workspace
        assert new_asset.project_id == project.id
        assert new_asset.entity_type == file_asset.entity_type
        assert new_asset.attributes == file_asset.attributes
        assert new_asset.size == file_asset.size
        assert new_asset.is_uploaded is True

    @pytest.mark.django_db
    @patch("plane.bgtasks.copy_s3_object.S3Storage")
    def test_copy_assets_empty_asset_ids(self, mock_s3_storage, workspace, project, issue):
        """Test copying with empty asset_ids list"""
        # Arrange
        mock_storage_instance = MagicMock()
        mock_s3_storage.return_value = mock_storage_instance

        # Act
        result = copy_assets(
            entity=issue,
            entity_identifier=issue.id,
            project_id=project.id,
            asset_ids=[],
            user_id=issue.created_by_id,
        )

        # Assert
        assert result == []
        mock_storage_instance.copy_object.assert_not_called()

    @pytest.mark.django_db
    @patch("plane.bgtasks.copy_s3_object.S3Storage")
    def test_copy_assets_nonexistent_asset(self, mock_s3_storage, workspace, project, issue):
        """Test copying with non-existent asset ID"""
        # Arrange
        mock_storage_instance = MagicMock()
        mock_s3_storage.return_value = mock_storage_instance
        non_existent_id = "00000000-0000-0000-0000-000000000000"

        # Act
        result = copy_assets(
            entity=issue,
            entity_identifier=issue.id,
            project_id=project.id,
            asset_ids=[non_existent_id],
            user_id=issue.created_by_id,
        )

        # Assert
        assert result == []
        mock_storage_instance.copy_object.assert_not_called()
