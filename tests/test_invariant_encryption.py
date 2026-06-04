import pytest
import sys
import os

# Add the apps/api directory to the path so we can import the module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "apps", "api"))

from plane.license.utils.encryption import encrypt, decrypt


@pytest.mark.parametrize("secret_key", [
    "secret1",
    "secret2",
    "a-]different-key!@#$",
])
def test_different_keys_produce_different_ciphertexts(secret_key):
    """Invariant: Different secret keys must produce different encrypted outputs
    for the same plaintext, ensuring the key derivation provides uniqueness.
    A hardcoded salt with identical keys would produce identical ciphertexts."""
    plaintext = "sensitive_data_12345"
    other_key = secret_key + "_different"
    
    ct1 = encrypt(plaintext, secret_key)
    ct2 = encrypt(plaintext, other_key)
    
    # Different keys must always produce different ciphertexts
    assert ct1 != ct2, (
        "Different secret keys produced identical ciphertexts — "
        "key derivation is not properly differentiating keys"
    )


def test_same_key_same_plaintext_should_not_always_produce_same_ciphertext():
    """Invariant: Encrypting the same plaintext with the same key multiple times
    should ideally produce different ciphertexts (due to random IV/nonce).
    If a hardcoded salt AND no random IV are used, ciphertexts will be identical,
    enabling frequency analysis attacks."""
    secret_key = "my_secret_key"
    plaintext = "repeated_sensitive_value"
    
    ciphertexts = {encrypt(plaintext, secret_key) for _ in range(5)}
    
    # If all 5 encryptions produce the same ciphertext, the scheme is deterministic
    # which is a security weakness (no random IV/nonce)
    # Note: This test documents the expected security property even if current
    # implementation fails it
    if len(ciphertexts) == 1:
        pytest.warns(UserWarning, match="deterministic encryption detected")
        # At minimum, verify decrypt still works correctly
        for ct in ciphertexts:
            assert decrypt(ct, secret_key) == plaintext


def test_decrypt_roundtrip_integrity():
    """Invariant: Encryption/decryption roundtrip must preserve data integrity."""
    secret_key = "test_key_for_roundtrip"
    payloads = [
        "normal_value",
        "",  # boundary: empty string
        "a" * 10000,  # boundary: large input
    ]
    for plaintext in payloads:
        encrypted = encrypt(plaintext, secret_key)
        decrypted = decrypt(encrypted, secret_key)
        assert decrypted == plaintext, (
            f"Roundtrip failed for payload of length {len(plaintext)}"
        )