# Python imports
import os
import sys

import django
import pytest

# Ensure the apps/api directory is on the path so we can import plane modules
repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
api_root = os.path.join(repo_root, "apps", "api")
if api_root not in sys.path:
    sys.path.insert(0, api_root)

# Configure Django settings before importing plane modules
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "plane.settings.test")

# Minimal Django settings setup for tests that don't need a full Django stack
try:
    django.setup()
except Exception:
    # If Django setup fails (e.g., no settings module), configure minimal settings
    from django.conf import settings as django_settings
    if not django_settings.configured:
        django_settings.configure(
            SECRET_KEY="test-secret-key-for-unit-tests-only",
            INSTALLED_APPS=[],
            DATABASES={},
        )

from plane.license.utils.encryption import (
    decrypt_data,
    decrypt_data_with_status,
    derive_key,
    derive_key_legacy,
    encrypt_data,
)


@pytest.fixture(autouse=True)
def set_secret_key(settings):
    """Override SECRET_KEY for each test."""
    settings.SECRET_KEY = "test-secret-key-for-unit-tests"


class TestDeriveKey:
    def test_different_secret_keys_produce_different_derived_keys(self):
        """Different SECRET_KEY values must produce different derived keys."""
        key1 = derive_key("secret_key_one")
        key2 = derive_key("secret_key_two")
        assert key1 != key2

    def test_same_secret_key_produces_same_derived_key(self):
        """Same SECRET_KEY must always produce the same derived key (deterministic KDF)."""
        key1 = derive_key("my_secret_key")
        key2 = derive_key("my_secret_key")
        assert key1 == key2

    def test_new_and_legacy_keys_differ_for_same_secret(self):
        """New KDF and legacy KDF must produce different keys for the same secret."""
        new_key = derive_key("some_secret")
        legacy_key = derive_key_legacy("some_secret")
        assert new_key != legacy_key


class TestEncryptData:
    def test_encrypt_returns_non_empty_string(self, settings):
        settings.SECRET_KEY = "test-secret-key"
        result = encrypt_data("hello world")
        assert result
        assert isinstance(result, str)

    def test_encrypt_empty_string_returns_empty(self, settings):
        settings.SECRET_KEY = "test-secret-key"
        result = encrypt_data("")
        assert result == ""

    def test_encrypt_none_returns_empty(self, settings):
        settings.SECRET_KEY = "test-secret-key"
        result = encrypt_data(None)
        assert result == ""

    def test_encrypt_produces_different_ciphertexts_each_call(self, settings):
        """Fernet uses a random IV, so the same plaintext encrypted twice must differ."""
        settings.SECRET_KEY = "test-secret-key"
        plaintext = "repeated_sensitive_value"
        ciphertexts = {encrypt_data(plaintext) for _ in range(5)}
        # If all 5 encryptions produce the same ciphertext, the scheme is deterministic
        # which is a security weakness — this MUST fail, not just warn.
        assert len(ciphertexts) > 1, (
            "Deterministic encryption detected: all 5 encryptions of the same plaintext "
            "produced identical ciphertexts. The encryption scheme must use a random IV/nonce."
        )


class TestDecryptData:
    def test_decrypt_empty_string_returns_empty(self, settings):
        settings.SECRET_KEY = "test-secret-key"
        result = decrypt_data("")
        assert result == ""

    def test_decrypt_none_returns_empty(self, settings):
        settings.SECRET_KEY = "test-secret-key"
        result = decrypt_data(None)
        assert result == ""

    def test_roundtrip_integrity(self, settings):
        """Encryption/decryption roundtrip must preserve data integrity."""
        settings.SECRET_KEY = "test-secret-key-for-roundtrip"
        payloads = [
            "normal_value",
            "special!@#$%^&*()chars",
            "unicode_value_\u00e9\u00e0\u00fc",
            "a" * 1000,
            '{"json": "value", "nested": {"key": "val"}}',
        ]
        for payload in payloads:
            encrypted = encrypt_data(payload)
            decrypted = decrypt_data(encrypted)
            assert decrypted == payload, f"Roundtrip failed for payload: {payload!r}"

    def test_wrong_key_returns_empty(self, settings):
        """Decrypting with a different key must return empty string, not raise."""
        settings.SECRET_KEY = "original-secret-key"
        encrypted = encrypt_data("sensitive_data")

        settings.SECRET_KEY = "completely-different-key"
        result = decrypt_data(encrypted)
        assert result == ""


class TestDecryptDataWithStatus:
    def test_returns_tuple(self, settings):
        settings.SECRET_KEY = "test-secret-key"
        result = decrypt_data_with_status("")
        assert isinstance(result, tuple)
        assert len(result) == 2

    def test_empty_input_returns_false_legacy(self, settings):
        settings.SECRET_KEY = "test-secret-key"
        plaintext, used_legacy = decrypt_data_with_status("")
        assert plaintext == ""
        assert used_legacy is False

    def test_current_encryption_not_legacy(self, settings):
        """Values encrypted with the current scheme must not be flagged as legacy."""
        settings.SECRET_KEY = "test-secret-key"
        encrypted = encrypt_data("my_value")
        plaintext, used_legacy = decrypt_data_with_status(encrypted)
        assert plaintext == "my_value"
        assert used_legacy is False

    def test_legacy_encryption_detected(self, settings):
        """Values encrypted with the legacy scheme must be flagged as legacy."""
        from cryptography.fernet import Fernet

        settings.SECRET_KEY = "test-secret-key"
        # Encrypt using the legacy key derivation directly
        legacy_key = derive_key_legacy(settings.SECRET_KEY)
        legacy_cipher = Fernet(legacy_key)
        legacy_encrypted = legacy_cipher.encrypt(b"legacy_value").decode()

        plaintext, used_legacy = decrypt_data_with_status(legacy_encrypted)
        assert plaintext == "legacy_value"
        assert used_legacy is True


class TestKeyIsolation:
    @pytest.mark.parametrize("secret_key", [
        "secret1",
        "secret2",
        "a-]different-key!@#$",
    ])
    def test_different_keys_produce_different_ciphertexts(self, settings, secret_key):
        """Different SECRET_KEY values must produce different encrypted outputs
        for the same plaintext, ensuring the key derivation provides uniqueness."""
        plaintext = "sensitive_data_12345"
        other_key = secret_key + "_different"

        settings.SECRET_KEY = secret_key
        ct1 = encrypt_data(plaintext)

        settings.SECRET_KEY = other_key
        ct2 = encrypt_data(plaintext)

        assert ct1 != ct2, (
            "Different secret keys produced identical ciphertexts — "
            "key derivation is not properly differentiating keys"
        )
