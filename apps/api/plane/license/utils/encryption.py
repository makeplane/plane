# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import base64
import functools
import hashlib
from django.conf import settings
from cryptography.fernet import Fernet

from plane.utils.exception_logger import log_exception


@functools.lru_cache(maxsize=4)
def derive_key(secret_key):
    # Use a key derivation function to get a suitable encryption key. PBKDF2 is deliberately slow
    # and the result depends only on the secret, so it is computed once per secret per process.
    dk = hashlib.pbkdf2_hmac("sha256", secret_key.encode(), b"salt", 100000)
    return base64.urlsafe_b64encode(dk)


# Encrypt data
def encrypt_data(data):
    try:
        if data:
            cipher_suite = Fernet(derive_key(settings.SECRET_KEY))
            encrypted_data = cipher_suite.encrypt(data.encode())
            return encrypted_data.decode()  # Convert bytes to string
        else:
            return ""
    except Exception as e:
        log_exception(e)
        return ""


# Decrypt data
def decrypt_data(encrypted_data):
    try:
        if encrypted_data:
            cipher_suite = Fernet(derive_key(settings.SECRET_KEY))
            decrypted_data = cipher_suite.decrypt(encrypted_data.encode())  # Convert string back to bytes
            return decrypted_data.decode()
        else:
            return ""
    except Exception as e:
        log_exception(e)
        return ""


class EncryptionError(Exception):
    """Raised when a secret cannot be encrypted or decrypted.

    ``encrypt_data`` / ``decrypt_data`` swallow failures and return ``""``.
    That is acceptable for optional instance configuration, but for credentials
    it would silently turn a stored secret into an empty one (for example after
    ``SECRET_KEY`` rotation). The strict variants below surface that instead.
    """


def encrypt_data_strict(data: str) -> str:
    """Encrypt ``data``; raise ``EncryptionError`` instead of returning ``""`` on failure."""
    if not data:
        return ""
    encrypted = encrypt_data(data)
    if not encrypted:
        raise EncryptionError("Failed to encrypt secret")
    return encrypted


def decrypt_data_strict(encrypted_data: str) -> str:
    """Decrypt ``encrypted_data``; a non-empty ciphertext that decrypts to ``""`` raises ``EncryptionError``."""
    if not encrypted_data:
        return ""
    decrypted = decrypt_data(encrypted_data)
    if not decrypted:
        raise EncryptionError("Failed to decrypt secret; was SECRET_KEY changed?")
    return decrypted
