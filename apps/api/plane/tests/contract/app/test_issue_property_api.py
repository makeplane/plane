import pytest
from django.urls import reverse
from rest_framework import status

from plane.db.models import (
    Project,
    IssueProperty,
    IssuePropertyValue,
    Issue,
    State,
    ProjectMember,
)


@pytest.mark.contract
class TestIssuePropertyAPI:
    """Contract tests for IssueProperty API endpoints"""

    @pytest.fixture
    def project_with_member(self, db, workspace, create_user):
        """Create a project with the test user as admin member"""
        project = Project.objects.create(
            name="Test Project",
            identifier="TEST",
            workspace=workspace,
        )
        ProjectMember.objects.create(
            project=project,
            member=create_user,
            role=20,  # Admin
            is_active=True,
        )
        return project

    @pytest.fixture
    def issue_in_project(self, db, workspace, project_with_member):
        """Create an issue in the test project"""
        state = State.objects.create(
            name="Open",
            project=project_with_member,
            workspace=workspace,
        )
        return Issue.objects.create(
            name="Test Issue",
            project=project_with_member,
            workspace=workspace,
            state=state,
        )

    @pytest.mark.django_db
    def test_list_properties_empty(self, session_client, workspace, project_with_member):
        """Test listing properties when none exist"""
        url = f"/api/v1/workspaces/{workspace.slug}/projects/{project_with_member.id}/properties/"
        response = session_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data == []

    @pytest.mark.django_db
    def test_create_text_property(self, session_client, workspace, project_with_member):
        """Test creating a text property"""
        url = f"/api/v1/workspaces/{workspace.slug}/projects/{project_with_member.id}/properties/"
        data = {
            "name": "Client Name",
            "property_type": "text",
            "description": "Name of the client",
        }
        response = session_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "Client Name"
        assert response.data["key"] == "client_name"
        assert response.data["property_type"] == "text"

    @pytest.mark.django_db
    def test_create_select_property(self, session_client, workspace, project_with_member):
        """Test creating a select property with options"""
        url = f"/api/v1/workspaces/{workspace.slug}/projects/{project_with_member.id}/properties/"
        data = {
            "name": "Priority Level",
            "property_type": "select",
            "options": [
                {"value": "Low", "color": "#00FF00"},
                {"value": "High", "color": "#FF0000"},
            ],
        }
        response = session_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["property_type"] == "select"
        assert len(response.data["options"]) == 2

    @pytest.mark.django_db
    def test_list_properties(self, session_client, workspace, project_with_member):
        """Test listing properties after creation"""
        # Create some properties
        IssueProperty.objects.create(
            name="Prop 1",
            property_type="text",
            project=project_with_member,
            workspace=workspace,
        )
        IssueProperty.objects.create(
            name="Prop 2",
            property_type="number",
            project=project_with_member,
            workspace=workspace,
        )

        url = f"/api/v1/workspaces/{workspace.slug}/projects/{project_with_member.id}/properties/"
        response = session_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2

    @pytest.mark.django_db
    def test_retrieve_property(self, session_client, workspace, project_with_member):
        """Test retrieving a single property"""
        prop = IssueProperty.objects.create(
            name="Test Property",
            property_type="text",
            project=project_with_member,
            workspace=workspace,
        )

        url = f"/api/v1/workspaces/{workspace.slug}/projects/{project_with_member.id}/properties/{prop.id}/"
        response = session_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "Test Property"
        # Compare UUID objects or convert both to strings
        assert str(response.data["id"]) == str(prop.id)

    @pytest.mark.django_db
    def test_update_property(self, session_client, workspace, project_with_member):
        """Test updating a property (except key)"""
        prop = IssueProperty.objects.create(
            name="Test Property",
            property_type="text",
            project=project_with_member,
            workspace=workspace,
        )

        url = f"/api/v1/workspaces/{workspace.slug}/projects/{project_with_member.id}/properties/{prop.id}/"
        data = {
            "name": "Updated Name",
            "description": "Updated description",
        }
        response = session_client.patch(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "Updated Name"
        assert response.data["description"] == "Updated description"
        # Key should remain unchanged
        assert response.data["key"] == "test_property"

    @pytest.mark.django_db
    def test_update_property_key_fails(self, session_client, workspace, project_with_member):
        """Test that updating the key fails"""
        prop = IssueProperty.objects.create(
            name="Test Property",
            property_type="text",
            project=project_with_member,
            workspace=workspace,
        )

        url = f"/api/v1/workspaces/{workspace.slug}/projects/{project_with_member.id}/properties/{prop.id}/"
        data = {
            "key": "new_key",
        }
        response = session_client.patch(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_delete_property(self, session_client, workspace, project_with_member):
        """Test deleting a property"""
        prop = IssueProperty.objects.create(
            name="Test Property",
            property_type="text",
            project=project_with_member,
            workspace=workspace,
        )

        url = f"/api/v1/workspaces/{workspace.slug}/projects/{project_with_member.id}/properties/{prop.id}/"
        response = session_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT


@pytest.mark.contract
class TestIssuePropertyValueAPI:
    """Contract tests for IssuePropertyValue API endpoints"""

    @pytest.fixture
    def project_with_member(self, db, workspace, create_user):
        """Create a project with the test user as admin member"""
        project = Project.objects.create(
            name="Test Project",
            identifier="TEST",
            workspace=workspace,
        )
        ProjectMember.objects.create(
            project=project,
            member=create_user,
            role=20,  # Admin
            is_active=True,
        )
        return project

    @pytest.fixture
    def issue_in_project(self, db, workspace, project_with_member):
        """Create an issue in the test project"""
        state = State.objects.create(
            name="Open",
            project=project_with_member,
            workspace=workspace,
        )
        return Issue.objects.create(
            name="Test Issue",
            project=project_with_member,
            workspace=workspace,
            state=state,
        )

    @pytest.fixture
    def text_property(self, db, workspace, project_with_member):
        """Create a text property"""
        return IssueProperty.objects.create(
            name="Client Name",
            property_type="text",
            project=project_with_member,
            workspace=workspace,
        )

    @pytest.mark.django_db
    def test_set_property_value(
        self, session_client, workspace, project_with_member, issue_in_project, text_property
    ):
        """Test setting a property value on an issue"""
        url = (
            f"/api/v1/workspaces/{workspace.slug}/projects/{project_with_member.id}"
            f"/issues/{issue_in_project.id}/property-values/"
        )
        data = {
            "property_id": str(text_property.id),
            "value": "Acme Corp",
        }
        response = session_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["value"] == "Acme Corp"

    @pytest.mark.django_db
    def test_get_property_values(
        self, session_client, workspace, project_with_member, issue_in_project, text_property
    ):
        """Test getting all property values for an issue"""
        # Create a property value
        IssuePropertyValue.objects.create(
            issue=issue_in_project,
            property=text_property,
            value="Test Value",
            project=project_with_member,
            workspace=workspace,
        )

        url = (
            f"/api/v1/workspaces/{workspace.slug}/projects/{project_with_member.id}"
            f"/issues/{issue_in_project.id}/property-values/"
        )
        response = session_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["value"] == "Test Value"


@pytest.mark.contract
class TestBulkCustomFieldsAPI:
    """Contract tests for bulk custom fields endpoint"""

    @pytest.fixture
    def project_with_member(self, db, workspace, create_user):
        """Create a project with the test user as admin member"""
        project = Project.objects.create(
            name="Test Project",
            identifier="TEST",
            workspace=workspace,
        )
        ProjectMember.objects.create(
            project=project,
            member=create_user,
            role=20,  # Admin
            is_active=True,
        )
        return project

    @pytest.fixture
    def issue_in_project(self, db, workspace, project_with_member):
        """Create an issue in the test project"""
        state = State.objects.create(
            name="Open",
            project=project_with_member,
            workspace=workspace,
        )
        return Issue.objects.create(
            name="Test Issue",
            project=project_with_member,
            workspace=workspace,
            state=state,
        )

    @pytest.fixture
    def properties(self, db, workspace, project_with_member):
        """Create multiple properties"""
        return {
            "client_name": IssueProperty.objects.create(
                name="Client Name",
                property_type="text",
                project=project_with_member,
                workspace=workspace,
            ),
            "priority": IssueProperty.objects.create(
                name="Priority",
                property_type="select",
                options=[{"value": "Low"}, {"value": "High"}],
                project=project_with_member,
                workspace=workspace,
            ),
            "is_urgent": IssueProperty.objects.create(
                name="Is Urgent",
                property_type="boolean",
                project=project_with_member,
                workspace=workspace,
            ),
        }

    @pytest.mark.django_db
    def test_bulk_set_custom_fields(
        self, session_client, workspace, project_with_member, issue_in_project, properties
    ):
        """Test bulk setting custom fields on an issue"""
        url = (
            f"/api/v1/workspaces/{workspace.slug}/projects/{project_with_member.id}"
            f"/issues/{issue_in_project.id}/custom-fields/"
        )
        data = {
            "custom_fields": {
                "client_name": "Acme Corp",
                "priority": "High",
                "is_urgent": True,
            }
        }
        response = session_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_bulk_get_custom_fields(
        self, session_client, workspace, project_with_member, issue_in_project, properties
    ):
        """Test getting custom fields in flat format"""
        # Set some values first
        IssuePropertyValue.objects.create(
            issue=issue_in_project,
            property=properties["client_name"],
            value="Acme Corp",
            project=project_with_member,
            workspace=workspace,
        )

        url = (
            f"/api/v1/workspaces/{workspace.slug}/projects/{project_with_member.id}"
            f"/issues/{issue_in_project.id}/custom-fields/"
        )
        response = session_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert "custom_fields" in response.data
        assert response.data["custom_fields"]["client_name"] == "Acme Corp"
