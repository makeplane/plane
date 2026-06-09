import pytest
from django.test import override_settings

from plane.license.utils.encryption import (
    decrypt_data,
    decrypt_data_with_status,
    derive_key,
    derive_key_legacy,
    encrypt_data,
)


class TestEncryptionRoundtrip:
    @override_settings(SECRET_KEY="test_key")
    @pytest.mark.parametrize("plaintext", [
        "normal_value",
        "a" * 10000,
        "special!@#$%^&*()",
    ])
    def test_roundtrip_preserves_data(self, plaintext):
        """Invariant: Encryption/decryption roundtrip must preserve data integrity."""
        encrypted = encrypt_data(plaintext)
        assert encrypted, "encrypt_data must return a non-empty string"
        assert decrypt_data(encrypted) == plaintext

    @override_settings(SECRET_KEY="test_key")
    def test_empty_string_roundtrip(self):
        """Empty input should return empty output without error."""
        assert encrypt_data("") == ""
        assert decrypt_data("") == ""

    @override_settings(SECRET_KEY="test_key")
    def test_none_like_empty_decrypt(self):
        """None-like empty encrypted_data should return empty string."""
        assert decrypt_data(None) == ""


class TestKeyDerivationUniqueness:
    def test_different_secret_keys_produce_different_derived_keys(self):
        """Different SECRET_KEY values must produce different derived keys."""
        key1 = derive_key("secret_key_one")
        key2 = derive_key("secret_key_two")
        assert key1 != key2, (
            "Different secret keys must produce different derived keys"
        )

    def test_legacy_and_current_keys_differ_for_same_secret(self):
        """The new KDF must produce a different key than the legacy KDF for the same secret."""
        secret = "shared_secret"
        current = derive_key(secret)
        legacy = derive_key_legacy(secret)
        assert current != legacy, (
            "Current and legacy key derivation must produce different keys"
        )

    @override_settings(SECRET_KEY="key_a")
    def test_different_secret_keys_produce_different_ciphertexts(self):
        """Different SECRET_KEY deployments must produce different ciphertexts."""
        plaintext = "sensitive_data_12345"

        with override_settings(SECRET_KEY="key_a"):
            ct1 = encrypt_data(plaintext)

        with override_settings(SECRET_KEY="key_b"):
            ct2 = encrypt_data(plaintext)

        assert ct1 != ct2, (
            "Different secret keys produced identical ciphertexts — "
            "key derivation is not properly differentiating keys"
        )


class TestNonDeterministicEncryption:
    @override_settings(SECRET_KEY="my_secret_key")
    def test_same_key_same_plaintext_produces_different_ciphertexts(self):
        """Encrypting the same plaintext with the same key multiple times
        must produce different ciphertexts due to random IV/nonce (Fernet uses
        a random 128-bit IV per encryption). Deterministic output is a security
        weakness enabling frequency analysis attacks."""
        plaintext = "repeated_sensitive_value"

        ciphertexts = {encrypt_data(plaintext) for _ in range(5)}

        assert len(ciphertexts) > 1, (
            "Deterministic encryption detected: all 5 encryptions of the same "
            "plaintext produced identical ciphertexts. This is a security weakness "
            "— the encryption scheme must use a random IV/nonce."
        )


class TestLegacyFallback:
    @override_settings(SECRET_KEY="test_secret")
    def test_legacy_encrypted_value_can_be_decrypted(self):
        """Values encrypted with the legacy KDF must still be decryptable."""
        from cryptography.fernet import Fernet
        from django.conf import settings

        # Encrypt with legacy key
        legacy_key = derive_key_legacy(settings.SECRET_KEY)
        cipher = Fernet(legacy_key)
        legacy_ciphertext = cipher.encrypt(b"legacy_plaintext").decode()

        # decrypt_data should fall back to legacy and return the plaintext
        result = decrypt_data(legacy_ciphertext)
        assert result == "legacy_plaintext", (
            "decrypt_data must fall back to legacy KDF for old ciphertexts"
        )

    @override_settings(SECRET_KEY="test_secret")
    def test_decrypt_with_status_reports_legacy_usage(self):
        """decrypt_data_with_status must return used_legacy=True for legacy ciphertexts."""
        from cryptography.fernet import Fernet
        from django.conf import settings

        legacy_key = derive_key_legacy(settings.SECRET_KEY)
        cipher = Fernet(legacy_key)
        legacy_ciphertext = cipher.encrypt(b"legacy_value").decode()

        plaintext, used_legacy = decrypt_data_with_status(legacy_ciphertext)
        assert plaintext == "legacy_value"
        assert used_legacy is True, (
            "decrypt_data_with_status must report used_legacy=True for legacy ciphertexts"
        )

    @override_settings(SECRET_KEY="test_secret")
    def test_decrypt_with_status_reports_current_usage(self):
        """decrypt_data_with_status must return used_legacy=False for current ciphertexts."""
        plaintext_in = "current_value"
        ciphertext = encrypt_data(plaintext_in)

        plaintext, used_legacy = decrypt_data_with_status(ciphertext)
        assert plaintext == plaintext_in
        assert used_legacy is False, (
            "decrypt_data_with_status must report used_legacy=False for current ciphertexts"
        )

    @override_settings(SECRET_KEY="test_secret")
    def test_invalid_ciphertext_returns_empty_string(self):
        """Completely invalid ciphertext must return empty string without raising."""
        result = decrypt_data("not_a_valid_ciphertext")
        assert result == ""

    @override_settings(SECRET_KEY="test_secret")
    def test_decrypt_with_status_invalid_returns_empty_false(self):
        """Invalid ciphertext in decrypt_data_with_status must return ('', False)."""
        plaintext, used_legacy = decrypt_data_with_status("not_a_valid_ciphertext")
        assert plaintext == ""
        assert used_legacy is False
