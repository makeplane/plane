# Python imports
import pytest
from uuid import uuid4

# Third party imports
from rest_framework import status

from plane.db.models import Issue, IssueType, ProjectIssueType
from plane.ee.models import (
    IssueProperty,
    IssuePropertyValue,
    PropertyTypeEnum,
)


@pytest.fixture
def issue_type(db, project, create_user):
    """Create and return an issue type instance"""
    issue_type = IssueType.objects.create(
        name="Story",
        workspace=project.workspace,
        created_by=create_user,
        is_epic=False,
    )
    ProjectIssueType.objects.create(
        project=project,
        issue_type=issue_type,
        created_by=create_user,
    )
    return issue_type


@pytest.fixture
def issue_property(db, project, create_user, issue_type):
    """Create and return an issue property instance"""
    return IssueProperty.objects.create(
        project=project,
        issue_type=issue_type,
        display_name="Test Property",
        property_type=PropertyTypeEnum.TEXT,
        created_by=create_user,
    )


@pytest.fixture
def issue(db, project, create_user, issue_type):
    """Create and return an issue instance"""
    return Issue.objects.create(
        project=project,
        name="Test Issue",
        created_by=create_user,
        type_id=issue_type.id,
    )


@pytest.fixture
def issue_property_value(db, workspace, project, create_user, issue, issue_property):
    """Create and return an issue property value instance"""
    return IssuePropertyValue.objects.create(
        workspace=workspace,
        project=project,
        issue=issue,
        property=issue_property,
        value_text="Test Value",
        created_by=create_user,
    )


@pytest.mark.contract
@pytest.mark.django_db
class TestIssuePropertyValueListAPI:
    """Test issue property value list API operations"""

    def get_issue_property_values_url(
        self, workspace_slug: str, project_id: str, issue_id: str
    ) -> str:
        """Construct the issue property values list endpoint URL"""
        return f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/issue-properties/values/"

    @pytest.mark.django_db
    def test_list_issue_property_values_success(
        self,
        api_key_client,
        workspace,
        project,
        issue,
        issue_property_value,
        mock_feature_flag,
    ):
        mock_feature_flag.return_value = True
        """Test successful retrieval of issue property values"""
        url = self.get_issue_property_values_url(workspace.slug, project.id, issue.id)

        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["property_id"] == (issue_property_value.property_id)
        assert response.data[0]["values"] == ["Test Value"]

    @pytest.mark.django_db
    def test_list_issue_property_values_empty(
        self, api_key_client, workspace, project, issue, mock_feature_flag
    ):
        mock_feature_flag.return_value = True
        """Test retrieval when no issue property values exist"""
        url = self.get_issue_property_values_url(workspace.slug, project.id, issue.id)

        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 0

    @pytest.mark.django_db
    def test_list_issue_property_values_nonexistent_issue(
        self, api_key_client, workspace, project, mock_feature_flag
    ):
        mock_feature_flag.return_value = True
        """Test retrieval with non-existent issue ID"""
        fake_issue_id = uuid4()
        url = self.get_issue_property_values_url(
            workspace.slug, project.id, fake_issue_id
        )

        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_list_issue_property_values_wrong_project(
        self, api_key_client, workspace, create_user, issue, mock_feature_flag
    ):
        mock_feature_flag.return_value = True
        """Test retrieval with wrong project ID"""
        # Create different project
        from plane.db.models import Project

        other_project = Project.objects.create(
            name="Other Project",
            workspace=workspace,
            created_by=create_user,
            identifier="other123",
        )

        url = self.get_issue_property_values_url(
            workspace.slug, other_project.id, issue.id
        )

        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_list_issue_property_values_unauthorized(
        self, api_client, workspace, project, issue, mock_feature_flag
    ):
        mock_feature_flag.return_value = True
        """Test retrieval without authentication"""
        url = self.get_issue_property_values_url(workspace.slug, project.id, issue.id)

        response = api_client.get(url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.django_db
    def test_list_issue_property_values_multiple_properties(
        self,
        api_key_client,
        workspace,
        project,
        create_user,
        issue,
        issue_type,
        issue_property,
        mock_feature_flag,
    ):
        mock_feature_flag.return_value = True
        """Test retrieval with multiple property values"""
        # Create additional properties
        property2 = IssueProperty.objects.create(
            project=project,
            issue_type=issue_type,
            display_name="Property 2",
            property_type=PropertyTypeEnum.TEXT,
            created_by=create_user,
        )

        # Create property values
        IssuePropertyValue.objects.create(
            workspace=workspace,
            project=project,
            issue=issue,
            property=issue_property,  # First property from fixture
            value_text="Value 1",
            created_by=create_user,
        )

        IssuePropertyValue.objects.create(
            workspace=workspace,
            project=project,
            issue=issue,
            property=property2,
            value_text="Value 2",
            created_by=create_user,
        )

        url = self.get_issue_property_values_url(workspace.slug, project.id, issue.id)

        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2

        # Verify both properties are returned
        property_ids = [item["property_id"] for item in response.data]
        assert issue_property.id in property_ids
        assert property2.id in property_ids
