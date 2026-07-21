# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import base64
import hashlib
from functools import lru_cache
from django.conf import settings
from cryptography.fernet import Fernet, InvalidToken

from plane.utils.exception_logger import log_exception


@lru_cache(maxsize=1)
def _derive_key_legacy(secret_key):
    # Legacy key derivation using static salt – retained for backward compatibility
    # so that ciphertext created before the salt fix can still be decrypted.
    dk = hashlib.pbkdf2_hmac("sha256", secret_key.encode(), b"salt", 100000)
    return base64.urlsafe_b64encode(dk)


@lru_cache(maxsize=1)
def derive_key(secret_key):
    # Use a key derivation function to get a suitable encryption key
    salt = hashlib.sha256(secret_key.encode()).digest()
    dk = hashlib.pbkdf2_hmac("sha256", secret_key.encode(), salt, 100000)
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
            # Try the current (secure) key derivation first.
            try:
                cipher_suite = Fernet(derive_key(settings.SECRET_KEY))
                decrypted_data = cipher_suite.decrypt(encrypted_data.encode())
                return decrypted_data.decode()
            except InvalidToken:
                # Fall back to the legacy static-salt derivation for ciphertext
                # that was created before the salt fix was applied.
                cipher_suite = Fernet(_derive_key_legacy(settings.SECRET_KEY))
                decrypted_data = cipher_suite.decrypt(encrypted_data.encode())  # Convert string back to bytes
                return decrypted_data.decode()
        else:
            return ""
    except Exception as e:
        log_exception(e)
        return ""
