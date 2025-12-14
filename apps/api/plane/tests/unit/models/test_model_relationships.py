"""
Unit tests for model relationships and queries in native environment.

Tests relationships between Family, FamilyMember, and BacklogItem models.
This test suite verifies that model relationships work correctly in native (non-Docker) deployment.

Task: T031 - Test model relationships and queries (Family → FamilyMembers, Family → BacklogItems, etc.)
"""

import pytest
from django.db.models import Prefetch, Q

from plane.db.models import Family, FamilyMember, BacklogItem, FamilyRole, BacklogItemStatus, User


@pytest.mark.unit
class TestModelRelationships:
    """Test model relationships and queries in native environment"""

    @pytest.mark.django_db
    def test_family_to_family_members_relationship(self, create_user):
        """Test Family → FamilyMembers relationship (one-to-many)"""
        # Create a family
        family = Family.objects.create(name="The Smiths", sprint_duration=7)
        
        # Create multiple family members
        member1 = FamilyMember.objects.create(
            user=create_user,
            family=family,
            name="John Smith",
            role=FamilyRole.PARENT
        )
        
        # Create another user for second member
        user2 = User.objects.create_user(
            email="jane@example.com",
            password="testpass123",
            display_name="Jane"
        )
        member2 = FamilyMember.objects.create(
            user=user2,
            family=family,
            name="Jane Smith",
            role=FamilyRole.PARENT
        )
        
        # Test forward relationship: Family → FamilyMembers
        members = family.members.all()
        assert members.count() == 2
        member_ids = [m.id for m in members]
        assert member1.id in member_ids
        assert member2.id in member_ids
        
        # Test reverse relationship: FamilyMember → Family
        assert member1.family == family
        assert member2.family == family

    @pytest.mark.django_db
    def test_family_to_backlog_items_relationship(self, create_user):
        """Test Family → BacklogItems relationship (one-to-many)"""
        # Create a family
        family = Family.objects.create(name="The Johnsons", sprint_duration=7)
        
        # Create a family member (required for backlog item creator)
        member = FamilyMember.objects.create(
            user=create_user,
            family=family,
            name="John Johnson",
            role=FamilyRole.PARENT
        )
        
        # Create multiple backlog items
        item1 = BacklogItem.objects.create(
            family=family,
            title="Clean the garage",
            category="Chores",
            priority=5,
            creator=member
        )
        
        item2 = BacklogItem.objects.create(
            family=family,
            title="Plan vacation",
            category="Family Time",
            priority=3,
            creator=member
        )
        
        # Test forward relationship: Family → BacklogItems
        backlog_items = family.backlog_items.all()
        assert backlog_items.count() == 2
        item_ids = [item.id for item in backlog_items]
        assert item1.id in item_ids
        assert item2.id in item_ids
        
        # Test reverse relationship: BacklogItem → Family
        assert item1.family == family
        assert item2.family == family

    @pytest.mark.django_db
    def test_backlog_item_to_family_member_relationship(self, create_user):
        """Test BacklogItem → FamilyMember relationship (many-to-one via creator)"""
        # Create a family and member
        family = Family.objects.create(name="The Williams", sprint_duration=7)
        member = FamilyMember.objects.create(
            user=create_user,
            family=family,
            name="Bob Williams",
            role=FamilyRole.PARENT
        )
        
        # Create backlog items created by this member
        item1 = BacklogItem.objects.create(
            family=family,
            title="Task 1",
            category="Chores",
            creator=member
        )
        
        item2 = BacklogItem.objects.create(
            family=family,
            title="Task 2",
            category="Home Projects",
            creator=member
        )
        
        # Test forward relationship: BacklogItem → FamilyMember (creator)
        assert item1.creator == member
        assert item2.creator == member
        
        # Test reverse relationship: FamilyMember → BacklogItems (created_backlog_items)
        created_items = member.created_backlog_items.all()
        assert created_items.count() == 2
        created_item_ids = [item.id for item in created_items]
        assert item1.id in created_item_ids
        assert item2.id in created_item_ids

    @pytest.mark.django_db
    def test_complex_relationship_queries(self, create_user):
        """Test complex queries involving multiple relationships"""
        # Create a family
        family = Family.objects.create(name="The Browns", sprint_duration=7)
        
        # Create multiple family members
        member1 = FamilyMember.objects.create(
            user=create_user,
            family=family,
            name="Parent 1",
            role=FamilyRole.PARENT
        )
        
        user2 = User.objects.create_user(
            email="child@example.com",
            password="testpass123",
            display_name="Child"
        )
        member2 = FamilyMember.objects.create(
            user=user2,
            family=family,
            name="Child 1",
            age=10,
            role=FamilyRole.CHILD
        )
        
        # Create backlog items by different members
        item1 = BacklogItem.objects.create(
            family=family,
            title="Parent task",
            category="Chores",
            priority=5,
            creator=member1
        )
        
        item2 = BacklogItem.objects.create(
            family=family,
            title="Child task",
            category="School/Activities",
            priority=3,
            creator=member2
        )
        
        # Query: Get all backlog items with their creators
        items_with_creators = BacklogItem.objects.select_related('creator', 'family').filter(family=family)
        assert items_with_creators.count() == 2
        
        for item in items_with_creators:
            assert item.family == family
            assert item.creator in [member1, member2]
        
        # Query: Get family with all members and their created backlog items
        family_with_members = Family.objects.prefetch_related(
            Prefetch('members', queryset=FamilyMember.objects.select_related('user')),
            Prefetch('backlog_items', queryset=BacklogItem.objects.select_related('creator'))
        ).get(id=family.id)
        
        assert family_with_members.members.count() == 2
        assert family_with_members.backlog_items.count() == 2

    @pytest.mark.django_db
    def test_filtering_by_relationships(self, create_user):
        """Test filtering queries using relationships"""
        # Create two families
        family1 = Family.objects.create(name="Family One", sprint_duration=7)
        family2 = Family.objects.create(name="Family Two", sprint_duration=14)
        
        # Create members for each family
        member1 = FamilyMember.objects.create(
            user=create_user,
            family=family1,
            name="Member 1",
            role=FamilyRole.PARENT
        )
        
        user2 = User.objects.create_user(
            email="member2@example.com",
            password="testpass123",
            display_name="Member 2"
        )
        member2 = FamilyMember.objects.create(
            user=user2,
            family=family2,
            name="Member 2",
            role=FamilyRole.PARENT
        )
        
        # Create backlog items for each family
        item1 = BacklogItem.objects.create(
            family=family1,
            title="Family 1 Task",
            category="Chores",
            creator=member1
        )
        
        item2 = BacklogItem.objects.create(
            family=family2,
            title="Family 2 Task",
            category="Chores",
            creator=member2
        )
        
        # Filter backlog items by family
        family1_items = BacklogItem.objects.filter(family=family1)
        assert family1_items.count() == 1
        assert family1_items.first().id == item1.id
        
        # Filter family members by family
        family1_members = FamilyMember.objects.filter(family=family1)
        assert family1_members.count() == 1
        assert family1_members.first().id == member1.id
        
        # Filter backlog items by creator's family
        items_by_member1 = BacklogItem.objects.filter(creator=member1)
        assert items_by_member1.count() == 1
        assert items_by_member1.first().id == item1.id

    @pytest.mark.django_db
    def test_cascade_delete_relationships(self, create_user):
        """Test cascade delete behavior in relationships"""
        # Create a family
        family = Family.objects.create(name="Test Family", sprint_duration=7)
        
        # Create a member
        member = FamilyMember.objects.create(
            user=create_user,
            family=family,
            name="Test Member",
            role=FamilyRole.PARENT
        )
        
        # Create backlog items
        item1 = BacklogItem.objects.create(
            family=family,
            title="Task 1",
            category="Chores",
            creator=member
        )
        
        item2 = BacklogItem.objects.create(
            family=family,
            title="Task 2",
            category="Home Projects",
            creator=member
        )
        
        # Verify items exist
        assert BacklogItem.objects.filter(family=family).count() == 2
        
        # Delete family (should cascade delete members and backlog items)
        family.delete()
        
        # Verify cascade delete
        assert not Family.objects.filter(id=family.id).exists()
        assert not FamilyMember.objects.filter(id=member.id).exists()
        assert not BacklogItem.objects.filter(id=item1.id).exists()
        assert not BacklogItem.objects.filter(id=item2.id).exists()

    @pytest.mark.django_db
    def test_query_optimization_with_select_related(self, create_user):
        """Test query optimization using select_related for foreign keys"""
        # Create test data
        family = Family.objects.create(name="Optimization Test", sprint_duration=7)
        member = FamilyMember.objects.create(
            user=create_user,
            family=family,
            name="Test Member",
            role=FamilyRole.PARENT
        )
        item = BacklogItem.objects.create(
            family=family,
            title="Test Task",
            category="Chores",
            creator=member
        )
        
        # Test without select_related (N+1 queries)
        # This would normally cause multiple queries
        backlog_item = BacklogItem.objects.get(id=item.id)
        assert backlog_item.family.name == "Optimization Test"
        assert backlog_item.creator.name == "Test Member"
        
        # Test with select_related (single query)
        backlog_item_optimized = BacklogItem.objects.select_related('family', 'creator').get(id=item.id)
        assert backlog_item_optimized.family.name == "Optimization Test"
        assert backlog_item_optimized.creator.name == "Test Member"

    @pytest.mark.django_db
    def test_query_optimization_with_prefetch_related(self, create_user):
        """Test query optimization using prefetch_related for reverse relationships"""
        # Create test data
        family = Family.objects.create(name="Prefetch Test", sprint_duration=7)
        
        member1 = FamilyMember.objects.create(
            user=create_user,
            family=family,
            name="Member 1",
            role=FamilyRole.PARENT
        )
        
        user2 = User.objects.create_user(
            email="member2@example.com",
            password="testpass123",
            display_name="Member 2"
        )
        member2 = FamilyMember.objects.create(
            user=user2,
            family=family,
            name="Member 2",
            role=FamilyRole.PARENT
        )
        
        # Create multiple backlog items
        for i in range(5):
            BacklogItem.objects.create(
                family=family,
                title=f"Task {i}",
                category="Chores",
                creator=member1 if i % 2 == 0 else member2
            )
        
        # Test with prefetch_related (optimized)
        family_optimized = Family.objects.prefetch_related('members', 'backlog_items').get(id=family.id)
        
        # Accessing these should not cause additional queries
        members = list(family_optimized.members.all())
        items = list(family_optimized.backlog_items.all())
        
        assert len(members) == 2
        assert len(items) == 5

    @pytest.mark.django_db
    def test_relationship_queries_with_filters(self, create_user):
        """Test relationship queries with additional filters"""
        # Create test data
        family = Family.objects.create(name="Filter Test", sprint_duration=7)
        
        member1 = FamilyMember.objects.create(
            user=create_user,
            family=family,
            name="Parent",
            role=FamilyRole.PARENT
        )
        
        user2 = User.objects.create_user(
            email="child@example.com",
            password="testpass123",
            display_name="Child"
        )
        member2 = FamilyMember.objects.create(
            user=user2,
            family=family,
            name="Child",
            age=10,
            role=FamilyRole.CHILD
        )
        
        # Create backlog items with different statuses
        item1 = BacklogItem.objects.create(
            family=family,
            title="Backlog Task",
            category="Chores",
            status=BacklogItemStatus.BACKLOG,
            creator=member1
        )
        
        item2 = BacklogItem.objects.create(
            family=family,
            title="Sprint Task",
            category="Home Projects",
            status=BacklogItemStatus.SPRINT,
            creator=member2
        )
        
        # Query: Get only active family members
        active_members = family.members.filter(is_active=True)
        assert active_members.count() == 2
        
        # Query: Get only backlog items in backlog status
        backlog_items = family.backlog_items.filter(status=BacklogItemStatus.BACKLOG)
        assert backlog_items.count() == 1
        assert backlog_items.first().id == item1.id
        
        # Query: Get backlog items created by parent
        parent_items = BacklogItem.objects.filter(family=family, creator__role=FamilyRole.PARENT)
        assert parent_items.count() == 1
        assert parent_items.first().id == item1.id
        
        # Query: Get backlog items created by child
        child_items = BacklogItem.objects.filter(family=family, creator__role=FamilyRole.CHILD)
        assert child_items.count() == 1
        assert child_items.first().id == item2.id

    @pytest.mark.django_db
    def test_relationship_ordering(self, create_user):
        """Test ordering in relationship queries"""
        # Create test data
        family = Family.objects.create(name="Ordering Test", sprint_duration=7)
        member = FamilyMember.objects.create(
            user=create_user,
            family=family,
            name="Test Member",
            role=FamilyRole.PARENT
        )
        
        # Create backlog items with different priorities
        item1 = BacklogItem.objects.create(
            family=family,
            title="Low Priority",
            category="Chores",
            priority=1,
            creator=member
        )
        
        item2 = BacklogItem.objects.create(
            family=family,
            title="High Priority",
            category="Chores",
            priority=10,
            creator=member
        )
        
        item3 = BacklogItem.objects.create(
            family=family,
            title="Medium Priority",
            category="Chores",
            priority=5,
            creator=member
        )
        
        # Test default ordering (by priority desc, then created_at desc)
        items = family.backlog_items.all()
        item_titles = [item.title for item in items]
        
        # Should be ordered by priority descending
        assert item_titles[0] == "High Priority"
        assert item_titles[1] == "Medium Priority"
        assert item_titles[2] == "Low Priority"

    @pytest.mark.django_db
    def test_native_environment_relationship_queries(self, create_user):
        """Test that relationship queries work correctly in native environment (Supabase)"""
        # This test verifies the database connection and relationships work in native deployment
        # Create comprehensive test data
        family = Family.objects.create(
            name="Native Environment Test Family",
            sprint_duration=7,
            gamification_enabled=True
        )
        
        # Create multiple members
        member1 = FamilyMember.objects.create(
            user=create_user,
            family=family,
            name="Parent Member",
            role=FamilyRole.PARENT
        )
        
        user2 = User.objects.create_user(
            email="child@example.com",
            password="testpass123",
            display_name="Child User"
        )
        member2 = FamilyMember.objects.create(
            user=user2,
            family=family,
            name="Child Member",
            age=8,
            role=FamilyRole.CHILD
        )
        
        # Create multiple backlog items
        items = []
        for i, category in enumerate(["Chores", "School/Activities", "Home Projects"]):
            item = BacklogItem.objects.create(
                family=family,
                title=f"Task {i+1}",
                category=category,
                priority=i+1,
                creator=member1 if i % 2 == 0 else member2
            )
            items.append(item)
        
        # Test complex relationship query
        family_with_data = Family.objects.prefetch_related(
            'members',
            Prefetch('backlog_items', queryset=BacklogItem.objects.select_related('creator'))
        ).get(id=family.id)
        
        # Verify relationships work
        assert family_with_data.members.count() == 2
        assert family_with_data.backlog_items.count() == 3
        
        # Verify we can traverse relationships
        for item in family_with_data.backlog_items.all():
            assert item.family == family
            assert item.creator in [member1, member2]
            assert item.creator.family == family
        
        # Clean up
        family.delete()

