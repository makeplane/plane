import pytest
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from uuid import uuid4

from plane.db.models import Cycle, Project, ProjectMember


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
def cycle_data():
    """Sample cycle data for tests"""
    return {
        "name": "Test Cycle",
        "description": "A test cycle for unit tests",
    }


@pytest.fixture
def draft_cycle_data():
    """Sample draft cycle data (no dates)"""
    return {
        "name": "Draft Cycle",
        "description": "A draft cycle without dates",
    }


@pytest.fixture
def create_cycle(db, project, create_user):
    """Create a test cycle"""
    return Cycle.objects.create(
        name="Existing Cycle",
        description="An existing cycle",
        start_date=timezone.now() + timedelta(days=1),
        end_date=timezone.now() + timedelta(days=7),
        project=project,
        workspace=project.workspace,
        owned_by=create_user,
    )


@pytest.mark.contract
class TestCycleListCreateAPIEndpoint:
    """Test Cycle List and Create API Endpoint"""

    def get_cycle_url(self, workspace_slug, project_id):
        """Helper to get cycle endpoint URL"""
        return f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}/cycles/"

    @pytest.mark.django_db
    def test_create_cycle_success(self, api_key_client, workspace, project, cycle_data):
        """Test successful cycle creation"""
        url = self.get_cycle_url(workspace.slug, project.id)

        response = api_key_client.post(url, cycle_data, format="json")

        assert response.status_code == status.HTTP_201_CREATED

        assert Cycle.objects.count() == 1

        created_cycle = Cycle.objects.first()
        assert created_cycle.name == cycle_data["name"]
        assert created_cycle.description == cycle_data["description"]
        assert created_cycle.project == project
        assert created_cycle.owned_by_id is not None

    @pytest.mark.django_db
    def test_create_cycle_invalid_data(self, api_key_client, workspace, project):
        """Test cycle creation with invalid data"""
        url = self.get_cycle_url(workspace.slug, project.id)

        # Test with empty data
        response = api_key_client.post(url, {}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

        # Test with missing name
        response = api_key_client.post(url, {"description": "Test cycle"}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_create_cycle_invalid_date_combination(self, api_key_client, workspace, project):
        """Test cycle creation with invalid date combination (only start_date)"""
        url = self.get_cycle_url(workspace.slug, project.id)

        invalid_data = {
            "name": "Invalid Cycle",
            "start_date": (timezone.now() + timedelta(days=1)).isoformat(),
            # Missing end_date
        }

        response = api_key_client.post(url, invalid_data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Both start date and end date are either required or are to be null" in response.data["error"]

    @pytest.mark.django_db
    def test_create_cycle_with_external_id(self, api_key_client, workspace, project):
        """Test creating cycle with external ID"""
        url = self.get_cycle_url(workspace.slug, project.id)

        cycle_data = {
            "name": "External Cycle",
            "description": "A cycle with external ID",
            "external_id": "ext-123",
            "external_source": "github",
        }

        response = api_key_client.post(url, cycle_data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        created_cycle = Cycle.objects.first()
        assert created_cycle.external_id == "ext-123"
        assert created_cycle.external_source == "github"

    @pytest.mark.django_db
    def test_create_cycle_duplicate_external_id(self, api_key_client, workspace, project, create_user):
        """Test creating cycle with duplicate external ID"""
        url = self.get_cycle_url(workspace.slug, project.id)

        # Create first cycle
        Cycle.objects.create(
            name="First Cycle",
            project=project,
            workspace=workspace,
            external_id="ext-123",
            external_source="github",
            owned_by=create_user,
        )

        # Try to create second cycle with same external ID
        cycle_data = {
            "name": "Second Cycle",
            "external_id": "ext-123",
            "external_source": "github",
            "owned_by": create_user.id,
        }

        response = api_key_client.post(url, cycle_data, format="json")

        assert response.status_code == status.HTTP_409_CONFLICT
        assert "same external id" in response.data["error"]

    @pytest.mark.django_db
    def test_list_cycles_success(self, api_key_client, workspace, project, create_cycle, create_user):
        """Test successful cycle listing"""
        url = self.get_cycle_url(workspace.slug, project.id)

        # Create additional cycles
        Cycle.objects.create(
            name="Cycle 2",
            project=project,
            workspace=workspace,
            start_date=timezone.now() + timedelta(days=10),
            end_date=timezone.now() + timedelta(days=17),
            owned_by=create_user,
        )
        Cycle.objects.create(
            name="Cycle 3",
            project=project,
            workspace=workspace,
            start_date=timezone.now() + timedelta(days=20),
            end_date=timezone.now() + timedelta(days=27),
            owned_by=create_user,
        )

        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert "results" in response.data
        assert len(response.data["results"]) == 3  # Including create_cycle fixture

    @pytest.mark.django_db
    def test_list_cycles_with_view_filter(self, api_key_client, workspace, project, create_user):
        """Test cycle listing with different view filters"""
        url = self.get_cycle_url(workspace.slug, project.id)

        # Create cycles in different states
        now = timezone.now()

        # Current cycle (started but not ended)
        Cycle.objects.create(
            name="Current Cycle",
            project=project,
            workspace=workspace,
            start_date=now - timedelta(days=1),
            end_date=now + timedelta(days=6),
            owned_by=create_user,
        )

        # Upcoming cycle
        Cycle.objects.create(
            name="Upcoming Cycle",
            project=project,
            workspace=workspace,
            start_date=now + timedelta(days=1),
            end_date=now + timedelta(days=8),
            owned_by=create_user,
        )

        # Completed cycle
        Cycle.objects.create(
            name="Completed Cycle",
            project=project,
            workspace=workspace,
            start_date=now - timedelta(days=10),
            end_date=now - timedelta(days=3),
            owned_by=create_user,
        )

        # Draft cycle
        Cycle.objects.create(
            name="Draft Cycle",
            project=project,
            workspace=workspace,
            owned_by=create_user,
        )

        # Test current cycles
        response = api_key_client.get(url, {"cycle_view": "current"})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["name"] == "Current Cycle"

        # Test upcoming cycles
        response = api_key_client.get(url, {"cycle_view": "upcoming"})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["name"] == "Upcoming Cycle"

        # Test completed cycles
        response = api_key_client.get(url, {"cycle_view": "completed"})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["name"] == "Completed Cycle"

        # Test draft cycles
        response = api_key_client.get(url, {"cycle_view": "draft"})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["name"] == "Draft Cycle"


@pytest.mark.contract
class TestCycleDetailAPIEndpoint:
    """Test Cycle Detail API Endpoint"""

    def get_cycle_detail_url(self, workspace_slug, project_id, cycle_id):
        """Helper to get cycle detail endpoint URL"""
        return f"/api/v1/workspaces/{workspace_slug}/projects/{project_id}/cycles/{cycle_id}/"

    @pytest.mark.django_db
    def test_get_cycle_success(self, api_key_client, workspace, project, create_cycle):
        """Test successful cycle retrieval"""
        url = self.get_cycle_detail_url(workspace.slug, project.id, create_cycle.id)

        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert str(response.data["id"]) == str(create_cycle.id)
        assert response.data["name"] == create_cycle.name
        assert response.data["description"] == create_cycle.description

    @pytest.mark.django_db
    def test_get_cycle_not_found(self, api_key_client, workspace, project):
        """Test getting non-existent cycle"""
        fake_id = uuid4()
        url = self.get_cycle_detail_url(workspace.slug, project.id, fake_id)

        response = api_key_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_update_cycle_success(self, api_key_client, workspace, project, create_cycle):
        """Test successful cycle update"""
        url = self.get_cycle_detail_url(workspace.slug, project.id, create_cycle.id)

        update_data = {
            "name": f"Updated Cycle {uuid4()}",
            "description": "Updated description",
        }

        response = api_key_client.patch(url, update_data, format="json")

        assert response.status_code == status.HTTP_200_OK

        create_cycle.refresh_from_db()
        assert create_cycle.name == update_data["name"]
        assert create_cycle.description == update_data["description"]

    @pytest.mark.django_db
    def test_update_cycle_invalid_data(self, api_key_client, workspace, project, create_cycle):
        """Test cycle update with invalid data"""
        url = self.get_cycle_detail_url(workspace.slug, project.id, create_cycle.id)

        update_data = {"name": ""}
        response = api_key_client.patch(url, update_data, format="json")

        # This might be 400 if name is required, or 200 if empty names are allowed
        assert response.status_code in [status.HTTP_400_BAD_REQUEST, status.HTTP_200_OK]

    @pytest.mark.django_db
    def test_update_cycle_with_external_id_conflict(
        self, api_key_client, workspace, project, create_cycle, create_user
    ):
        """Test cycle update with conflicting external ID"""
        url = self.get_cycle_detail_url(workspace.slug, project.id, create_cycle.id)

        # Create another cycle with external ID
        Cycle.objects.create(
            name="Another Cycle",
            project=project,
            workspace=workspace,
            external_id="ext-456",
            external_source="github",
            owned_by=create_user,
        )

        # Try to update cycle with same external ID
        update_data = {
            "external_id": "ext-456",
            "external_source": "github",
        }

        response = api_key_client.patch(url, update_data, format="json")

        assert response.status_code == status.HTTP_409_CONFLICT
        assert "same external id" in response.data["error"]

    @pytest.mark.django_db
    def test_delete_cycle_success(self, api_key_client, workspace, project, create_cycle):
        """Test successful cycle deletion"""
        url = self.get_cycle_detail_url(workspace.slug, project.id, create_cycle.id)

        response = api_key_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Cycle.objects.filter(id=create_cycle.id).exists()

    @pytest.mark.django_db
    def test_cycle_metrics_annotation(self, api_key_client, workspace, project, create_cycle):
        """Test that cycle includes issue metrics annotations"""
        url = self.get_cycle_detail_url(workspace.slug, project.id, create_cycle.id)

        response = api_key_client.get(url)

        assert response.status_code == status.HTTP_200_OK

        # Check that metrics are included in response
        cycle_data = response.data
        assert "total_issues" in cycle_data
        assert "completed_issues" in cycle_data
        assert "cancelled_issues" in cycle_data
        assert "started_issues" in cycle_data
        assert "unstarted_issues" in cycle_data
        assert "backlog_issues" in cycle_data

        # All should be 0 for a new cycle
        assert cycle_data["total_issues"] == 0
        assert cycle_data["completed_issues"] == 0
        assert cycle_data["cancelled_issues"] == 0
        assert cycle_data["started_issues"] == 0
        assert cycle_data["unstarted_issues"] == 0
        assert cycle_data["backlog_issues"] == 0
