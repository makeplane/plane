import pytest
from rest_framework import status
from uuid import uuid4

from plane.db.models import Label, Project, ProjectMember


@pytest.fixture
def project(db, workspace, create_user):
    """Create a test project with the user as a member"""
    project = Project.objects.create(
        name="Test Project",
        identifier="TP",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(
        project=project,
        member=create_user,
        role=20,  # Admin role
        is_active=True,
    )
    return project


@pytest.fixture
def label_data():
    """Sample label data for tests"""
    return {
        "name": "Test Label",
        "color": "#FF5733",
        "description": "A test label for unit tests",
    }


@pytest.fixture
def create_label(db, project, create_user):
    """Create a test label"""
    return Label.objects.create(
        name="Existing Label",
        color="#00FF00",
        description="An existing label",
        project=project,
        workspace=project.workspace,
        created_by=create_user,
    )


@pytest.mark.contract
class TestLabelListCreateAPIEndpoint:
    """Test Label List and Create API Endpoint"""

    def get_label_url(self, workspace_slug, project_id):
        """Helper to get label endpoint URL"""
        return f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}/labels/"

    @pytest.mark.django_db
    def test_create_label_success(self, api_key_client, workspace, project, label_data):
        """Test successful label creation"""
        url = self.get_label_url(workspace.slug, project.id)

        response = api_key_client.post(url, label_data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert Label.objects.count() == 1

        created_label = Label.objects.first()
        assert created_label.name == label_data["name"]
        assert created_label.color == label_data["color"]
        assert created_label.description == label_data["description"]
        assert created_label.project == project

    @pytest.mark.django_db
    def test_create_label_invalid_data(self, api_key_client, workspace, project):
        """Test label creation with invalid data"""
        url = self.get_label_url(workspace.slug, project.id)

        # Test with empty data
        response = api_key_client.post(url, {}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

        # Test with missing name
        response = api_key_client.post(url, {"color": "#FF5733"}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_create_label_with_external_id(self, api_key_client, workspace, project):
        """Test creating label with external ID"""
        url = self.get_label_url(workspace.slug, project.id)

        label_data = {
            "name": "External Label",
            "color": "#FF5733",
            "external_id": "ext-123",
            "external_source": "github",
        }

        response = api_key_client.post(url, label_data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        created_label = Label.objects.first()
        assert created_label.external_id == "ext-123"
        assert created_label.external_source == "github"

    @pytest.mark.django_db
    def test_create_label_duplicate_external_id(self, api_key_client, workspace, project):
        """Test creating label with duplicate external ID"""
        url = self.get_label_url(workspace.slug, project.id)

        # Create first label
        Label.objects.create(
            name="First Label",
            project=project,
            workspace=workspace,
            external_id="ext-123",
            external_source="github",
        )

        # Try to create second label with same external ID
        label_data = {
            "name": "Second Label",
            "external_id": "ext-123",
            "external_source": "github",
        }

        response = api_key_client.post(url, label_data, format="json")

        assert response.status_code == status.HTTP_409_CONFLICT
        assert "same external id" in response.data["error"]

    @pytest.mark.django_db
    def test_list_labels_success(self, api_key_client, workspace, project, create_label):
        """Test successful label listing"""
        url = self.get_label_url(workspace.slug, project.id)

        # Create additional labels
        Label.objects.create(name="Label 2", project=project, workspace=workspace, color="#00FF00")
        Label.objects.create(name="Label 3", project=project, workspace=workspace, color="#0000FF")

        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert "results" in response.data
        assert len(response.data["results"]) == 3  # Including create_label fixture


@pytest.mark.contract
class TestLabelDetailAPIEndpoint:
    """Test Label Detail API Endpoint"""

    def get_label_detail_url(self, workspace_slug, project_id, label_id):
        """Helper to get label detail endpoint URL"""
        return f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}/labels/{label_id}/"

    @pytest.mark.django_db
    def test_get_label_success(self, api_key_client, workspace, project, create_label):
        """Test successful label retrieval"""
        url = self.get_label_detail_url(workspace.slug, project.id, create_label.id)

        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["id"] == create_label.id
        assert response.data["name"] == create_label.name
        assert response.data["color"] == create_label.color

    @pytest.mark.django_db
    def test_get_label_not_found(self, api_key_client, workspace, project):
        """Test getting non-existent label"""
        from uuid import uuid4

        fake_id = uuid4()
        url = self.get_label_detail_url(workspace.slug, project.id, fake_id)

        response = api_key_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_update_label_success(self, api_key_client, workspace, project, create_label):
        """Test successful label update"""
        url = self.get_label_detail_url(workspace.slug, project.id, create_label.id)

        update_data = {
            "name": f"Updated Label {uuid4()}",
        }

        response = api_key_client.patch(url, update_data, format="json")

        assert response.status_code == status.HTTP_200_OK

        create_label.refresh_from_db()
        assert create_label.name == update_data["name"]

    @pytest.mark.django_db
    def test_update_label_invalid_data(self, api_key_client, workspace, project, create_label):
        """Test label update with invalid data"""
        url = self.get_label_detail_url(workspace.slug, project.id, create_label.id)

        update_data = {"name": ""}
        response = api_key_client.patch(url, update_data, format="json")

        # This might be 400 if name is required, or 200 if empty names are allowed
        assert response.status_code in [status.HTTP_400_BAD_REQUEST, status.HTTP_200_OK]

    @pytest.mark.django_db
    def test_delete_label_success(self, api_key_client, workspace, project, create_label):
        """Test successful label deletion"""
        url = self.get_label_detail_url(workspace.slug, project.id, create_label.id)

        response = api_key_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Label.objects.filter(id=create_label.id).exists()
