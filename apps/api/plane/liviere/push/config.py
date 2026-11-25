# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# VAPID keys of web push (RFC 8292), read from the environment – never from the repository:
#   LIVIERE_VAPID_PUBLIC_KEY   base64url of the uncompressed P-256 public point (65 bytes, starts with 0x04)
#   LIVIERE_VAPID_PRIVATE_KEY  base64url of the 32-byte private scalar
#   LIVIERE_VAPID_SUBJECT      contact for push services, "mailto:…" or "https://…"
# Without all three (or with a pair that does not match) push is unavailable and nothing is sent.
#   LIVIERE_PUSH_COALESCE_SECONDS  window collecting new work items of a project into one notification
#                                  (default 15; 0 = one notification per work item; see plane/liviere/push/notify.py)

# Python imports
import base64
import os
from dataclasses import dataclass

# Third party imports
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec


@dataclass(frozen=True)
class VapidConfig:
    public_key: str
    private_key: ec.EllipticCurvePrivateKey
    subject: str


def b64url_decode(value):
    value = value.strip()
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def b64url_encode(data):
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def public_key_bytes(private_key):
    return private_key.public_key().public_bytes(
        serialization.Encoding.X962, serialization.PublicFormat.UncompressedPoint
    )


def vapid_config():
    """The VAPID configuration, or None when push is not configured (or misconfigured)."""
    public = os.environ.get("LIVIERE_VAPID_PUBLIC_KEY", "").strip()
    private = os.environ.get("LIVIERE_VAPID_PRIVATE_KEY", "").strip()
    subject = os.environ.get("LIVIERE_VAPID_SUBJECT", "").strip()
    if not (public and private and subject):
        return None
    if not subject.startswith(("mailto:", "https://")):
        return None
    try:
        raw = b64url_decode(private)
        if len(raw) != 32:
            return None
        private_key = ec.derive_private_key(int.from_bytes(raw, "big"), ec.SECP256R1())
        if public_key_bytes(private_key) != b64url_decode(public):
            return None
    except (ValueError, TypeError):
        return None
    return VapidConfig(
        public_key=b64url_encode(public_key_bytes(private_key)), private_key=private_key, subject=subject
    )


DEFAULT_COALESCE_SECONDS = 15
MAX_COALESCE_SECONDS = 3600


def coalesce_seconds():
    """The coalescing window in seconds; a missing, malformed or negative value gives the default."""
    value = os.environ.get("LIVIERE_PUSH_COALESCE_SECONDS", "").strip()
    try:
        seconds = int(value)
    except ValueError:
        return DEFAULT_COALESCE_SECONDS
    if seconds < 0:
        return DEFAULT_COALESCE_SECONDS
    return min(seconds, MAX_COALESCE_SECONDS)


def push_available():
    return vapid_config() is not None
