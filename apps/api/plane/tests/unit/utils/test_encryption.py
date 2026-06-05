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
        encrypted = encrypt_data(plaintext)
        assert decrypt_data(encrypted) == plaintext

    @override_settings(SECRET_KEY="test_key")
    def test_empty_string_roundtrip(self):
        assert decrypt_data("") == ""
        assert decrypt_data(None) == ""


class TestKeyDerivation:
    def test_different_keys_produce_different_derived_keys(self):
        """Different secret keys must produce different derived keys."""
        key1 = derive_key("secret1")
        key2 = derive_key("secret2")
        assert key1 != key2

    def test_new_and_legacy_derivation_differ(self):
        """New HMAC-based derivation must differ from legacy."""
        secret = "test_secret_key"
        new_key = derive_key(secret)
        legacy_key = derive_key_legacy(secret)
        assert new_key != legacy_key


class TestNonDeterminism:
    @override_settings(SECRET_KEY="test_key")
    def test_same_plaintext_produces_different_ciphertexts(self):
        """Encrypting the same plaintext multiple times should produce
        different ciphertexts due to random IV/nonce in Fernet."""
        plaintext = "repeated_sensitive_value"
        ciphertexts = {encrypt_data(plaintext) for _ in range(5)}
        
        # Fernet uses random IV, so all ciphertexts should be unique
        # If they're all the same, the encryption is deterministic (security issue)
        assert len(ciphertexts) > 1, (
            "Encryption is deterministic - all ciphertexts are identical. "
            "This is a security vulnerability allowing frequency analysis."
        )


class TestLegacyFallback:
    @override_settings(SECRET_KEY="test_key")
    def test_legacy_encrypted_data_can_be_decrypted(self):
        """Data encrypted with legacy KDF should still be decryptable."""
        from cryptography.fernet import Fernet
        
        plaintext = "legacy_secret_value"
        # Encrypt using legacy key derivation
        legacy_key = derive_key_legacy("test_key")
        cipher = Fernet(legacy_key)
        legacy_encrypted = cipher.encrypt(plaintext.encode()).decode()
        
        # Should be able to decrypt with fallback
        decrypted = decrypt_data(legacy_encrypted)
        assert decrypted == plaintext

    @override_settings(SECRET_KEY="test_key")
    def test_decrypt_with_status_reports_legacy_usage(self):
        """decrypt_data_with_status should report when legacy KDF was used."""
        from cryptography.fernet import Fernet
        
        plaintext = "legacy_secret_value"
        # Encrypt using legacy key derivation
        legacy_key = derive_key_legacy("test_key")
        cipher = Fernet(legacy_key)
        legacy_encrypted = cipher.encrypt(plaintext.encode()).decode()
        
        decrypted, used_legacy = decrypt_data_with_status(legacy_encrypted)
        assert decrypted == plaintext
        assert used_legacy is True

    @override_settings(SECRET_KEY="test_key")
    def test_decrypt_with_status_reports_current_kdf(self):
        """decrypt_data_with_status should report False for current KDF."""
        plaintext = "current_secret_value"
        encrypted = encrypt_data(plaintext)
        
        decrypted, used_legacy = decrypt_data_with_status(encrypted)
        assert decrypted == plaintext
        assert used_legacy is False


class TestEdgeCases:
    @override_settings(SECRET_KEY="test_key")
    def test_invalid_ciphertext_returns_empty_string(self):
        """Invalid ciphertext should return empty string, not raise."""
        result = decrypt_data("not_valid_base64_ciphertext")
        assert result == ""

    @override_settings(SECRET_KEY="test_key")
    def test_wrong_key_returns_empty_string(self):
        """Ciphertext encrypted with different key should return empty."""
        from cryptography.fernet import Fernet
        
        # Encrypt with a completely different key
        other_key = Fernet.generate_key()
        cipher = Fernet(other_key)
        encrypted = cipher.encrypt(b"secret").decode()
        
        # Should fail gracefully
        result = decrypt_data(encrypted)
        assert result == ""
