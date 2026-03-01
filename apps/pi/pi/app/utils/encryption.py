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

import base64
import hashlib
from typing import Dict

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from pi import settings


def derive_key() -> bytes:
    """
    Derive AES-256 key from environment variables.

    Returns:
        bytes: 32-byte key for AES-256

    Raises:
        ValueError: If AES_SECRET_KEY or AES_SALT is not set
    """
    aes_secret_key = settings.plane_api.AES_SECRET_KEY
    aes_salt = settings.plane_api.AES_SALT

    if not aes_secret_key:
        raise ValueError("AES_SECRET_KEY environment variable is not set")

    return hashlib.pbkdf2_hmac(
        "sha256",
        aes_secret_key.encode(),
        aes_salt.encode(),
        100_000,
        dklen=32,
    )


def decrypt(encrypted_data: Dict[str, str]) -> str:
    """
    Decrypt data encrypted with AES-256-GCM (FIPS-compliant).

    Args:
        encrypted_data: Dictionary with 'iv', 'ciphertext', and 'tag' keys

    Returns:
        str: Decrypted plaintext

    Raises:
        ValueError: If decryption fails
    """
    try:
        key = derive_key()
        aesgcm = AESGCM(key)
        nonce = base64.b64decode(encrypted_data["iv"])
        ciphertext = base64.b64decode(encrypted_data["ciphertext"])
        tag = base64.b64decode(encrypted_data["tag"])
        # Reconstruct: ciphertext + tag for AESGCM.decrypt()
        encrypted = ciphertext + tag
        return aesgcm.decrypt(nonce, encrypted, None).decode()
    except Exception as e:
        raise ValueError(f"Failed to decrypt data: {e}")


def decrypt_from_string(encrypted_string: str) -> str:
    """
    Decrypt data from the format: {iv}:{ciphertext}:{tag}

    Args:
        encrypted_string: String in format "iv:ciphertext:tag" (base64 encoded)

    Returns:
        str: Decrypted plaintext

    Raises:
        ValueError: If string format is invalid or decryption fails
    """
    parts = encrypted_string.split(":")
    if len(parts) != 3:
        raise ValueError(f"Invalid encrypted string format. Expected 'iv:ciphertext:tag', got {len(parts)} parts")

    encrypted_data = {
        "iv": parts[0],
        "ciphertext": parts[1],
        "tag": parts[2],
    }

    return decrypt(encrypted_data)
