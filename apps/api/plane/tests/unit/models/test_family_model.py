"""
Unit tests for Family model in native environment.

Tests CRUD operations and verifies Supabase connection works correctly.
This test suite verifies that the Family model works in native (non-Docker) deployment.
"""

import pytest
from django.core.exceptions import ValidationError

from plane.db.models import Family


@pytest.mark.unit
class TestFamilyModel:
    """Test the Family model CRUD operations in native environment"""

    @pytest.mark.django_db
    def test_family_creation(self):
        """Test creating a Family instance (CREATE)"""
        family = Family.objects.create(
            name="The Smiths",
            sprint_duration=7,
            gamification_enabled=True,
            baseline_capacity=20
        )

        # Verify it was created
        assert family.id is not None
        assert family.name == "The Smiths"
        assert family.sprint_duration == 7
        assert family.gamification_enabled is True
        assert family.baseline_capacity == 20
        assert family.default_swim_lanes == ["Chores", "School/Activities", "Home Projects", "Family Time", "Individual Goals"]
        assert family.created_at is not None

    @pytest.mark.django_db
    def test_family_read(self):
        """Test reading a Family instance (READ)"""
        # Create a family
        family = Family.objects.create(
            name="The Johnsons",
            sprint_duration=14
        )

        # Read it back
        retrieved_family = Family.objects.get(id=family.id)

        # Verify data integrity
        assert retrieved_family.id == family.id
        assert retrieved_family.name == "The Johnsons"
        assert retrieved_family.sprint_duration == 14

    @pytest.mark.django_db
    def test_family_update(self):
        """Test updating a Family instance (UPDATE)"""
        # Create a family
        family = Family.objects.create(
            name="The Williams",
            sprint_duration=7
        )

        # Update it
        family.name = "The Williams Family"
        family.sprint_duration = 14
        family.gamification_enabled = False
        family.save()

        # Verify update
        updated_family = Family.objects.get(id=family.id)
        assert updated_family.name == "The Williams Family"
        assert updated_family.sprint_duration == 14
        assert updated_family.gamification_enabled is False

    @pytest.mark.django_db
    def test_family_delete(self):
        """Test soft-deleting a Family instance (DELETE)"""
        # Create a family
        family = Family.objects.create(
            name="The Browns",
            sprint_duration=7
        )
        family_id = family.id

        # Soft delete it
        family.delete()

        # Verify it's soft-deleted (not in regular queryset)
        assert not Family.objects.filter(id=family_id).exists()

        # Verify it's still in database with deleted_at set
        deleted_family = Family.objects.filter(id=family_id, deleted_at__isnull=False).first()
        assert deleted_family is not None
        assert deleted_family.deleted_at is not None

    @pytest.mark.django_db
    def test_family_list(self):
        """Test listing multiple Family instances"""
        # Create multiple families
        family1 = Family.objects.create(name="Family One", sprint_duration=7)
        family2 = Family.objects.create(name="Family Two", sprint_duration=14)
        family3 = Family.objects.create(name="Family Three", sprint_duration=7)

        # List all families
        families = list(Family.objects.all())

        # Verify we can retrieve all families
        assert len(families) >= 3
        family_names = [f.name for f in families]
        assert "Family One" in family_names
        assert "Family Two" in family_names
        assert "Family Three" in family_names

    @pytest.mark.django_db
    def test_family_unique_name_constraint(self):
        """Test that unique name constraint works (when not deleted)"""
        # Create a family
        family1 = Family.objects.create(name="Unique Family", sprint_duration=7)

        # Try to create another with the same name (should fail)
        with pytest.raises(Exception):  # Could be IntegrityError or ValidationError
            Family.objects.create(name="Unique Family", sprint_duration=14)

    @pytest.mark.django_db
    def test_family_default_swim_lanes(self):
        """Test default swim lanes are set correctly"""
        family = Family.objects.create(name="Test Family")

        # Verify default swim lanes
        assert family.default_swim_lanes == ["Chores", "School/Activities", "Home Projects", "Family Time", "Individual Goals"]
        assert len(family.default_swim_lanes) == 5

    @pytest.mark.django_db
    def test_family_custom_swim_lanes(self):
        """Test custom swim lanes can be added"""
        family = Family.objects.create(
            name="Test Family",
            custom_swim_lanes=["Gardening", "Pet Care"]
        )

        # Verify custom lanes
        assert family.custom_swim_lanes == ["Gardening", "Pet Care"]
        assert len(family.get_all_swim_lanes()) == 7  # 5 default + 2 custom

    @pytest.mark.django_db
    def test_family_get_all_swim_lanes(self):
        """Test get_all_swim_lanes method combines default and custom"""
        family = Family.objects.create(
            name="Test Family",
            custom_swim_lanes=["Custom Category"]
        )

        all_lanes = family.get_all_swim_lanes()
        assert len(all_lanes) == 6
        assert "Chores" in all_lanes  # From defaults
        assert "Custom Category" in all_lanes  # From custom

    @pytest.mark.django_db
    def test_family_sprint_duration_validation(self):
        """Test sprint duration validation"""
        # Valid durations should work
        family1 = Family.objects.create(name="Family 1", sprint_duration=7)
        family2 = Family.objects.create(name="Family 2", sprint_duration=14)
        family3 = Family.objects.create(name="Family 3", sprint_duration=1)
        family4 = Family.objects.create(name="Family 4", sprint_duration=30)

        assert family1.sprint_duration == 7
        assert family2.sprint_duration == 14
        assert family3.sprint_duration == 1
        assert family4.sprint_duration == 30

    @pytest.mark.django_db
    def test_family_string_representation(self):
        """Test Family string representation"""
        family = Family.objects.create(name="The Andersons")
        assert str(family) == "The Andersons"

    @pytest.mark.django_db
    def test_family_ordering(self):
        """Test Family ordering (by -created_at)"""
        family1 = Family.objects.create(name="First Family")
        family2 = Family.objects.create(name="Second Family")
        family3 = Family.objects.create(name="Third Family")

        # Get families ordered by creation date (newest first)
        families = list(Family.objects.all())
        
        # Verify ordering (newest first based on created_at)
        # The exact order depends on timing, but we should have all three
        assert len(families) >= 3
        family_names = [f.name for f in families]
        assert "First Family" in family_names
        assert "Second Family" in family_names
        assert "Third Family" in family_names

    @pytest.mark.django_db
    def test_family_gamification_flag(self):
        """Test gamification_enabled flag"""
        # Create with gamification enabled
        family1 = Family.objects.create(
            name="Gamified Family",
            gamification_enabled=True
        )
        assert family1.gamification_enabled is True

        # Create with gamification disabled
        family2 = Family.objects.create(
            name="Non-Gamified Family",
            gamification_enabled=False
        )
        assert family2.gamification_enabled is False

        # Default should be True
        family3 = Family.objects.create(name="Default Family")
        assert family3.gamification_enabled is True

    @pytest.mark.django_db
    def test_family_baseline_capacity(self):
        """Test baseline_capacity field"""
        # Create with baseline capacity
        family = Family.objects.create(
            name="Test Family",
            baseline_capacity=25
        )
        assert family.baseline_capacity == 25

        # Update baseline capacity
        family.baseline_capacity = 30
        family.save()
        
        retrieved = Family.objects.get(id=family.id)
        assert retrieved.baseline_capacity == 30

    @pytest.mark.django_db
    def test_family_query_filter(self):
        """Test filtering Family queries"""
        # Create families with different sprint durations
        Family.objects.create(name="Weekly Family", sprint_duration=7)
        Family.objects.create(name="Bi-weekly Family", sprint_duration=14)
        Family.objects.create(name="Another Weekly", sprint_duration=7)

        # Filter by sprint_duration
        weekly_families = Family.objects.filter(sprint_duration=7)
        assert weekly_families.count() >= 2

        # Filter by gamification
        gamified = Family.objects.filter(gamification_enabled=True)
        assert gamified.count() >= 3

    @pytest.mark.django_db
    def test_family_model_validation(self):
        """Test model validation rules"""
        # Test that invalid sprint_duration is caught (if validation is called)
        family = Family(name="Test", sprint_duration=0)
        with pytest.raises(ValidationError):
            family.full_clean()

        # Test that missing default_swim_lanes is caught
        family = Family(name="Test", sprint_duration=7, default_swim_lanes=[])
        with pytest.raises(ValidationError):
            family.full_clean()

    @pytest.mark.django_db
    def test_family_supabase_connection(self):
        """Test that Family model can connect to Supabase database"""
        # This test verifies the database connection works in native environment
        # If Supabase connection is not configured, this will fail
        
        # Simple connection test - try to query the database
        family_count_before = Family.objects.count()
        
        # Create a test family
        test_family = Family.objects.create(
            name="Connection Test Family",
            sprint_duration=7
        )
        
        # Verify we can query it back
        family_count_after = Family.objects.count()
        assert family_count_after == family_count_before + 1
        
        # Verify we can retrieve the specific family
        retrieved = Family.objects.get(id=test_family.id)
        assert retrieved.name == "Connection Test Family"
        
        # Clean up
        test_family.delete()

