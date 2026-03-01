# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

from django.conf import settings
import base64
import hashlib
import secrets
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from django.core.exceptions import ImproperlyConfigured

# uses AES-256-GCM to encrypt and decrypt data (FIPS-compliant)


def derive_key() -> bytes:
    # Raw 32-byte key for AES-256
    if not settings.AES_SECRET_KEY or not settings.AES_SALT:
        raise ImproperlyConfigured("AES_SECRET_KEY or AES_SALT is not set")
    return hashlib.pbkdf2_hmac(
        "sha256",
        settings.AES_SECRET_KEY.encode(),
        settings.AES_SALT.encode(),
        100_000,
        dklen=32,
    )


def encrypt(plain_text: str):
    key = derive_key()
    aesgcm = AESGCM(key)
    nonce = secrets.token_bytes(12)  # 12 bytes for GCM (FIPS-compliant random generation)
    # AESGCM.encrypt returns ciphertext + tag (16 bytes) concatenated
    encrypted = aesgcm.encrypt(nonce, plain_text.encode(), None)
    # Split ciphertext and tag (last 16 bytes are the tag)
    ciphertext = encrypted[:-16]
    tag = encrypted[-16:]

    return {
        "iv": base64.b64encode(nonce).decode(),
        "ciphertext": base64.b64encode(ciphertext).decode(),
        "tag": base64.b64encode(tag).decode(),
    }


def decrypt(encrypted_data: dict):
    key = derive_key()
    aesgcm = AESGCM(key)
    nonce = base64.b64decode(encrypted_data["iv"])
    ciphertext = base64.b64decode(encrypted_data["ciphertext"])
    tag = base64.b64decode(encrypted_data["tag"])
    # Reconstruct: ciphertext + tag for AESGCM.decrypt()
    encrypted = ciphertext + tag
    return aesgcm.decrypt(nonce, encrypted, None).decode()
