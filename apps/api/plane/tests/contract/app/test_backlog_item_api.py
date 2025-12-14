"""
Contract tests for BacklogItem API endpoints in native environment.

Tests BacklogItem API endpoints to verify they work correctly in native (non-Docker) deployment.
Task: T034 - Test BacklogItem API endpoints in native environment

Endpoints tested:
- GET /api/families/<id>/backlog/ - List backlog items
- POST /api/families/<id>/backlog/ - Create backlog item
- GET /api/families/<id>/backlog/<id>/ - Retrieve backlog item
- PUT/PATCH /api/families/<id>/backlog/<id>/ - Update backlog item
- DELETE /api/families/<id>/backlog/<id>/ - Delete backlog item
- POST /api/families/<id>/backlog/reorder/ - Reorder backlog items
"""

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import Family, FamilyMember, BacklogItem, User, FamilyRole, BacklogItemStatus


@pytest.mark.contract
class TestBacklogItemAPIEndpoints:
    """Test BacklogItem API endpoints in native environment"""

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

    def test_list_backlog_items_empty(self, session_client, family_with_parent):
        """Test listing backlog items when there are none"""
        response = session_client.get(f"/api/families/{family_with_parent.id}/backlog/")
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)
        assert len(response.data) == 0

    def test_list_backlog_items_with_data(self, session_client, family_with_parent, parent_member):
        """Test listing backlog items"""
        # Create some backlog items
        item1 = BacklogItem.objects.create(
            family=family_with_parent,
            title="Task 1",
            category="Chores",
            priority=5,
            creator=parent_member,
            created_by=parent_member.user
        )
        item2 = BacklogItem.objects.create(
            family=family_with_parent,
            title="Task 2",
            category="Home Projects",
            priority=3,
            creator=parent_member,
            created_by=parent_member.user
        )
        
        response = session_client.get(f"/api/families/{family_with_parent.id}/backlog/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2
        # Should be ordered by priority descending
        titles = [item["title"] for item in response.data]
        assert "Task 1" in titles
        assert "Task 2" in titles

    def test_list_backlog_items_filter_by_category(self, session_client, family_with_parent, parent_member):
        """Test filtering backlog items by category"""
        BacklogItem.objects.create(
            family=family_with_parent,
            title="Chore Task",
            category="Chores",
            priority=5,
            creator=parent_member,
            created_by=parent_member.user
        )
        BacklogItem.objects.create(
            family=family_with_parent,
            title="Project Task",
            category="Home Projects",
            priority=3,
            creator=parent_member,
            created_by=parent_member.user
        )
        
        response = session_client.get(
            f"/api/families/{family_with_parent.id}/backlog/",
            {"category": "Chores"}
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["category"] == "Chores"

    def test_list_backlog_items_filter_by_status(self, session_client, family_with_parent, parent_member):
        """Test filtering backlog items by status"""
        BacklogItem.objects.create(
            family=family_with_parent,
            title="Backlog Task",
            category="Chores",
            status=BacklogItemStatus.BACKLOG,
            priority=5,
            creator=parent_member,
            created_by=parent_member.user
        )
        BacklogItem.objects.create(
            family=family_with_parent,
            title="Sprint Task",
            category="Chores",
            status=BacklogItemStatus.SPRINT,
            priority=3,
            creator=parent_member,
            created_by=parent_member.user
        )
        
        response = session_client.get(
            f"/api/families/{family_with_parent.id}/backlog/",
            {"status": BacklogItemStatus.BACKLOG}
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["status"] == BacklogItemStatus.BACKLOG

    def test_list_backlog_items_not_member(self, session_client):
        """Test listing backlog items when user is not a member"""
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
        
        # Try to list backlog items as different user
        response = session_client.get(f"/api/families/{other_family.id}/backlog/")
        assert response.status_code == status.HTTP_200_OK
        # Should return empty list (user can't see items of families they're not in)
        assert len(response.data) == 0

    def test_create_backlog_item_as_parent(self, session_client, family_with_parent, parent_member):
        """Test creating a backlog item as a parent"""
        data = {
            "title": "New Task",
            "description": "Task description",
            "category": "Chores",
            "priority": 5,
            "story_points": 3
        }
        
        response = session_client.post(
            f"/api/families/{family_with_parent.id}/backlog/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["title"] == "New Task"
        assert response.data["category"] == "Chores"
        assert response.data["priority"] == 5
        assert response.data["story_points"] == 3
        assert response.data["status"] == BacklogItemStatus.BACKLOG  # Default
        
        # Verify item was created
        item = BacklogItem.objects.get(id=response.data["id"])
        assert item.family == family_with_parent
        assert item.creator == parent_member

    def test_create_backlog_item_as_child_forbidden(self, session_client, family_with_parent, create_user):
        """Test that children cannot create backlog items"""
        # Create a child user and add them to the family
        child_user = User.objects.create_user(
            email="child@example.com",
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
        
        # Authenticate as child user
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
        assert "Only parents can create backlog items" in str(response.data)

    def test_create_backlog_item_validation_category(self, session_client, family_with_parent, parent_member):
        """Test validation that category must be in family's swim lanes"""
        data = {
            "title": "Invalid Category Task",
            "category": "Invalid Category",  # Not in default swim lanes
            "priority": 1
        }
        
        response = session_client.post(
            f"/api/families/{family_with_parent.id}/backlog/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "category" in str(response.data).lower() or "swim lanes" in str(response.data).lower()

    def test_create_backlog_item_validation_story_points(self, session_client, family_with_parent, parent_member):
        """Test validation that story points must be between 1-5"""
        data = {
            "title": "Invalid Story Points Task",
            "category": "Chores",
            "priority": 1,
            "story_points": 10  # Invalid: > 5
        }
        
        response = session_client.post(
            f"/api/families/{family_with_parent.id}/backlog/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "story points" in str(response.data).lower()

    def test_create_backlog_item_validation_title_required(self, session_client, family_with_parent, parent_member):
        """Test validation that title is required"""
        data = {
            "category": "Chores",
            "priority": 1
            # Missing title
        }
        
        response = session_client.post(
            f"/api/families/{family_with_parent.id}/backlog/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_retrieve_backlog_item(self, session_client, family_with_parent, parent_member):
        """Test retrieving a specific backlog item"""
        item = BacklogItem.objects.create(
            family=family_with_parent,
            title="Retrieve Test Task",
            category="Chores",
            priority=5,
            creator=parent_member,
            created_by=parent_member.user
        )
        
        response = session_client.get(
            f"/api/families/{family_with_parent.id}/backlog/{item.id}/"
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["id"] == str(item.id)
        assert response.data["title"] == "Retrieve Test Task"
        assert response.data["category"] == "Chores"

    def test_retrieve_backlog_item_not_found(self, session_client, family_with_parent):
        """Test retrieving a non-existent backlog item"""
        import uuid
        fake_id = uuid.uuid4()
        response = session_client.get(
            f"/api/families/{family_with_parent.id}/backlog/{fake_id}/"
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_update_backlog_item_as_parent(self, session_client, family_with_parent, parent_member):
        """Test updating a backlog item as a parent"""
        item = BacklogItem.objects.create(
            family=family_with_parent,
            title="Original Title",
            category="Chores",
            priority=3,
            creator=parent_member,
            created_by=parent_member.user
        )
        
        data = {
            "title": "Updated Title",
            "priority": 8,
            "story_points": 5
        }
        response = session_client.patch(
            f"/api/families/{family_with_parent.id}/backlog/{item.id}/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["title"] == "Updated Title"
        assert response.data["priority"] == 8
        assert response.data["story_points"] == 5
        
        # Verify update in database
        item.refresh_from_db()
        assert item.title == "Updated Title"
        assert item.priority == 8

    def test_update_backlog_item_as_child_forbidden(self, session_client, family_with_parent, create_user, parent_member):
        """Test that children cannot update backlog items"""
        # Create a child user and add them to the family
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
        
        # Create a backlog item
        item = BacklogItem.objects.create(
            family=family_with_parent,
            title="Child Update Test",
            category="Chores",
            priority=1,
            creator=parent_member,
            created_by=parent_member.user
        )
        
        # Try to update as child user
        client = APIClient()
        client.force_authenticate(user=child_user)
        
        data = {"title": "Hacked Title"}
        response = client.patch(
            f"/api/families/{family_with_parent.id}/backlog/{item.id}/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "Only parents can update backlog items" in str(response.data)

    def test_delete_backlog_item_as_parent(self, session_client, family_with_parent, parent_member):
        """Test deleting a backlog item as a parent"""
        item = BacklogItem.objects.create(
            family=family_with_parent,
            title="Delete Test Task",
            category="Chores",
            priority=1,
            creator=parent_member,
            created_by=parent_member.user
        )
        item_id = item.id
        
        response = session_client.delete(
            f"/api/families/{family_with_parent.id}/backlog/{item.id}/"
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT
        
        # Verify item was deleted (soft delete)
        assert not BacklogItem.objects.filter(id=item_id, deleted_at__isnull=True).exists()

    def test_delete_backlog_item_as_child_forbidden(self, session_client, family_with_parent, create_user, parent_member):
        """Test that children cannot delete backlog items"""
        # Create a child user and add them to the family
        child_user = User.objects.create_user(
            email="child3@example.com",
            password="testpass",
            display_name="Child User 3"
        )
        FamilyMember.objects.create(
            user=child_user,
            family=family_with_parent,
            name="Child",
            age=10,
            role=FamilyRole.CHILD,
            created_by=create_user
        )
        
        # Create a backlog item
        item = BacklogItem.objects.create(
            family=family_with_parent,
            title="Child Delete Test",
            category="Chores",
            priority=1,
            creator=parent_member,
            created_by=parent_member.user
        )
        
        # Try to delete as child user
        client = APIClient()
        client.force_authenticate(user=child_user)
        
        response = client.delete(
            f"/api/families/{family_with_parent.id}/backlog/{item.id}/"
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "Only parents can delete backlog items" in str(response.data)

    def test_reorder_backlog_items(self, session_client, family_with_parent, parent_member):
        """Test reordering backlog items"""
        # Create multiple backlog items
        item1 = BacklogItem.objects.create(
            family=family_with_parent,
            title="Item 1",
            category="Chores",
            priority=1,
            creator=parent_member,
            created_by=parent_member.user
        )
        item2 = BacklogItem.objects.create(
            family=family_with_parent,
            title="Item 2",
            category="Chores",
            priority=2,
            creator=parent_member,
            created_by=parent_member.user
        )
        item3 = BacklogItem.objects.create(
            family=family_with_parent,
            title="Item 3",
            category="Chores",
            priority=3,
            creator=parent_member,
            created_by=parent_member.user
        )
        
        # Reorder: item3, item1, item2 (item3 should get highest priority)
        data = {
            "item_ids": [str(item3.id), str(item1.id), str(item2.id)]
        }
        response = session_client.post(
            f"/api/families/{family_with_parent.id}/backlog/reorder/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_200_OK
        
        # Verify priorities were updated
        item1.refresh_from_db()
        item2.refresh_from_db()
        item3.refresh_from_db()
        
        # item3 (first in list) should have highest priority (3)
        # item1 (second) should have priority 2
        # item2 (third) should have priority 1
        assert item3.priority == 3
        assert item1.priority == 2
        assert item2.priority == 1

    def test_reorder_backlog_items_as_child_forbidden(self, session_client, family_with_parent, create_user, parent_member):
        """Test that children cannot reorder backlog items"""
        # Create a child user and add them to the family
        child_user = User.objects.create_user(
            email="child4@example.com",
            password="testpass",
            display_name="Child User 4"
        )
        FamilyMember.objects.create(
            user=child_user,
            family=family_with_parent,
            name="Child",
            age=10,
            role=FamilyRole.CHILD,
            created_by=create_user
        )
        
        # Create a backlog item
        item = BacklogItem.objects.create(
            family=family_with_parent,
            title="Reorder Test",
            category="Chores",
            priority=1,
            creator=parent_member,
            created_by=parent_member.user
        )
        
        # Try to reorder as child user
        client = APIClient()
        client.force_authenticate(user=child_user)
        
        data = {"item_ids": [str(item.id)]}
        response = client.post(
            f"/api/families/{family_with_parent.id}/backlog/reorder/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "Only parents can reorder backlog items" in str(response.data)

    def test_reorder_backlog_items_validation(self, session_client, family_with_parent, parent_member):
        """Test validation when reordering backlog items"""
        # Invalid: not a list
        data = {"item_ids": "not-a-list"}
        response = session_client.post(
            f"/api/families/{family_with_parent.id}/backlog/reorder/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        
        # Invalid: item from different family
        other_family = Family.objects.create(
            name="Other Family",
            sprint_duration=7,
            created_by=parent_member.user
        )
        other_item = BacklogItem.objects.create(
            family=other_family,
            title="Other Item",
            category="Chores",
            priority=1,
            creator=parent_member,
            created_by=parent_member.user
        )
        
        data = {"item_ids": [str(other_item.id)]}
        response = session_client.post(
            f"/api/families/{family_with_parent.id}/backlog/reorder/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_backlog_item_api_requires_authentication(self, api_client):
        """Test that BacklogItem API endpoints require authentication"""
        import uuid
        fake_family_id = uuid.uuid4()
        fake_item_id = uuid.uuid4()
        
        # Try to list items without authentication
        response = api_client.get(f"/api/families/{fake_family_id}/backlog/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        
        # Try to create item without authentication
        data = {
            "title": "Test",
            "category": "Chores",
            "priority": 1
        }
        response = api_client.post(f"/api/families/{fake_family_id}/backlog/", data, format="json")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

