# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Sends one Web Push message: payload encrypted with aes128gcm (RFC 8291, http_ece) and a VAPID JWT
# (RFC 8292, PyJWT ES256). The subscription endpoint comes from the browser, so it must be an https URL of a
# known push service (ALLOWED_PUSH_HOSTS) and the request goes through pinned_fetch (resolved IPs are checked,
# the connection is pinned to them, no redirects) – the same SSRF protection as webhooks.

# Python imports
import json
import os
import time
from urllib.parse import urlsplit

# Third party imports
import http_ece
import jwt
from cryptography.hazmat.primitives.asymmetric import ec

# Module imports
from plane.liviere.push.config import b64url_decode, b64url_encode, public_key_bytes
from plane.utils.url_security import pinned_fetch

# Push services of Firefox, Chrome/Edge (FCM), Edge/Windows (WNS) and Safari (APNs)
ALLOWED_PUSH_HOSTS = ("updates.push.services.mozilla.com", "fcm.googleapis.com")
ALLOWED_PUSH_HOST_SUFFIXES = (".notify.windows.com", ".push.apple.com")

TTL_SECONDS = 24 * 60 * 60
JWT_LIFETIME_SECONDS = 12 * 60 * 60
TIMEOUT_SECONDS = 10


class InvalidSubscription(ValueError):
    pass


def validate_endpoint(endpoint):
    """Raises InvalidSubscription unless the endpoint is an https URL of an allowed push service."""
    try:
        parts = urlsplit(endpoint or "")
    except ValueError:
        raise InvalidSubscription("endpoint is not a URL")
    host = (parts.hostname or "").rstrip(".").lower()
    if parts.scheme != "https" or parts.username or parts.password or parts.port not in (None, 443):
        raise InvalidSubscription("endpoint must be an https URL of a push service")
    if host not in ALLOWED_PUSH_HOSTS and not host.endswith(ALLOWED_PUSH_HOST_SUFFIXES):
        raise InvalidSubscription("endpoint is not a known push service")
    return endpoint


def validate_keys(p256dh, auth):
    try:
        receiver = b64url_decode(p256dh or "")
        secret = b64url_decode(auth or "")
    except (ValueError, TypeError):
        raise InvalidSubscription("keys must be base64url")
    if len(receiver) != 65 or receiver[0] != 4 or len(secret) != 16:
        raise InvalidSubscription("keys are not a P-256 key and a 16-byte secret")
    try:
        ec.EllipticCurvePublicKey.from_encoded_point(ec.SECP256R1(), receiver)
    except ValueError:
        raise InvalidSubscription("p256dh is not a P-256 public key")


def encrypt_payload(payload, p256dh, auth):
    """aes128gcm body for one subscription; a fresh server key and salt every time."""
    server_key = ec.generate_private_key(ec.SECP256R1())
    return http_ece.encrypt(
        payload,
        salt=os.urandom(16),
        private_key=server_key,
        dh=b64url_decode(p256dh),
        auth_secret=b64url_decode(auth),
        version="aes128gcm",
    )


def vapid_headers(endpoint, config, now=None):
    parts = urlsplit(endpoint)
    claims = {
        "aud": f"{parts.scheme}://{parts.netloc}",
        "exp": int(now or time.time()) + JWT_LIFETIME_SECONDS,
        "sub": config.subject,
    }
    token = jwt.encode(claims, config.private_key, algorithm="ES256")
    return {"Authorization": f"vapid t={token}, k={b64url_encode(public_key_bytes(config.private_key))}"}


def send(subscription, message, config):
    """POSTs `message` (a dict, sent as JSON) to the subscription; returns the HTTP status code."""
    validate_endpoint(subscription.endpoint)
    body = encrypt_payload(json.dumps(message).encode(), subscription.p256dh, subscription.auth)
    headers = {
        **vapid_headers(subscription.endpoint, config),
        "Content-Encoding": "aes128gcm",
        "Content-Type": "application/octet-stream",
        "TTL": str(TTL_SECONDS),
        "Urgency": "normal",
    }
    response = pinned_fetch("POST", subscription.endpoint, headers=headers, data=body, timeout=TIMEOUT_SECONDS)
    response.close()
    return response.status_code
