"""
Contract tests for Family API endpoints in native environment.

Tests Family API endpoints to verify they work correctly in native (non-Docker) deployment.
Task: T032 - Test Family API endpoints in native environment

Endpoints tested:
- GET /api/families/ - List families
- POST /api/families/ - Create family
- GET /api/families/<id>/ - Retrieve family
- PUT/PATCH /api/families/<id>/ - Update family
"""

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import Family, FamilyMember, User, FamilyRole


@pytest.mark.contract
class TestFamilyAPIEndpoints:
    """Test Family API endpoints in native environment"""

    def test_list_families_empty(self, session_client):
        """Test listing families when user has no families"""
        response = session_client.get("/api/families/")
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)
        assert len(response.data) == 0

    def test_list_families_with_data(self, session_client, create_user):
        """Test listing families when user is a member"""
        # Create a family and add user as member
        family = Family.objects.create(
            name="The Smiths",
            sprint_duration=7,
            created_by=create_user
        )
        FamilyMember.objects.create(
            user=create_user,
            family=family,
            name=create_user.display_name or create_user.email,
            role=FamilyRole.PARENT,
            created_by=create_user
        )
        
        response = session_client.get("/api/families/")
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)
        assert len(response.data) == 1
        assert response.data[0]["name"] == "The Smiths"

    def test_create_family(self, session_client, create_user):
        """Test creating a new family"""
        data = {
            "name": "The Johnsons",
            "sprint_duration": 7,
            "gamification_enabled": True
        }
        
        response = session_client.post("/api/families/", data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "The Johnsons"
        assert response.data["sprint_duration"] == 7
        assert response.data["gamification_enabled"] is True
        
        # Verify family was created in database
        family = Family.objects.get(id=response.data["id"])
        assert family.name == "The Johnsons"
        
        # Verify creator was automatically added as family member
        member = FamilyMember.objects.get(family=family, user=create_user)
        assert member.role == FamilyRole.PARENT
        assert member.is_active is True

    def test_create_family_minimal_data(self, session_client, create_user):
        """Test creating a family with minimal required data"""
        data = {
            "name": "Minimal Family"
        }
        
        response = session_client.post("/api/families/", data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "Minimal Family"
        # Check defaults
        assert response.data["sprint_duration"] == 7  # Default value
        assert response.data["gamification_enabled"] is True  # Default value

    def test_create_family_validation_error(self, session_client):
        """Test creating a family with invalid data"""
        # Missing required field
        data = {}
        response = session_client.post("/api/families/", data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        
        # Invalid sprint_duration
        data = {"name": "Test", "sprint_duration": 0}
        response = session_client.post("/api/families/", data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_retrieve_family(self, session_client, create_user):
        """Test retrieving a specific family"""
        # Create family and add user as member
        family = Family.objects.create(
            name="The Williams",
            sprint_duration=14,
            created_by=create_user
        )
        FamilyMember.objects.create(
            user=create_user,
            family=family,
            name=create_user.display_name or create_user.email,
            role=FamilyRole.PARENT,
            created_by=create_user
        )
        
        response = session_client.get(f"/api/families/{family.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["id"] == str(family.id)
        assert response.data["name"] == "The Williams"
        assert response.data["sprint_duration"] == 14

    def test_retrieve_family_not_found(self, session_client):
        """Test retrieving a non-existent family"""
        import uuid
        fake_id = uuid.uuid4()
        response = session_client.get(f"/api/families/{fake_id}/")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_retrieve_family_not_member(self, session_client, create_user):
        """Test retrieving a family the user is not a member of"""
        # Create another user and family
        other_user = User.objects.create_user(
            email="other@example.com",
            password="testpass",
            display_name="Other User"
        )
        family = Family.objects.create(
            name="Other Family",
            sprint_duration=7,
            created_by=other_user
        )
        FamilyMember.objects.create(
            user=other_user,
            family=family,
            name=other_user.display_name,
            role=FamilyRole.PARENT,
            created_by=other_user
        )
        
        # Try to retrieve as create_user (not a member)
        response = session_client.get(f"/api/families/{family.id}/")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_update_family(self, session_client, create_user):
        """Test updating a family"""
        # Create family and add user as member
        family = Family.objects.create(
            name="The Browns",
            sprint_duration=7,
            created_by=create_user
        )
        FamilyMember.objects.create(
            user=create_user,
            family=family,
            name=create_user.display_name or create_user.email,
            role=FamilyRole.PARENT,
            created_by=create_user
        )
        
        # Update family
        data = {
            "name": "The Browns Family",
            "sprint_duration": 14,
            "gamification_enabled": False
        }
        response = session_client.put(f"/api/families/{family.id}/", data, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "The Browns Family"
        assert response.data["sprint_duration"] == 14
        assert response.data["gamification_enabled"] is False
        
        # Verify update in database
        family.refresh_from_db()
        assert family.name == "The Browns Family"
        assert family.sprint_duration == 14

    def test_partial_update_family(self, session_client, create_user):
        """Test partial update (PATCH) of a family"""
        # Create family and add user as member
        family = Family.objects.create(
            name="The Andersons",
            sprint_duration=7,
            gamification_enabled=True,
            created_by=create_user
        )
        FamilyMember.objects.create(
            user=create_user,
            family=family,
            name=create_user.display_name or create_user.email,
            role=FamilyRole.PARENT,
            created_by=create_user
        )
        
        # Partial update - only change name
        data = {"name": "Updated Name"}
        response = session_client.patch(f"/api/families/{family.id}/", data, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "Updated Name"
        # Other fields should remain unchanged
        assert response.data["sprint_duration"] == 7
        assert response.data["gamification_enabled"] is True

    def test_update_family_not_member(self, session_client, create_user):
        """Test updating a family the user is not a member of"""
        # Create another user and family
        other_user = User.objects.create_user(
            email="other2@example.com",
            password="testpass",
            display_name="Other User 2"
        )
        family = Family.objects.create(
            name="Other Family 2",
            sprint_duration=7,
            created_by=other_user
        )
        FamilyMember.objects.create(
            user=other_user,
            family=family,
            name=other_user.display_name,
            role=FamilyRole.PARENT,
            created_by=other_user
        )
        
        # Try to update as create_user (not a member)
        data = {"name": "Hacked Name"}
        response = session_client.put(f"/api/families/{family.id}/", data, format="json")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_list_families_filtered_by_membership(self, session_client, create_user):
        """Test that users only see families they are members of"""
        # Create two families
        family1 = Family.objects.create(
            name="Family 1",
            sprint_duration=7,
            created_by=create_user
        )
        FamilyMember.objects.create(
            user=create_user,
            family=family1,
            name=create_user.display_name or create_user.email,
            role=FamilyRole.PARENT,
            created_by=create_user
        )
        
        # Create another user and family
        other_user = User.objects.create_user(
            email="other3@example.com",
            password="testpass",
            display_name="Other User 3"
        )
        family2 = Family.objects.create(
            name="Family 2",
            sprint_duration=7,
            created_by=other_user
        )
        FamilyMember.objects.create(
            user=other_user,
            family=family2,
            name=other_user.display_name,
            role=FamilyRole.PARENT,
            created_by=other_user
        )
        
        # User should only see family1
        response = session_client.get("/api/families/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["name"] == "Family 1"

    def test_family_api_requires_authentication(self, api_client):
        """Test that Family API endpoints require authentication"""
        # Try to list families without authentication
        response = api_client.get("/api/families/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        
        # Try to create family without authentication
        data = {"name": "Test Family"}
        response = api_client.post("/api/families/", data, format="json")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

