# Python imports
import uuid

# Module imports
from plane.utils.uuid import is_valid_uuid, convert_uuid_to_integer


def test_is_valid_uuid_with_valid_v4_uuid():
    """
    Test that a valid UUID v4 string is correctly identified as valid.
    """
    valid_uuid = str(uuid.uuid4())
    assert is_valid_uuid(valid_uuid) is True


def test_is_valid_uuid_with_invalid_string():
    """
    Test that a non-UUID string is correctly identified as invalid.
    This ensures the function properly rejects malformed UUID strings.
    """
    assert is_valid_uuid("not-a-uuid") is False


def test_is_valid_uuid_with_numeric_string():
    """
    Test that a numeric string is correctly identified as invalid.
    This ensures the function properly rejects numeric strings that aren't UUIDs.
    """
    assert is_valid_uuid("123") is False


def test_is_valid_uuid_with_empty_string():
    """
    Test that an empty string is correctly identified as invalid.
    This ensures the function properly handles edge cases with empty input.
    """
    assert is_valid_uuid("") is False


def test_is_valid_uuid_with_v1_uuid():
    """
    Test that a UUID v1 is correctly identified as invalid.
    The function specifically checks for UUID v4, so v1 UUIDs should be rejected.
    """
    v1_uuid = "123e4567-e89b-12d3-a456-426614174000"
    assert is_valid_uuid(v1_uuid) is False


def test_convert_uuid_to_integer_returns_integer():
    """
    Test that the function returns an integer value.
    This verifies the basic return type of the conversion function.
    """
    test_uuid = uuid.uuid4()
    result = convert_uuid_to_integer(test_uuid)
    assert isinstance(result, int)


def test_convert_uuid_to_integer_within_64bit_range():
    """
    Test that the converted integer is within the valid 64-bit signed integer range.
    The range for 64-bit signed integers is -2^63 to 2^63-1.
    """
    test_uuid = uuid.uuid4()
    result = convert_uuid_to_integer(test_uuid)
    assert -(2**63) <= result <= 2**63 - 1


def test_convert_uuid_to_integer_idempotency():
    """
    Test that converting the same UUID multiple times produces the same integer.
    This verifies the deterministic nature of the conversion function.
    """
    test_uuid = uuid.uuid4()
    result1 = convert_uuid_to_integer(test_uuid)
    result2 = convert_uuid_to_integer(test_uuid)
    assert result1 == result2


def test_convert_uuid_to_integer_different_results():
    """
    Test that different UUIDs produce different integer results.
    This ensures the conversion function maintains uniqueness across different UUIDs.
    """
    uuid1 = uuid.uuid4()
    uuid2 = uuid.uuid4()
    result1 = convert_uuid_to_integer(uuid1)
    result2 = convert_uuid_to_integer(uuid2)
    assert result1 != result2
