import uuid
from unittest.mock import patch
from django.test import TestCase

from plane.bgtasks.copy_s3_object import copy_s3_objects_of_issue_attachment
from plane.db.models import Issue, FileAsset, Workspace, Project, User


class TestCopyS3ObjectsOfIssueAttachment(TestCase):
    def setUp(self):
        # Create base test data
        self.user = User.objects.create_user(
            email="test@plane.so", password="test123", username="test_user"
        )
        self.workspace = Workspace.objects.create(
            name="Test Workspace", owner=self.user
        )
        self.project = Project.objects.create(
            name="Test Project", workspace=self.workspace, project_lead=None
        )

        self.issue = Issue.objects.create(
            project=self.project, workspace=self.workspace, created_by=self.user
        )

    @patch("plane.bgtasks.copy_s3_object.copy_assets")
    def test_copy_issue_attachments_basic(self, mock_copy_assets):
        """Test basic copying of issue attachments"""
        # Arrange
        file_asset = FileAsset.objects.create(
            workspace=self.workspace,
            project=self.project,
            asset=f"{uuid.uuid4().hex}-test.jpg",
            entity_type="ISSUE_ATTACHMENT",
            issue=self.issue,
        )

        # Act
        copy_s3_objects_of_issue_attachment(
            project_id=self.project.id,
            user_id=self.user.id,
            original_issue_id=self.issue.id,
            entity_identifier=str(uuid.uuid4()),
            copy_to_entity_project=False,
        )

        # Assert
        mock_copy_assets.assert_called_once()
        call_args = mock_copy_assets.call_args[1]
        self.assertEqual(call_args["entity"], self.issue)
        self.assertEqual(call_args["asset_ids"], [str(file_asset.id)])
        self.assertEqual(call_args["project_id"], self.project.id)
        self.assertEqual(call_args["user_id"], self.user.id)
        self.assertEqual(call_args["copy_to_entity_project"], False)

    @patch("plane.bgtasks.copy_s3_object.copy_assets")
    def test_copy_issue_attachments_multiple_assets(self, mock_copy_assets):
        """Test copying multiple issue attachments"""
        # Arrange
        file_assets = []
        for i in range(3):
            asset = FileAsset.objects.create(
                workspace=self.workspace,
                project=self.project,
                asset=f"{uuid.uuid4().hex}-test{i}.jpg",
                entity_type="ISSUE_ATTACHMENT",
                issue=self.issue,
            )
            file_assets.append(asset)

        # Act
        copy_s3_objects_of_issue_attachment(
            project_id=self.project.id,
            user_id=self.user.id,
            original_issue_id=self.issue.id,
            entity_identifier=str(uuid.uuid4()),
            copy_to_entity_project=False,
        )

        # Assert
        mock_copy_assets.assert_called_once()
        call_args = mock_copy_assets.call_args[1]
        self.assertEqual(call_args["entity"], self.issue)
        self.assertEqual(
            set(call_args["asset_ids"]), set(str(asset.id) for asset in file_assets)
        )
        self.assertEqual(call_args["project_id"], self.project.id)

    @patch("plane.bgtasks.copy_s3_object.copy_assets")
    def test_copy_issue_attachments_no_assets(self, mock_copy_assets):
        """Test copying when there are no attachments"""
        # Arrange - no assets created

        # Act
        copy_s3_objects_of_issue_attachment(
            project_id=self.project.id,
            user_id=self.user.id,
            original_issue_id=self.issue.id,
            entity_identifier=str(uuid.uuid4()),
            copy_to_entity_project=False,
        )

        # Assert
        mock_copy_assets.assert_called_once()
        call_args = mock_copy_assets.call_args[1]
        self.assertEqual(call_args["entity"], self.issue)
        self.assertEqual(call_args["asset_ids"], [])

    @patch("plane.bgtasks.copy_s3_object.copy_assets")
    def test_copy_issue_attachments_with_different_project(self, mock_copy_assets):
        """Test copying attachments when copy_to_entity_project is True"""
        # Arrange
        file_asset = FileAsset.objects.create(
            workspace=self.workspace,
            project=self.project,
            asset=f"{uuid.uuid4().hex}-test.jpg",
            entity_type="ISSUE_ATTACHMENT",
            issue=self.issue,
        )

        # Act
        copy_s3_objects_of_issue_attachment(
            project_id=self.project.id,
            user_id=self.user.id,
            original_issue_id=self.issue.id,
            entity_identifier=str(uuid.uuid4()),
            copy_to_entity_project=True,
        )

        # Assert
        mock_copy_assets.assert_called_once()
        call_args = mock_copy_assets.call_args[1]
        self.assertEqual(call_args["copy_to_entity_project"], True)
        self.assertEqual(call_args["asset_ids"], [str(file_asset.id)])
