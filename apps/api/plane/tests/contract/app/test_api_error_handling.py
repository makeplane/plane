"""
Contract tests for API error handling and validation in native environment.

Tests API error handling and validation to verify they work correctly 
in native (non-Docker) deployment.
Task: T036 - Test API error handling and validation in native environment

Tests:
- Invalid request formats
- Missing required fields
- Validation errors
- Missing permissions
- Not found errors
- Error response formats
- Edge cases
"""

import pytest
from rest_framework import status
from rest_framework.test import APIClient
import json

from plane.db.models import Family, FamilyMember, BacklogItem, User, FamilyRole, BacklogItemStatus


@pytest.mark.contract
class TestAPIErrorHandling:
    """Test API error handling and validation in native environment"""

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

    @pytest.fixture
    def parent_member(self, family_with_parent, create_user):
        """Get the parent member"""
        return FamilyMember.objects.get(family=family_with_parent, user=create_user)

    def test_malformed_json_request(self, session_client):
        """Test handling of malformed JSON in request body"""
        response = session_client.post(
            "/api/families/",
            data="not valid json",
            content_type="application/json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_family_create_missing_required_field(self, session_client):
        """Test creating family with missing required field (name)"""
        data = {
            "sprint_duration": 7
            # Missing "name"
        }
        response = session_client.post("/api/families/", data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "name" in str(response.data).lower()

    def test_family_create_empty_name(self, session_client):
        """Test creating family with empty name"""
        data = {"name": ""}
        response = session_client.post("/api/families/", data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_family_create_whitespace_name(self, session_client):
        """Test creating family with whitespace-only name"""
        data = {"name": "   "}
        response = session_client.post("/api/families/", data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_family_create_invalid_sprint_duration(self, session_client):
        """Test creating family with invalid sprint duration"""
        # Too low
        data = {"name": "Test", "sprint_duration": 0}
        response = session_client.post("/api/families/", data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        
        # Too high
        data = {"name": "Test", "sprint_duration": 31}
        response = session_client.post("/api/families/", data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_family_create_wrong_data_type(self, session_client):
        """Test creating family with wrong data types"""
        # String instead of integer for sprint_duration
        data = {"name": "Test", "sprint_duration": "seven"}
        response = session_client.post("/api/families/", data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_family_retrieve_not_found(self, session_client):
        """Test retrieving non-existent family"""
        import uuid
        fake_id = uuid.uuid4()
        response = session_client.get(f"/api/families/{fake_id}/")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "not found" in str(response.data).lower() or response.data is None

    def test_family_member_create_missing_required_fields(self, session_client, family_with_parent):
        """Test creating family member with missing required fields"""
        # Missing user
        data = {
            "family": family_with_parent.id,
            "name": "Test",
            "role": FamilyRole.PARENT
        }
        response = session_client.post(
            f"/api/families/{family_with_parent.id}/members/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        
        # Missing name
        new_user = User.objects.create_user(
            email="newuser@example.com",
            password="testpass",
            display_name="New User"
        )
        data = {
            "family": family_with_parent.id,
            "user": new_user.id,
            "role": FamilyRole.PARENT
        }
        response = session_client.post(
            f"/api/families/{family_with_parent.id}/members/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_family_member_create_child_missing_age(self, session_client, family_with_parent):
        """Test creating child member without required age"""
        new_user = User.objects.create_user(
            email="child@example.com",
            password="testpass",
            display_name="Child User"
        )
        data = {
            "family": family_with_parent.id,
            "user": new_user.id,
            "name": "Child",
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

    def test_family_member_create_invalid_age(self, session_client, family_with_parent):
        """Test creating member with invalid age"""
        new_user = User.objects.create_user(
            email="child2@example.com",
            password="testpass",
            display_name="Child User 2"
        )
        # Negative age
        data = {
            "family": family_with_parent.id,
            "user": new_user.id,
            "name": "Child",
            "role": FamilyRole.CHILD,
            "age": -1
        }
        response = session_client.post(
            f"/api/families/{family_with_parent.id}/members/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        
        # Age too high
        data["age"] = 121
        response = session_client.post(
            f"/api/families/{family_with_parent.id}/members/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_family_member_create_invalid_role(self, session_client, family_with_parent):
        """Test creating member with invalid role"""
        new_user = User.objects.create_user(
            email="user3@example.com",
            password="testpass",
            display_name="User 3"
        )
        data = {
            "family": family_with_parent.id,
            "user": new_user.id,
            "name": "User",
            "role": "invalid_role"
        }
        response = session_client.post(
            f"/api/families/{family_with_parent.id}/members/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_family_member_retrieve_not_found(self, session_client, family_with_parent):
        """Test retrieving non-existent family member"""
        import uuid
        fake_id = uuid.uuid4()
        response = session_client.get(
            f"/api/families/{family_with_parent.id}/members/{fake_id}/"
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_backlog_item_create_missing_required_fields(self, session_client, family_with_parent, parent_member):
        """Test creating backlog item with missing required fields"""
        # Missing title
        data = {
            "category": "Chores",
            "priority": 1
        }
        response = session_client.post(
            f"/api/families/{family_with_parent.id}/backlog/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        
        # Missing category
        data = {
            "title": "Test Task",
            "priority": 1
        }
        response = session_client.post(
            f"/api/families/{family_with_parent.id}/backlog/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_backlog_item_create_empty_title(self, session_client, family_with_parent, parent_member):
        """Test creating backlog item with empty title"""
        data = {
            "title": "",
            "category": "Chores",
            "priority": 1
        }
        response = session_client.post(
            f"/api/families/{family_with_parent.id}/backlog/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_backlog_item_create_whitespace_title(self, session_client, family_with_parent, parent_member):
        """Test creating backlog item with whitespace-only title"""
        data = {
            "title": "   ",
            "category": "Chores",
            "priority": 1
        }
        response = session_client.post(
            f"/api/families/{family_with_parent.id}/backlog/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_backlog_item_create_invalid_category(self, session_client, family_with_parent, parent_member):
        """Test creating backlog item with invalid category (not in swim lanes)"""
        data = {
            "title": "Test Task",
            "category": "Invalid Category",
            "priority": 1
        }
        response = session_client.post(
            f"/api/families/{family_with_parent.id}/backlog/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "category" in str(response.data).lower() or "swim lanes" in str(response.data).lower()

    def test_backlog_item_create_invalid_priority(self, session_client, family_with_parent, parent_member):
        """Test creating backlog item with invalid priority"""
        # Negative priority
        data = {
            "title": "Test Task",
            "category": "Chores",
            "priority": -1
        }
        response = session_client.post(
            f"/api/families/{family_with_parent.id}/backlog/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_backlog_item_create_invalid_story_points(self, session_client, family_with_parent, parent_member):
        """Test creating backlog item with invalid story points"""
        # Too low
        data = {
            "title": "Test Task",
            "category": "Chores",
            "priority": 1,
            "story_points": 0
        }
        response = session_client.post(
            f"/api/families/{family_with_parent.id}/backlog/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        
        # Too high
        data["story_points"] = 6
        response = session_client.post(
            f"/api/families/{family_with_parent.id}/backlog/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_backlog_item_create_invalid_status(self, session_client, family_with_parent, parent_member):
        """Test creating backlog item with invalid status"""
        data = {
            "title": "Test Task",
            "category": "Chores",
            "priority": 1,
            "status": "invalid_status"
        }
        response = session_client.post(
            f"/api/families/{family_with_parent.id}/backlog/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_backlog_item_retrieve_not_found(self, session_client, family_with_parent):
        """Test retrieving non-existent backlog item"""
        import uuid
        fake_id = uuid.uuid4()
        response = session_client.get(
            f"/api/families/{family_with_parent.id}/backlog/{fake_id}/"
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_backlog_item_update_invalid_data(self, session_client, family_with_parent, parent_member):
        """Test updating backlog item with invalid data"""
        item = BacklogItem.objects.create(
            family=family_with_parent,
            title="Test Task",
            category="Chores",
            priority=1,
            creator=parent_member,
            created_by=parent_member.user
        )
        
        # Invalid story points
        data = {"story_points": 10}
        response = session_client.patch(
            f"/api/families/{family_with_parent.id}/backlog/{item.id}/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_backlog_item_reorder_invalid_format(self, session_client, family_with_parent, parent_member):
        """Test reordering backlog items with invalid format"""
        # Not a list
        data = {"item_ids": "not-a-list"}
        response = session_client.post(
            f"/api/families/{family_with_parent.id}/backlog/reorder/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        
        # Missing item_ids
        data = {}
        response = session_client.post(
            f"/api/families/{family_with_parent.id}/backlog/reorder/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_backlog_item_reorder_items_from_other_family(self, session_client, family_with_parent, parent_member):
        """Test reordering with items from different family"""
        # Create another family and item
        other_family = Family.objects.create(
            name="Other Family",
            sprint_duration=7,
            created_by=parent_member.user
        )
        other_member = FamilyMember.objects.create(
            user=parent_member.user,
            family=other_family,
            name=parent_member.user.display_name,
            role=FamilyRole.PARENT,
            created_by=parent_member.user
        )
        other_item = BacklogItem.objects.create(
            family=other_family,
            title="Other Item",
            category="Chores",
            priority=1,
            creator=other_member,
            created_by=parent_member.user
        )
        
        # Try to reorder with item from other family
        data = {"item_ids": [str(other_item.id)]}
        response = session_client.post(
            f"/api/families/{family_with_parent.id}/backlog/reorder/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_permission_denied_child_creating_backlog(self, family_with_parent, create_user):
        """Test 403 error when child tries to create backlog item"""
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
        
        client = APIClient()
        client.force_authenticate(user=child_user)
        
        data = {
            "title": "Child Task",
            "category": "Chores",
            "priority": 1
        }
        response = client.post(
            f"/api/families/{family_with_parent.id}/backlog/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "error" in response.data or "permission" in str(response.data).lower()

    def test_permission_denied_child_adding_member(self, family_with_parent, create_user):
        """Test 403 error when child tries to add family member"""
        child_user = User.objects.create_user(
            email="child2@example.com",
            password="testpass",
            display_name="Child User 2"
        )
        FamilyMember.objects.create(
            user=child_user,
            family=family_with_parent,
            name="Child",
            age=10,
            role=FamilyRole.CHILD,
            created_by=create_user
        )
        
        client = APIClient()
        client.force_authenticate(user=child_user)
        
        new_user = User.objects.create_user(
            email="newuser@example.com",
            password="testpass",
            display_name="New User"
        )
        data = {
            "family": family_with_parent.id,
            "user": new_user.id,
            "name": "New Member",
            "role": FamilyRole.CHILD,
            "age": 8
        }
        response = client.post(
            f"/api/families/{family_with_parent.id}/members/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_error_response_format(self, session_client):
        """Test that error responses have consistent format"""
        # Test validation error format
        data = {"name": ""}  # Invalid
        response = session_client.post("/api/families/", data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        # Should have error details
        assert response.data is not None
        
        # Test not found error format
        import uuid
        fake_id = uuid.uuid4()
        response = session_client.get(f"/api/families/{fake_id}/")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_invalid_uuid_format(self, session_client):
        """Test handling of invalid UUID format in URL"""
        # Invalid UUID format
        response = session_client.get("/api/families/not-a-uuid/")
        assert response.status_code == status.HTTP_404_NOT_FOUND or response.status_code == status.HTTP_400_BAD_REQUEST

    def test_boundary_values_sprint_duration(self, session_client):
        """Test boundary values for sprint duration"""
        # Minimum valid
        data = {"name": "Test", "sprint_duration": 1}
        response = session_client.post("/api/families/", data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        
        # Maximum valid
        data = {"name": "Test 2", "sprint_duration": 30}
        response = session_client.post("/api/families/", data, format="json")
        assert response.status_code == status.HTTP_201_CREATED

    def test_boundary_values_story_points(self, session_client, family_with_parent, parent_member):
        """Test boundary values for story points"""
        # Minimum valid
        data = {
            "title": "Test",
            "category": "Chores",
            "priority": 1,
            "story_points": 1
        }
        response = session_client.post(
            f"/api/families/{family_with_parent.id}/backlog/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_201_CREATED
        
        # Maximum valid
        data = {
            "title": "Test 2",
            "category": "Chores",
            "priority": 1,
            "story_points": 5
        }
        response = session_client.post(
            f"/api/families/{family_with_parent.id}/backlog/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_201_CREATED

    def test_null_values_handling(self, session_client, family_with_parent, parent_member):
        """Test handling of null values in optional fields"""
        # Story points can be null
        data = {
            "title": "Test",
            "category": "Chores",
            "priority": 1,
            "story_points": None
        }
        response = session_client.post(
            f"/api/families/{family_with_parent.id}/backlog/",
            data,
            format="json"
        )
        # Should either accept null or convert to not provided
        assert response.status_code in [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST]

    def test_very_long_strings(self, session_client):
        """Test handling of very long strings"""
        # Very long name (should be rejected if exceeds max_length)
        data = {"name": "A" * 300}  # Exceeds max_length=200
        response = session_client.post("/api/families/", data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_special_characters_in_names(self, session_client):
        """Test handling of special characters in names"""
        # Special characters should be allowed (or handled gracefully)
        data = {"name": "Family's Test & More < >"}
        response = session_client.post("/api/families/", data, format="json")
        # Should either accept or reject gracefully
        assert response.status_code in [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST]

