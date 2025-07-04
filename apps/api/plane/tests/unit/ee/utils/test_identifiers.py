import re
import pytest
from plane.ee.utils.identifiers import generate_short_id


@pytest.mark.unit
class TestIdentifierUtils:
    """Test the identifier generation utilities"""

    def test_generate_short_id_default_length(self):
        """Test generate_short_id with default length of 6"""
        # Arrange
        expected_length = 6
        expected_pattern = r"^[a-z0-9]+$"

        # Act
        short_id = generate_short_id()

        # Assert
        assert len(short_id) == expected_length
        assert re.match(expected_pattern, short_id)

    def test_generate_short_id_custom_length(self):
        """Test generate_short_id with custom lengths"""
        # Arrange
        test_lengths = [4, 6, 8, 10, 12]
        expected_pattern = r"^[a-z0-9]+$"

        for length in test_lengths:
            # Act
            short_id = generate_short_id(length=length)

            # Assert
            assert len(short_id) == length
            assert re.match(expected_pattern, short_id)

    def test_generate_short_id_minimum_length_validation(self):
        """Test that generate_short_id enforces minimum length"""
        # Arrange
        invalid_lengths = [0, 1, 2, 3]

        # Act & Assert
        for length in invalid_lengths:
            with pytest.raises((ValueError, AssertionError)):
                generate_short_id(length=length)

    def test_generate_short_id_minimum_valid_length(self):
        """Test generate_short_id with minimum valid length"""
        # Arrange
        min_valid_length = 4
        expected_pattern = r"^[a-z0-9]+$"

        # Act
        short_id = generate_short_id(length=min_valid_length)

        # Assert
        assert len(short_id) == min_valid_length
        assert re.match(expected_pattern, short_id)

    def test_generate_short_id_uniqueness(self):
        """Test that multiple calls generate different IDs"""
        # Arrange
        num_ids_to_generate = 1000
        ids = set()

        # Act
        for _ in range(num_ids_to_generate):
            short_id = generate_short_id()
            ids.add(short_id)

        # Assert
        # With 36^6 possibilities, 1000 IDs should be unique
        assert len(ids) == num_ids_to_generate

    def test_generate_short_id_character_set(self):
        """Test that generated IDs only use allowed characters"""
        # Arrange
        allowed_chars = set("abcdefghijklmnopqrstuvwxyz0123456789")
        num_tests = 100

        # Act & Assert
        for _ in range(num_tests):
            short_id = generate_short_id()
            used_chars = set(short_id)

            assert used_chars.issubset(allowed_chars)

    def test_generate_short_id_no_uppercase(self):
        """Test that generated IDs don't contain uppercase letters"""
        # Arrange
        num_tests = 100

        # Act & Assert
        for _ in range(num_tests):
            short_id = generate_short_id()

            # Should not contain any uppercase letters
            assert not any(c.isupper() for c in short_id)

    def test_generate_short_id_distribution(self):
        """Test that generated IDs have reasonable character distribution"""
        # Arrange
        num_tests = 100
        id_length = 6
        char_counts = {}
        total_chars = 0
        min_unique_chars = 10
        max_char_dominance = 0.2

        # Act
        for _ in range(num_tests):
            short_id = generate_short_id(length=id_length)
            for char in short_id:
                char_counts[char] = char_counts.get(char, 0) + 1
                total_chars += 1

        # Assert
        # Should have used multiple different characters
        assert len(char_counts) > min_unique_chars

        # No character should dominate (rough check for randomness)
        max_usage = max(char_counts.values())
        assert max_usage < total_chars * max_char_dominance

    def test_generate_short_id_consistency(self):
        """Test that function parameters work consistently"""
        # Arrange
        test_lengths = [4, 5, 7, 9]
        num_tests_per_length = 10

        # Act & Assert
        for length in test_lengths:
            for _ in range(num_tests_per_length):
                short_id = generate_short_id(length=length)

                assert len(short_id) == length

    def test_generate_short_id_no_special_characters(self):
        """Test that generated IDs don't contain special characters"""
        # Arrange
        special_chars = set("!@#$%^&*()-_=+[]{}|;:,.<>?/~`'\"\\")
        num_tests = 100

        # Act & Assert
        for _ in range(num_tests):
            short_id = generate_short_id()
            used_chars = set(short_id)

            assert not used_chars.intersection(special_chars)

    def test_generate_short_id_returns_string(self):
        """Test that generate_short_id always returns a string"""
        # Arrange
        test_lengths = [4, 6, 10]

        # Act & Assert
        for length in test_lengths:
            short_id = generate_short_id(length=length)

            assert isinstance(short_id, str)

    def test_generate_short_id_cryptographic_quality(self):
        """Test that generated IDs have good cryptographic properties"""
        # Arrange
        num_tests = 1000
        generated_ids = []

        # Act
        for _ in range(num_tests):
            short_id = generate_short_id()
            generated_ids.append(short_id)

        # Assert
        # Check that we don't have obvious patterns
        unique_ids = set(generated_ids)
        assert len(unique_ids) == num_tests  # All should be unique

        # Check that first and last characters vary
        first_chars = set(id_[0] for id_ in generated_ids if id_)
        last_chars = set(id_[-1] for id_ in generated_ids if id_)

        # Should have variety in first and last positions
        assert len(first_chars) > 5
        assert len(last_chars) > 5

    def test_generate_short_id_negative_length(self):
        """Test that generate_short_id handles negative lengths appropriately"""
        # Arrange
        negative_lengths = [-1, -5, -10]

        # Act & Assert
        for length in negative_lengths:
            with pytest.raises((ValueError, AssertionError)):
                generate_short_id(length=length)

    def test_generate_short_id_security_minimum(self):
        """Test that minimum length provides adequate security"""
        # Arrange
        min_length = 4
        num_tests = 100

        # Act
        ids = set()
        for _ in range(num_tests):
            short_id = generate_short_id(length=min_length)
            ids.add(short_id)

        # Assert
        # Even at minimum length, should generate unique IDs for small sample
        assert len(ids) == num_tests  # All 100 should be unique

        # Each ID should be exactly the minimum length
        for short_id in ids:
            assert len(short_id) == min_length
