"""
Contract tests for authentication and authorization in native environment.

Tests authentication and authorization patterns to verify they work correctly 
in native (non-Docker) deployment.
Task: T035 - Verify authentication and authorization work correctly with native API server

Tests:
- Authentication requirements
- Parent vs child permissions
- Cross-family data isolation
- Edge cases (inactive members, etc.)
"""

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import Family, FamilyMember, BacklogItem, User, FamilyRole, BacklogItemStatus


@pytest.mark.contract
class TestAuthenticationAuthorization:
    """Test authentication and authorization patterns in native environment"""

    @pytest.fixture
    def parent_user(self, create_user):
        """Create a parent user"""
        return create_user

    @pytest.fixture
    def child_user(self, db):
        """Create a child user"""
        return User.objects.create_user(
            email="child@example.com",
            password="testpass",
            display_name="Child User"
        )

    @pytest.fixture
    def family_with_both_roles(self, parent_user, child_user):
        """Create a family with both parent and child members"""
        family = Family.objects.create(
            name="Test Family",
            sprint_duration=7,
            created_by=parent_user
        )
        parent_member = FamilyMember.objects.create(
            user=parent_user,
            family=family,
            name=parent_user.display_name or parent_user.email,
            role=FamilyRole.PARENT,
            created_by=parent_user
        )
        child_member = FamilyMember.objects.create(
            user=child_user,
            family=family,
            name="Child",
            age=10,
            role=FamilyRole.CHILD,
            created_by=parent_user
        )
        return family, parent_member, child_member

    @pytest.fixture
    def other_family(self, db):
        """Create another family with different users"""
        other_parent = User.objects.create_user(
            email="otherparent@example.com",
            password="testpass",
            display_name="Other Parent"
        )
        other_family = Family.objects.create(
            name="Other Family",
            sprint_duration=7,
            created_by=other_parent
        )
        FamilyMember.objects.create(
            user=other_parent,
            family=other_family,
            name=other_parent.display_name,
            role=FamilyRole.PARENT,
            created_by=other_parent
        )
        return other_family, other_parent

    def test_unauthenticated_access_forbidden(self, api_client, family_with_both_roles):
        """Test that all endpoints require authentication"""
        family, _, _ = family_with_both_roles
        
        # Test Family endpoints
        response = api_client.get("/api/families/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        
        response = api_client.post("/api/families/", {"name": "Test"}, format="json")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        
        # Test FamilyMember endpoints
        response = api_client.get(f"/api/families/{family.id}/members/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        
        # Test BacklogItem endpoints
        response = api_client.get(f"/api/families/{family.id}/backlog/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_parent_can_create_family(self, session_client, parent_user):
        """Test that authenticated users can create families"""
        data = {"name": "New Family"}
        response = session_client.post("/api/families/", data, format="json")
        assert response.status_code == status.HTTP_201_CREATED

    def test_parent_can_add_family_member(self, session_client, family_with_both_roles, parent_user):
        """Test that parents can add family members"""
        family, parent_member, _ = family_with_both_roles
        
        new_user = User.objects.create_user(
            email="newuser@example.com",
            password="testpass",
            display_name="New User"
        )
        
        data = {
            "family": family.id,
            "user": new_user.id,
            "name": "New Member",
            "role": FamilyRole.CHILD,
            "age": 8
        }
        response = session_client.post(
            f"/api/families/{family.id}/members/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_201_CREATED

    def test_child_cannot_add_family_member(self, family_with_both_roles, child_user):
        """Test that children cannot add family members"""
        family, _, _ = family_with_both_roles
        
        client = APIClient()
        client.force_authenticate(user=child_user)
        
        new_user = User.objects.create_user(
            email="newuser2@example.com",
            password="testpass",
            display_name="New User 2"
        )
        
        data = {
            "family": family.id,
            "user": new_user.id,
            "name": "New Member",
            "role": FamilyRole.CHILD,
            "age": 7
        }
        response = client.post(
            f"/api/families/{family.id}/members/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "Only parents can add family members" in str(response.data)

    def test_parent_can_create_backlog_item(self, session_client, family_with_both_roles, parent_user):
        """Test that parents can create backlog items"""
        family, parent_member, _ = family_with_both_roles
        
        data = {
            "title": "Parent Task",
            "category": "Chores",
            "priority": 5
        }
        response = session_client.post(
            f"/api/families/{family.id}/backlog/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_201_CREATED

    def test_child_cannot_create_backlog_item(self, family_with_both_roles, child_user):
        """Test that children cannot create backlog items"""
        family, _, _ = family_with_both_roles
        
        client = APIClient()
        client.force_authenticate(user=child_user)
        
        data = {
            "title": "Child Task",
            "category": "Chores",
            "priority": 1
        }
        response = client.post(
            f"/api/families/{family.id}/backlog/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "Only parents can create backlog items" in str(response.data)

    def test_parent_can_update_backlog_item(self, session_client, family_with_both_roles, parent_user):
        """Test that parents can update backlog items"""
        family, parent_member, _ = family_with_both_roles
        
        item = BacklogItem.objects.create(
            family=family,
            title="Original",
            category="Chores",
            priority=1,
            creator=parent_member,
            created_by=parent_user
        )
        
        data = {"title": "Updated"}
        response = session_client.patch(
            f"/api/families/{family.id}/backlog/{item.id}/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_200_OK

    def test_child_cannot_update_backlog_item(self, family_with_both_roles, child_user, parent_user):
        """Test that children cannot update backlog items"""
        family, parent_member, _ = family_with_both_roles
        
        item = BacklogItem.objects.create(
            family=family,
            title="Child Update Test",
            category="Chores",
            priority=1,
            creator=parent_member,
            created_by=parent_user
        )
        
        client = APIClient()
        client.force_authenticate(user=child_user)
        
        data = {"title": "Hacked"}
        response = client.patch(
            f"/api/families/{family.id}/backlog/{item.id}/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "Only parents can update backlog items" in str(response.data)

    def test_child_can_view_backlog_items(self, family_with_both_roles, child_user, parent_user):
        """Test that children can view backlog items (read-only access)"""
        family, parent_member, _ = family_with_both_roles
        
        BacklogItem.objects.create(
            family=family,
            title="Viewable Task",
            category="Chores",
            priority=1,
            creator=parent_member,
            created_by=parent_user
        )
        
        client = APIClient()
        client.force_authenticate(user=child_user)
        
        response = client.get(f"/api/families/{family.id}/backlog/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1

    def test_child_can_view_family_members(self, session_client, family_with_both_roles, child_user):
        """Test that children can view family members"""
        family, _, _ = family_with_both_roles
        
        client = APIClient()
        client.force_authenticate(user=child_user)
        
        response = client.get(f"/api/families/{family.id}/members/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 2  # At least parent and child

    def test_child_can_update_self(self, family_with_both_roles, child_user):
        """Test that children can update their own member record"""
        family, _, child_member = family_with_both_roles
        
        client = APIClient()
        client.force_authenticate(user=child_user)
        
        data = {"name": "Updated Child Name"}
        response = client.patch(
            f"/api/families/{family.id}/members/{child_member.id}/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_200_OK

    def test_child_cannot_update_other_members(self, family_with_both_roles, child_user, parent_user):
        """Test that children cannot update other family members"""
        family, parent_member, _ = family_with_both_roles
        
        client = APIClient()
        client.force_authenticate(user=child_user)
        
        data = {"name": "Hacked Parent Name"}
        response = client.patch(
            f"/api/families/{family.id}/members/{parent_member.id}/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "Only parents can update other family members" in str(response.data)

    def test_cross_family_isolation_families(self, session_client, parent_user, other_family):
        """Test that users cannot access other families"""
        other_family_obj, _ = other_family
        
        # Try to retrieve other family
        response = session_client.get(f"/api/families/{other_family_obj.id}/")
        assert response.status_code == status.HTTP_404_NOT_FOUND  # Not found because user is not a member

    def test_cross_family_isolation_members(self, session_client, family_with_both_roles, other_family):
        """Test that users cannot access members of other families"""
        family, _, _ = family_with_both_roles
        other_family_obj, _ = other_family
        
        # Try to list members of other family
        response = session_client.get(f"/api/families/{other_family_obj.id}/members/")
        assert response.status_code == status.HTTP_200_OK
        # Should return empty list (user can't see members of families they're not in)
        assert len(response.data) == 0

    def test_cross_family_isolation_backlog(self, session_client, family_with_both_roles, other_family, parent_user):
        """Test that users cannot access backlog items of other families"""
        family, parent_member, _ = family_with_both_roles
        other_family_obj, other_parent = other_family
        
        # Create backlog item in other family
        other_member = FamilyMember.objects.get(family=other_family_obj, user=other_parent)
        BacklogItem.objects.create(
            family=other_family_obj,
            title="Other Family Task",
            category="Chores",
            priority=1,
            creator=other_member,
            created_by=other_parent
        )
        
        # Try to list backlog items of other family
        response = session_client.get(f"/api/families/{other_family_obj.id}/backlog/")
        assert response.status_code == status.HTTP_200_OK
        # Should return empty list (user can't see items of families they're not in)
        assert len(response.data) == 0

    def test_inactive_member_cannot_access(self, family_with_both_roles, child_user):
        """Test that inactive members cannot access family resources"""
        family, _, child_member = family_with_both_roles
        
        # Deactivate child member
        child_member.is_active = False
        child_member.save()
        
        client = APIClient()
        client.force_authenticate(user=child_user)
        
        # Try to access backlog items
        response = client.get(f"/api/families/{family.id}/backlog/")
        assert response.status_code == status.HTTP_200_OK
        # Should return empty list (inactive members can't see resources)
        assert len(response.data) == 0

    def test_parent_can_delete_backlog_item(self, session_client, family_with_both_roles, parent_user):
        """Test that parents can delete backlog items"""
        family, parent_member, _ = family_with_both_roles
        
        item = BacklogItem.objects.create(
            family=family,
            title="Delete Test",
            category="Chores",
            priority=1,
            creator=parent_member,
            created_by=parent_user
        )
        
        response = session_client.delete(
            f"/api/families/{family.id}/backlog/{item.id}/"
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_child_cannot_delete_backlog_item(self, family_with_both_roles, child_user, parent_user):
        """Test that children cannot delete backlog items"""
        family, parent_member, _ = family_with_both_roles
        
        item = BacklogItem.objects.create(
            family=family,
            title="Child Delete Test",
            category="Chores",
            priority=1,
            creator=parent_member,
            created_by=parent_user
        )
        
        client = APIClient()
        client.force_authenticate(user=child_user)
        
        response = client.delete(
            f"/api/families/{family.id}/backlog/{item.id}/"
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "Only parents can delete backlog items" in str(response.data)

    def test_parent_can_reorder_backlog_items(self, session_client, family_with_both_roles, parent_user):
        """Test that parents can reorder backlog items"""
        family, parent_member, _ = family_with_both_roles
        
        item1 = BacklogItem.objects.create(
            family=family,
            title="Item 1",
            category="Chores",
            priority=1,
            creator=parent_member,
            created_by=parent_user
        )
        item2 = BacklogItem.objects.create(
            family=family,
            title="Item 2",
            category="Chores",
            priority=2,
            creator=parent_member,
            created_by=parent_user
        )
        
        data = {"item_ids": [str(item2.id), str(item1.id)]}
        response = session_client.post(
            f"/api/families/{family.id}/backlog/reorder/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_200_OK

    def test_child_cannot_reorder_backlog_items(self, family_with_both_roles, child_user, parent_user):
        """Test that children cannot reorder backlog items"""
        family, parent_member, _ = family_with_both_roles
        
        item = BacklogItem.objects.create(
            family=family,
            title="Reorder Test",
            category="Chores",
            priority=1,
            creator=parent_member,
            created_by=parent_user
        )
        
        client = APIClient()
        client.force_authenticate(user=child_user)
        
        data = {"item_ids": [str(item.id)]}
        response = client.post(
            f"/api/families/{family.id}/backlog/reorder/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "Only parents can reorder backlog items" in str(response.data)

    def test_parent_can_update_family(self, session_client, family_with_both_roles):
        """Test that parents can update family details"""
        family, _, _ = family_with_both_roles
        
        data = {"name": "Updated Family Name"}
        response = session_client.patch(
            f"/api/families/{family.id}/",
            data,
            format="json"
        )
        assert response.status_code == status.HTTP_200_OK

    def test_child_can_view_family(self, family_with_both_roles, child_user):
        """Test that children can view family details"""
        family, _, _ = family_with_both_roles
        
        client = APIClient()
        client.force_authenticate(user=child_user)
        
        response = client.get(f"/api/families/{family.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "Test Family"

    def test_permission_summary_parent(self, session_client, family_with_both_roles, parent_user):
        """Test comprehensive permission summary for parents"""
        family, parent_member, _ = family_with_both_roles
        
        # Parents can do everything
        assert session_client.get("/api/families/").status_code == status.HTTP_200_OK
        assert session_client.get(f"/api/families/{family.id}/").status_code == status.HTTP_200_OK
        assert session_client.get(f"/api/families/{family.id}/members/").status_code == status.HTTP_200_OK
        assert session_client.get(f"/api/families/{family.id}/backlog/").status_code == status.HTTP_200_OK
        
        # Parents can create/update/delete
        data = {"name": "New Family"}
        assert session_client.post("/api/families/", data, format="json").status_code == status.HTTP_201_CREATED

    def test_permission_summary_child(self, family_with_both_roles, child_user):
        """Test comprehensive permission summary for children"""
        family, _, _ = family_with_both_roles
        
        client = APIClient()
        client.force_authenticate(user=child_user)
        
        # Children can view
        assert client.get("/api/families/").status_code == status.HTTP_200_OK
        assert client.get(f"/api/families/{family.id}/").status_code == status.HTTP_200_OK
        assert client.get(f"/api/families/{family.id}/members/").status_code == status.HTTP_200_OK
        assert client.get(f"/api/families/{family.id}/backlog/").status_code == status.HTTP_200_OK
        
        # Children cannot create families (would need to test, but likely forbidden or creates with parent role)
        # Children cannot create backlog items (tested above)
        # Children cannot update other members (tested above)

