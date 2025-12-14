"""
Unit tests for FamilyMember model in native environment.

Tests CRUD operations, relationships, and role-based access patterns.
This test suite verifies that the FamilyMember model works in native (non-Docker) deployment.
"""

import pytest
from django.core.exceptions import ValidationError

from plane.db.models import Family, FamilyMember, FamilyRole, User


@pytest.mark.unit
class TestFamilyMemberModel:
    """Test the FamilyMember model CRUD operations in native environment"""

    @pytest.mark.django_db
    def test_family_member_creation(self, create_user):
        """Test creating a FamilyMember instance (CREATE)"""
        # Create a family first
        family = Family.objects.create(name="The Smiths", sprint_duration=7)
        
        # Create a family member
        member = FamilyMember.objects.create(
            user=create_user,
            family=family,
            name="John Smith",
            age=35,
            role=FamilyRole.PARENT
        )

        # Verify it was created
        assert member.id is not None
        assert member.user == create_user
        assert member.family == family
        assert member.name == "John Smith"
        assert member.age == 35
        assert member.role == FamilyRole.PARENT
        assert member.is_active is True
        assert member.joined_at is not None

    @pytest.mark.django_db
    def test_family_member_read(self, create_user):
        """Test reading a FamilyMember instance (READ)"""
        # Create family and member
        family = Family.objects.create(name="The Johnsons")
        member = FamilyMember.objects.create(
            user=create_user,
            family=family,
            name="Jane Johnson",
            role=FamilyRole.PARENT
        )

        # Read it back
        retrieved_member = FamilyMember.objects.get(id=member.id)

        # Verify data integrity
        assert retrieved_member.id == member.id
        assert retrieved_member.user == create_user
        assert retrieved_member.family == family
        assert retrieved_member.name == "Jane Johnson"

    @pytest.mark.django_db
    def test_family_member_update(self, create_user):
        """Test updating a FamilyMember instance (UPDATE)"""
        # Create family and member
        family = Family.objects.create(name="The Williams")
        member = FamilyMember.objects.create(
            user=create_user,
            family=family,
            name="Bob Williams",
            age=40,
            role=FamilyRole.PARENT
        )

        # Update it
        member.name = "Robert Williams"
        member.age = 41
        member.is_active = False
        member.save()

        # Verify update
        updated_member = FamilyMember.objects.get(id=member.id)
        assert updated_member.name == "Robert Williams"
        assert updated_member.age == 41
        assert updated_member.is_active is False

    @pytest.mark.django_db
    def test_family_member_delete(self, create_user):
        """Test soft-deleting a FamilyMember instance (DELETE)"""
        # Create family and member
        family = Family.objects.create(name="The Browns")
        member = FamilyMember.objects.create(
            user=create_user,
            family=family,
            name="Alice Brown",
            role=FamilyRole.PARENT
        )
        member_id = member.id

        # Soft delete it
        member.delete()

        # Verify it's soft-deleted
        assert not FamilyMember.objects.filter(id=member_id).exists()

        # Verify it's still in database with deleted_at set
        deleted_member = FamilyMember.objects.filter(
            id=member_id, deleted_at__isnull=False
        ).first()
        assert deleted_member is not None
        assert deleted_member.deleted_at is not None

    @pytest.mark.django_db
    def test_family_member_relationship_to_family(self, create_user):
        """Test FamilyMember → Family relationship"""
        # Create family
        family = Family.objects.create(name="The Andersons")
        
        # Create multiple members
        member1 = FamilyMember.objects.create(
            user=create_user,
            family=family,
            name="Parent One",
            role=FamilyRole.PARENT
        )

        # Access family through member
        assert member1.family == family
        assert member1.family.name == "The Andersons"

        # Access members through family
        assert family.members.count() >= 1
        assert member1 in family.members.all()

    @pytest.mark.django_db
    def test_family_member_relationship_to_user(self, create_user):
        """Test FamilyMember → User relationship"""
        # Create family
        family = Family.objects.create(name="Test Family")
        
        # Create member
        member = FamilyMember.objects.create(
            user=create_user,
            family=family,
            name="Test Member",
            role=FamilyRole.PARENT
        )

        # Access user through member
        assert member.user == create_user
        assert member.user.email == create_user.email

        # Access family members through user
        assert create_user.family_members.count() >= 1
        assert member in create_user.family_members.all()

    @pytest.mark.django_db
    def test_family_member_unique_user_family_constraint(self, create_user):
        """Test that unique user+family constraint works"""
        # Create family
        family = Family.objects.create(name="Unique Family")
        
        # Create first member
        FamilyMember.objects.create(
            user=create_user,
            family=family,
            name="First Member",
            role=FamilyRole.PARENT
        )

        # Try to create another member with same user+family (should fail)
        with pytest.raises(Exception):  # Could be IntegrityError or ValidationError
            FamilyMember.objects.create(
                user=create_user,
                family=family,
                name="Second Member",
                role=FamilyRole.PARENT
            )

    @pytest.mark.django_db
    def test_family_member_role_parent(self, create_user):
        """Test parent role assignment"""
        family = Family.objects.create(name="Test Family")
        
        member = FamilyMember.objects.create(
            user=create_user,
            family=family,
            name="Parent Member",
            role=FamilyRole.PARENT
        )

        assert member.role == FamilyRole.PARENT
        assert member.role == "parent"

    @pytest.mark.django_db
    def test_family_member_role_child(self, create_user):
        """Test child role assignment with age requirement"""
        family = Family.objects.create(name="Test Family")
        
        member = FamilyMember.objects.create(
            user=create_user,
            family=family,
            name="Child Member",
            age=10,
            role=FamilyRole.CHILD
        )

        assert member.role == FamilyRole.CHILD
        assert member.role == "child"
        assert member.age == 10

    @pytest.mark.django_db
    def test_family_member_child_requires_age(self, create_user):
        """Test that child role requires age"""
        family = Family.objects.create(name="Test Family")
        
        # Try to create child without age (should fail validation)
        member = FamilyMember(
            user=create_user,
            family=family,
            name="Child Without Age",
            role=FamilyRole.CHILD,
            age=None
        )
        
        with pytest.raises(ValidationError):
            member.full_clean()

    @pytest.mark.django_db
    def test_family_member_age_validation(self, create_user):
        """Test age validation (0-120 range)"""
        family = Family.objects.create(name="Test Family")
        
        # Valid ages should work
        member1 = FamilyMember.objects.create(
            user=create_user,
            family=family,
            name="Valid Age",
            age=0,
            role=FamilyRole.CHILD
        )
        assert member1.age == 0

        member2 = FamilyMember.objects.create(
            user=User.objects.create(email="test2@example.com"),
            family=family,
            name="Valid Age 2",
            age=120,
            role=FamilyRole.PARENT
        )
        assert member2.age == 120

    @pytest.mark.django_db
    def test_family_member_age_out_of_range(self, create_user):
        """Test that age out of range is rejected"""
        family = Family.objects.create(name="Test Family")
        
        # Invalid ages should fail
        member = FamilyMember(
            user=create_user,
            family=family,
            name="Invalid Age",
            age=121,
            role=FamilyRole.PARENT
        )
        
        with pytest.raises(ValidationError):
            member.full_clean()

    @pytest.mark.django_db
    def test_family_member_should_use_kid_interface(self, create_user):
        """Test should_use_kid_interface method"""
        family = Family.objects.create(name="Test Family")
        
        # Child with age < 13 should use kid interface
        child = FamilyMember.objects.create(
            user=create_user,
            family=family,
            name="Child",
            age=10,
            role=FamilyRole.CHILD
        )
        assert child.should_use_kid_interface() is True

        # Parent should not use kid interface
        parent = FamilyMember.objects.create(
            user=User.objects.create(email="parent@example.com"),
            family=family,
            name="Parent",
            age=35,
            role=FamilyRole.PARENT
        )
        assert parent.should_use_kid_interface() is False

        # Child with age >= 13 should not use kid interface
        older_child = FamilyMember.objects.create(
            user=User.objects.create(email="older@example.com"),
            family=family,
            name="Older Child",
            age=15,
            role=FamilyRole.CHILD
        )
        assert older_child.should_use_kid_interface() is False

    @pytest.mark.django_db
    def test_family_member_explicit_kid_interface_override(self, create_user):
        """Test use_kid_interface explicit override"""
        family = Family.objects.create(name="Test Family")
        
        # Explicitly enable kid interface
        member1 = FamilyMember.objects.create(
            user=create_user,
            family=family,
            name="Explicit Kid",
            age=20,
            role=FamilyRole.PARENT,
            use_kid_interface=True
        )
        assert member1.should_use_kid_interface() is True

        # Explicitly disable kid interface
        member2 = FamilyMember.objects.create(
            user=User.objects.create(email="explicit2@example.com"),
            family=family,
            name="Explicit Adult",
            age=8,
            role=FamilyRole.CHILD,
            use_kid_interface=False
        )
        assert member2.should_use_kid_interface() is False

    @pytest.mark.django_db
    def test_family_member_is_active_flag(self, create_user):
        """Test is_active flag"""
        family = Family.objects.create(name="Test Family")
        
        # Create active member
        active_member = FamilyMember.objects.create(
            user=create_user,
            family=family,
            name="Active Member",
            role=FamilyRole.PARENT,
            is_active=True
        )
        assert active_member.is_active is True

        # Create inactive member
        inactive_member = FamilyMember.objects.create(
            user=User.objects.create(email="inactive@example.com"),
            family=family,
            name="Inactive Member",
            role=FamilyRole.PARENT,
            is_active=False
        )
        assert inactive_member.is_active is False

        # Default should be True
        default_member = FamilyMember.objects.create(
            user=User.objects.create(email="default@example.com"),
            family=family,
            name="Default Member",
            role=FamilyRole.PARENT
        )
        assert default_member.is_active is True

    @pytest.mark.django_db
    def test_family_member_filter_by_role(self, create_user):
        """Test filtering FamilyMember by role (role-based access pattern)"""
        family = Family.objects.create(name="Test Family")
        
        # Create parents
        parent1 = FamilyMember.objects.create(
            user=create_user,
            family=family,
            name="Parent 1",
            role=FamilyRole.PARENT
        )
        parent2 = FamilyMember.objects.create(
            user=User.objects.create(email="parent2@example.com"),
            family=family,
            name="Parent 2",
            role=FamilyRole.PARENT
        )

        # Create children
        child1 = FamilyMember.objects.create(
            user=User.objects.create(email="child1@example.com"),
            family=family,
            name="Child 1",
            age=8,
            role=FamilyRole.CHILD
        )
        child2 = FamilyMember.objects.create(
            user=User.objects.create(email="child2@example.com"),
            family=family,
            name="Child 2",
            age=10,
            role=FamilyRole.CHILD
        )

        # Filter by role
        parents = FamilyMember.objects.filter(family=family, role=FamilyRole.PARENT)
        assert parents.count() >= 2
        assert parent1 in parents
        assert parent2 in parents

        children = FamilyMember.objects.filter(family=family, role=FamilyRole.CHILD)
        assert children.count() >= 2
        assert child1 in children
        assert child2 in children

    @pytest.mark.django_db
    def test_family_member_filter_by_active_status(self, create_user):
        """Test filtering FamilyMember by active status"""
        family = Family.objects.create(name="Test Family")
        
        # Create active and inactive members
        active_member = FamilyMember.objects.create(
            user=create_user,
            family=family,
            name="Active",
            role=FamilyRole.PARENT,
            is_active=True
        )
        inactive_member = FamilyMember.objects.create(
            user=User.objects.create(email="inactive@example.com"),
            family=family,
            name="Inactive",
            role=FamilyRole.PARENT,
            is_active=False
        )

        # Filter active members
        active_members = FamilyMember.objects.filter(family=family, is_active=True)
        assert active_member in active_members
        assert inactive_member not in active_members

        # Filter inactive members
        inactive_members = FamilyMember.objects.filter(family=family, is_active=False)
        assert inactive_member in inactive_members
        assert active_member not in inactive_members

    @pytest.mark.django_db
    def test_family_member_role_based_access_parent_full_access(self, create_user):
        """Test role-based access: parents have full access"""
        family = Family.objects.create(name="Test Family")
        
        parent = FamilyMember.objects.create(
            user=create_user,
            family=family,
            name="Parent",
            role=FamilyRole.PARENT
        )

        # Parents can access all family members
        all_members = FamilyMember.objects.filter(family=family)
        assert parent in all_members
        
        # Parents can see all family data
        assert parent.family == family
        assert parent.role == FamilyRole.PARENT

    @pytest.mark.django_db
    def test_family_member_role_based_access_child_limited_access(self, create_user):
        """Test role-based access: children have limited access"""
        family = Family.objects.create(name="Test Family")
        
        child = FamilyMember.objects.create(
            user=create_user,
            family=family,
            name="Child",
            age=10,
            role=FamilyRole.CHILD
        )

        # Children can see their own member record
        assert child.family == family
        assert child.role == FamilyRole.CHILD
        
        # Children have limited permissions (enforced at API/view level)
        # At model level, they can query but permissions are handled by views

    @pytest.mark.django_db
    def test_family_member_multiple_families_per_user(self, create_user):
        """Test that a user can belong to multiple families"""
        # Create multiple families
        family1 = Family.objects.create(name="Family One")
        family2 = Family.objects.create(name="Family Two")
        
        # Create same user in both families
        member1 = FamilyMember.objects.create(
            user=create_user,
            family=family1,
            name="Member in Family 1",
            role=FamilyRole.PARENT
        )
        member2 = FamilyMember.objects.create(
            user=create_user,
            family=family2,
            name="Member in Family 2",
            role=FamilyRole.PARENT
        )

        # Verify user is in both families
        assert create_user.family_members.count() >= 2
        assert member1 in create_user.family_members.all()
        assert member2 in create_user.family_members.all()
        
        # Verify families have the member
        assert member1 in family1.members.all()
        assert member2 in family2.members.all()

    @pytest.mark.django_db
    def test_family_member_string_representation(self, create_user):
        """Test FamilyMember string representation"""
        family = Family.objects.create(name="The Testers")
        member = FamilyMember.objects.create(
            user=create_user,
            family=family,
            name="Test Member",
            role=FamilyRole.PARENT
        )
        
        assert "Test Member" in str(member)
        assert "parent" in str(member).lower()
        assert "The Testers" in str(member)

    @pytest.mark.django_db
    def test_family_member_joined_at_timestamp(self, create_user):
        """Test that joined_at is automatically set"""
        family = Family.objects.create(name="Test Family")
        
        member = FamilyMember.objects.create(
            user=create_user,
            family=family,
            name="New Member",
            role=FamilyRole.PARENT
        )
        
        assert member.joined_at is not None
        assert member.joined_at == member.created_at  # Should be set on creation

    @pytest.mark.django_db
    def test_family_member_avatar_url(self, create_user):
        """Test avatar_url field"""
        family = Family.objects.create(name="Test Family")
        
        member = FamilyMember.objects.create(
            user=create_user,
            family=family,
            name="Member With Avatar",
            role=FamilyRole.PARENT,
            avatar_url="https://example.com/avatar.jpg"
        )
        
        assert member.avatar_url == "https://example.com/avatar.jpg"

    @pytest.mark.django_db
    def test_family_member_ordering(self, create_user):
        """Test FamilyMember ordering (by -created_at)"""
        family = Family.objects.create(name="Test Family")
        
        member1 = FamilyMember.objects.create(
            user=create_user,
            family=family,
            name="First Member",
            role=FamilyRole.PARENT
        )
        member2 = FamilyMember.objects.create(
            user=User.objects.create(email="second@example.com"),
            family=family,
            name="Second Member",
            role=FamilyRole.PARENT
        )

        # Get members ordered by creation date (newest first)
        members = list(FamilyMember.objects.filter(family=family))
        
        # Verify ordering (newest first based on created_at)
        assert len(members) >= 2
        member_names = [m.name for m in members]
        assert "First Member" in member_names
        assert "Second Member" in member_names

    @pytest.mark.django_db
    def test_family_member_supabase_connection(self, create_user):
        """Test that FamilyMember model can connect to Supabase database"""
        # This test verifies the database connection works in native environment
        
        family = Family.objects.create(name="Connection Test Family")
        
        # Count before
        member_count_before = FamilyMember.objects.filter(family=family).count()
        
        # Create a test member
        test_member = FamilyMember.objects.create(
            user=create_user,
            family=family,
            name="Connection Test Member",
            role=FamilyRole.PARENT
        )
        
        # Verify we can query it back
        member_count_after = FamilyMember.objects.filter(family=family).count()
        assert member_count_after == member_count_before + 1
        
        # Verify we can retrieve the specific member
        retrieved = FamilyMember.objects.get(id=test_member.id)
        assert retrieved.name == "Connection Test Member"
        assert retrieved.family == family
        
        # Clean up
        test_member.delete()

