import pytest
from rest_framework import serializers

from plane.app.serializers.user import UserSerializer


@pytest.mark.unit
class TestUserSerializer:
    """Test the UserSerializer"""

    def test_validate_first_name_valid(self):
        """Test that valid first names are accepted"""

        serializer = UserSerializer()
        valid_names = [
            "John",
            "John Doe",
            "John-Doe",
            "John_Doe",
            "John123",
        ]

        for name in valid_names:
            result = serializer.validate_first_name(name)

            assert result == name

    def test_validate_first_name_with_url(self):
        """Test that first names containing URLs are rejected"""

        serializer = UserSerializer()
        invalid_names = [
            "http://example.com",
            "John https://test.com",
            "www.test.com",
        ]

        for name in invalid_names:
            with pytest.raises(serializers.ValidationError) as exc_info:
                serializer.validate_first_name(name)

            assert str(exc_info.value.detail[0]) == "First name cannot contain a URL."

    def test_validate_first_name_with_special_chars(self):
        """Test that first names with special characters are rejected"""

        serializer = UserSerializer()
        invalid_names = [
            "John@Doe",
            "John#Doe",
            "John$Doe",
            "John!Doe",
            "John&Doe",
        ]

        for name in invalid_names:
            with pytest.raises(serializers.ValidationError) as exc_info:
                serializer.validate_first_name(name)

            assert str(exc_info.value.detail[0]) == (
                "first name can only contain letters, numbers, "
                "hyphens (-), and underscores (_)"
            )

    def test_validate_last_name_valid(self):
        """Test that valid last names are accepted"""

        serializer = UserSerializer()
        valid_names = [
            "Smith",
            "Smith Jr",
            "Smith-Jr",
            "Smith_Jr",
            "Smith123",
            "",
        ]

        for name in valid_names:
            result = serializer.validate_last_name(name)

            assert result == name

    def test_validate_last_name_with_url(self):
        """Test that last names containing URLs are rejected"""

        serializer = UserSerializer()
        invalid_names = [
            "http://example.com",
            "Smith https://test.com",
            "www.test.com",
        ]

        for name in invalid_names:
            with pytest.raises(serializers.ValidationError) as exc_info:
                serializer.validate_last_name(name)

            assert str(exc_info.value.detail[0]) == "Last name cannot contain a URL."

    def test_validate_last_name_with_special_chars(self):
        """Test that last names with special characters are rejected"""

        serializer = UserSerializer()
        invalid_names = [
            "Smith@Jr",
            "Smith#Jr",
            "Smith$Jr",
            "Smith!Jr",
            "Smith&Jr",
        ]

        for name in invalid_names:
            with pytest.raises(serializers.ValidationError) as exc_info:
                serializer.validate_last_name(name)

            assert str(exc_info.value.detail[0]) == (
                "last name can only contain letters, numbers, "
                "hyphens (-), and underscores (_)"
            )
