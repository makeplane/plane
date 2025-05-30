import uuid
import pytest
from plane.utils.uuid import is_valid_uuid, convert_uuid_to_integer


@pytest.mark.unit
class TestUUIDUtils:
    """Test the UUID utilities"""

    def test_is_valid_uuid_with_valid_uuid(self):
        """Test is_valid_uuid with a valid UUID"""
        # Generate a valid UUID
        valid_uuid = str(uuid.uuid4())
        assert is_valid_uuid(valid_uuid) is True

    def test_is_valid_uuid_with_invalid_uuid(self):
        """Test is_valid_uuid with invalid UUID strings"""
        # Test with different invalid formats
        assert is_valid_uuid("not-a-uuid") is False
        assert is_valid_uuid("123456789") is False
        assert is_valid_uuid("") is False
        assert (
            is_valid_uuid("00000000-0000-0000-0000-000000000000") is False
        )  # This is a valid UUID but version 1

    def test_convert_uuid_to_integer(self):
        """Test convert_uuid_to_integer function"""
        # Create a known UUID
        test_uuid = uuid.UUID("f47ac10b-58cc-4372-a567-0e02b2c3d479")

        # Convert to integer
        result = convert_uuid_to_integer(test_uuid)

        # Check that the result is an integer
        assert isinstance(result, int)

        # Ensure consistent results with the same input
        assert convert_uuid_to_integer(test_uuid) == result

        # Different UUIDs should produce different integers
        different_uuid = uuid.UUID("550e8400-e29b-41d4-a716-446655440000")
        assert convert_uuid_to_integer(different_uuid) != result

    def test_convert_uuid_to_integer_string_input(self):
        """Test convert_uuid_to_integer handles string UUID"""
        # Test with a UUID string
        test_uuid_str = "f47ac10b-58cc-4372-a567-0e02b2c3d479"
        test_uuid = uuid.UUID(test_uuid_str)

        # Should get the same result whether passing UUID or string
        assert convert_uuid_to_integer(test_uuid) == convert_uuid_to_integer(
            test_uuid_str
        )
