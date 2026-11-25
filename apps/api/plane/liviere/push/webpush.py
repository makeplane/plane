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
import re
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
# Real endpoints are a few hundred characters; the column is unique, so keep it bounded
MAX_ENDPOINT_LENGTH = 2048
# Push services accept about 4 KB of payload; titles and bodies are cut well below that
MAX_TITLE_LENGTH = 150
MAX_BODY_LENGTH = 500
HOST_PATTERN = re.compile(r"^[a-z0-9.-]+$")
B64URL_PATTERN = re.compile(r"^[A-Za-z0-9_-]+$")


class InvalidSubscription(ValueError):
    pass


def push_origin(endpoint):
    """`https://host` of an allowed push service endpoint; raises InvalidSubscription otherwise."""
    if not isinstance(endpoint, str) or not endpoint.isascii() or len(endpoint) > MAX_ENDPOINT_LENGTH:
        raise InvalidSubscription("endpoint must be an ASCII URL of at most 2048 characters")
    try:
        parts = urlsplit(endpoint)
        port = parts.port
    except ValueError:
        raise InvalidSubscription("endpoint is not a URL")
    host = (parts.hostname or "").rstrip(".").lower()
    if (
        parts.scheme != "https"
        or parts.username is not None
        or parts.password is not None
        or port not in (None, 443)
        or not HOST_PATTERN.match(host)
    ):
        raise InvalidSubscription("endpoint must be an https URL of a push service")
    if host not in ALLOWED_PUSH_HOSTS and not host.endswith(ALLOWED_PUSH_HOST_SUFFIXES):
        raise InvalidSubscription("endpoint is not a known push service")
    return f"https://{host}"


def validate_endpoint(endpoint):
    """Raises InvalidSubscription unless the endpoint is an https URL of an allowed push service."""
    push_origin(endpoint)
    return endpoint


def strict_b64url_decode(value):
    if not isinstance(value, str) or not B64URL_PATTERN.match(value):
        raise InvalidSubscription("keys must be base64url")
    return b64url_decode(value)


def validate_keys(p256dh, auth):
    receiver = strict_b64url_decode(p256dh)
    secret = strict_b64url_decode(auth)
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
    claims = {
        # Normalized origin of the push service: no port, no user info
        "aud": push_origin(endpoint),
        "exp": int(now or time.time()) + JWT_LIFETIME_SECONDS,
        "sub": config.subject,
    }
    token = jwt.encode(claims, config.private_key, algorithm="ES256")
    return {"Authorization": f"vapid t={token}, k={b64url_encode(public_key_bytes(config.private_key))}"}


def truncate(text, limit):
    text = text or ""
    return text if len(text) <= limit else f"{text[: limit - 1]}…"


def payload_bytes(message):
    message = dict(message)
    for key, limit in (("title", MAX_TITLE_LENGTH), ("body", MAX_BODY_LENGTH)):
        if key in message:
            message[key] = truncate(message[key], limit)
    return json.dumps(message, ensure_ascii=False).encode()


def send(subscription, message, config):
    """POSTs `message` (a dict, sent as JSON) to the subscription; returns the HTTP status code."""
    validate_endpoint(subscription.endpoint)
    body = encrypt_payload(payload_bytes(message), subscription.p256dh, subscription.auth)
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
