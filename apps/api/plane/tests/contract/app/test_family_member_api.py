"""
Contract tests for FamilyMember API endpoints in native environment.

Tests FamilyMember API endpoints to verify they work correctly in native (non-Docker) deployment.
Task: T033 - Test FamilyMember API endpoints in native environment

Endpoints tested:
- GET /api/families/<id>/members/ - List family members
- POST /api/families/<id>/members/ - Create family member
- GET /api/families/<id>/members/<id>/ - Retrieve family member
- PUT/PATCH /api/families/<id>/members/<id>/ - Update family member
"""

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import Family, FamilyMember, User, FamilyRole


@pytest.mark.contract
class TestFamilyMemberAPIEndpoints:
    """Test FamilyMember API endpoints in native environment"""

    @pytest.fixture
    def family_with_parent(self, create_user):
        """Create a family with the user as a parent member"""
        family = Family.objects.create(
            name="Test Family",
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
        return family

    def test_list_family_members(self, session_client, family_with_parent, create_user):
        """Test listing family members"""
        response = session_client.get(f"/api/families/{family_with_parent.id}/members/")
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)
        assert len(response.data) == 1
        assert response.data[0]["role"] == FamilyRole.PARENT
        assert response.data[0]["user_email"] == create_user.email

    def test_list_family_members_multiple(self, session_client, family_with_parent, create_user):
        """Test listing family members when there are multiple members"""
        # Add a child member
        child_user = User.objects.create_user(
            email="child@example.com",
            password="testpass",
            display_name="Child User"
        )
        FamilyMember.objects.create(
            user=child_user,
            family=family_with_parent,
            name="Child",
            age=10,
            role=FamilyRole.CHILD,
            created_by=create_user
        )
        
        response = session_client.get(f"/api/families/{family_with_parent.id}/members/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2
        # Should be ordered by family name, then member name
        roles = [member["role"] for member in response.data]
        assert FamilyRole.PARENT in roles
        assert FamilyRole.CHILD in roles

    def test_list_family_members_not_member(self, session_client):
        """Test listing members of a family the user is not a member of"""
        # Create another user and family
        other_user = User.objects.create_user(
            email="other@example.com",
            password="testpass",
            display_name="Other User"
        )
        other_family = Family.objects.create(
            name="Other Family",
            sprint_duration=7,
            created_by=other_user
        )
        FamilyMember.objects.create(
            user=other_user,
            family=other_family,
            name=other_user.display_name,
            role=FamilyRole.PARENT,
            created_by=other_user
        )
        
        # Try to list members as different user
        response = session_client.get(f"/api/families/{other_family.id}/members/")
        assert response.status_code == status.HTTP_200_OK
        # Should return empty list (user can't see members of families they're not in)
        assert len(response.data) == 0

    def test_create_family_member_as_parent(self, session_client, family_with_parent, create_user):
        """Test creating a family member as a parent"""
        # Create a new user to add as member
        new_user = User.objects.create_user(
            email="newmember@example.com",
            password="testpass",
            display_name="New Member"
        )
        
        data = {
            "family": family_with_parent.id,
            "user": new_user.id,
            "name": "New Member",
            "role": FamilyRole.CHILD,
            "age": 8
        }
        
        response = session_client.post(
            f"/api/families/{family_with_parent.id}/members/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "New Member"
        assert response.data["role"] == FamilyRole.CHILD
        assert response.data["age"] == 8
        
        # Verify member was created
        member = FamilyMember.objects.get(id=response.data["id"])
        assert member.family == family_with_parent
        assert member.user == new_user

    def test_create_family_member_as_child_forbidden(self, session_client, family_with_parent, create_user):
        """Test that children cannot add family members"""
        # Create a child user and add them to the family
        child_user = User.objects.create_user(
            email="child2@example.com",
            password="testpass",
            display_name="Child User"
        )
        child_member = FamilyMember.objects.create(
            user=child_user,
            family=family_with_parent,
            name="Child",
            age=10,
            role=FamilyRole.CHILD,
            created_by=create_user
        )
        
        # Try to create a member as the child
        new_user = User.objects.create_user(
            email="newmember2@example.com",
            password="testpass",
            display_name="New Member 2"
        )
        
        # Authenticate as child user
        client = APIClient()
        client.force_authenticate(user=child_user)
        
        data = {
            "family": family_with_parent.id,
            "user": new_user.id,
            "name": "New Member",
            "role": FamilyRole.CHILD,
            "age": 7
        }
        
        response = client.post(
            f"/api/families/{family_with_parent.id}/members/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "Only parents can add family members" in str(response.data)

    def test_create_family_member_validation_age_required_for_child(self, session_client, family_with_parent, create_user):
        """Test that age is required when creating a child member"""
        new_user = User.objects.create_user(
            email="child3@example.com",
            password="testpass",
            display_name="Child User"
        )
        
        data = {
            "family": family_with_parent.id,
            "user": new_user.id,
            "name": "Child Without Age",
            "role": FamilyRole.CHILD
            # Missing age
        }
        
        response = session_client.post(
            f"/api/families/{family_with_parent.id}/members/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "age" in str(response.data).lower()

    def test_create_family_member_duplicate(self, session_client, family_with_parent, create_user):
        """Test creating a duplicate family member"""
        # User is already a member (created in fixture)
        data = {
            "family": family_with_parent.id,
            "user": create_user.id,
            "name": "Duplicate",
            "role": FamilyRole.PARENT
        }
        
        response = session_client.post(
            f"/api/families/{family_with_parent.id}/members/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "already a member" in str(response.data).lower()

    def test_retrieve_family_member(self, session_client, family_with_parent, create_user):
        """Test retrieving a specific family member"""
        member = FamilyMember.objects.get(family=family_with_parent, user=create_user)
        
        response = session_client.get(
            f"/api/families/{family_with_parent.id}/members/{member.id}/"
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["id"] == str(member.id)
        assert response.data["user_email"] == create_user.email
        assert response.data["role"] == FamilyRole.PARENT

    def test_retrieve_family_member_not_found(self, session_client, family_with_parent):
        """Test retrieving a non-existent family member"""
        import uuid
        fake_id = uuid.uuid4()
        response = session_client.get(
            f"/api/families/{family_with_parent.id}/members/{fake_id}/"
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_update_family_member_as_parent(self, session_client, family_with_parent, create_user):
        """Test updating a family member as a parent"""
        # Create a child member to update
        child_user = User.objects.create_user(
            email="child4@example.com",
            password="testpass",
            display_name="Child User"
        )
        child_member = FamilyMember.objects.create(
            user=child_user,
            family=family_with_parent,
            name="Child",
            age=8,
            role=FamilyRole.CHILD,
            created_by=create_user
        )
        
        # Update the child member
        data = {
            "name": "Updated Child Name",
            "age": 9
        }
        response = session_client.patch(
            f"/api/families/{family_with_parent.id}/members/{child_member.id}/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "Updated Child Name"
        assert response.data["age"] == 9
        
        # Verify update in database
        child_member.refresh_from_db()
        assert child_member.name == "Updated Child Name"
        assert child_member.age == 9

    def test_update_family_member_self(self, session_client, family_with_parent, create_user):
        """Test that a member can update themselves"""
        member = FamilyMember.objects.get(family=family_with_parent, user=create_user)
        
        data = {
            "name": "Updated My Name"
        }
        response = session_client.patch(
            f"/api/families/{family_with_parent.id}/members/{member.id}/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "Updated My Name"

    def test_update_family_member_as_child_forbidden(self, session_client, family_with_parent, create_user):
        """Test that a child cannot update other members"""
        # Create two child members
        child_user1 = User.objects.create_user(
            email="child5@example.com",
            password="testpass",
            display_name="Child User 1"
        )
        child_member1 = FamilyMember.objects.create(
            user=child_user1,
            family=family_with_parent,
            name="Child 1",
            age=8,
            role=FamilyRole.CHILD,
            created_by=create_user
        )
        
        child_user2 = User.objects.create_user(
            email="child6@example.com",
            password="testpass",
            display_name="Child User 2"
        )
        child_member2 = FamilyMember.objects.create(
            user=child_user2,
            family=family_with_parent,
            name="Child 2",
            age=9,
            role=FamilyRole.CHILD,
            created_by=create_user
        )
        
        # Try to update child_member2 as child_user1
        client = APIClient()
        client.force_authenticate(user=child_user1)
        
        data = {"name": "Hacked Name"}
        response = client.patch(
            f"/api/families/{family_with_parent.id}/members/{child_member2.id}/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "Only parents can update other family members" in str(response.data)

    def test_update_family_member_validation(self, session_client, family_with_parent, create_user):
        """Test validation when updating family member"""
        child_user = User.objects.create_user(
            email="child7@example.com",
            password="testpass",
            display_name="Child User"
        )
        child_member = FamilyMember.objects.create(
            user=child_user,
            family=family_with_parent,
            name="Child",
            age=8,
            role=FamilyRole.CHILD,
            created_by=create_user
        )
        
        # Try to set invalid age
        data = {"age": 150}  # Invalid age
        response = session_client.patch(
            f"/api/families/{family_with_parent.id}/members/{child_member.id}/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_family_member_api_requires_authentication(self, api_client):
        """Test that FamilyMember API endpoints require authentication"""
        import uuid
        fake_family_id = uuid.uuid4()
        fake_member_id = uuid.uuid4()
        
        # Try to list members without authentication
        response = api_client.get(f"/api/families/{fake_family_id}/members/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        
        # Try to create member without authentication
        data = {
            "family": str(fake_family_id),
            "user": str(fake_member_id),
            "name": "Test",
            "role": FamilyRole.PARENT
        }
        response = api_client.post(f"/api/families/{fake_family_id}/members/", data, format="json")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_family_members_filters_by_family(self, session_client, create_user):
        """Test that listing members filters by family_id in URL"""
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
        
        family2 = Family.objects.create(
            name="Family 2",
            sprint_duration=7,
            created_by=create_user
        )
        FamilyMember.objects.create(
            user=create_user,
            family=family2,
            name=create_user.display_name or create_user.email,
            role=FamilyRole.PARENT,
            created_by=create_user
        )
        
        # List members of family1 only
        response = session_client.get(f"/api/families/{family1.id}/members/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        # Verify it's the right family (check family_name in response)
        assert any(member.get("family_name") == "Family 1" for member in response.data)

