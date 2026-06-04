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
    def test_empty_input_returns_empty(self):
        assert encrypt_data("") == ""
        assert decrypt_data("") == ""


class TestKeyDifferentiation:
    def test_different_keys_produce_different_ciphertexts(self):
        plaintext = "sensitive_data_12345"
        with override_settings(SECRET_KEY="key_alpha"):
            ct1 = encrypt_data(plaintext)
        with override_settings(SECRET_KEY="key_beta"):
            ct2 = encrypt_data(plaintext)
        assert ct1 != ct2

    def test_wrong_key_decryption_returns_empty(self):
        with override_settings(SECRET_KEY="encrypt_key"):
            encrypted = encrypt_data("secret")
        with override_settings(SECRET_KEY="wrong_key"):
            assert decrypt_data(encrypted) == ""


class TestNonDeterminism:
    @override_settings(SECRET_KEY="fixed_key")
    def test_repeated_encryption_produces_unique_ciphertexts(self):
        plaintext = "repeated_value"
        ciphertexts = {encrypt_data(plaintext) for _ in range(5)}
        assert len(ciphertexts) == 5, (
            f"Expected 5 unique ciphertexts, got {len(ciphertexts)}. "
            "Encryption is deterministic — missing random IV."
        )


class TestLegacyFallback:
    @override_settings(SECRET_KEY="migration_key")
    def test_legacy_encrypted_data_decrypts(self):
        from cryptography.fernet import Fernet

        legacy_key = derive_key_legacy("migration_key")
        legacy_ct = Fernet(legacy_key).encrypt(b"old_secret").decode()
        assert decrypt_data(legacy_ct) == "old_secret"

    @override_settings(SECRET_KEY="migration_key")
    def test_legacy_fallback_signals_status(self):
        from cryptography.fernet import Fernet

        legacy_key = derive_key_legacy("migration_key")
        legacy_ct = Fernet(legacy_key).encrypt(b"old_secret").decode()
        plaintext, used_legacy = decrypt_data_with_status(legacy_ct)
        assert plaintext == "old_secret"
        assert used_legacy is True

    @override_settings(SECRET_KEY="current_key")
    def test_current_encryption_does_not_trigger_fallback(self):
        encrypted = encrypt_data("new_secret")
        plaintext, used_legacy = decrypt_data_with_status(encrypted)
        assert plaintext == "new_secret"
        assert used_legacy is False
