"""HMAC authentication for the silo↔Django channel.

Silo signs every request with a shared secret (`SILO_HMAC_SECRET_KEY`).
Django verifies the signature here. We deliberately do *not* tie the
request to a Plane user — silo runs as a service. Endpoints that need
this auth pair it with `IsSiloAuthenticated` instead of
`IsAuthenticated` and skip `allow_permission`.

Header contract (silo → Django):
  X-Silo-Timestamp: unix seconds, integer
  X-Silo-Signature: hex(hmac_sha256(secret, f"{timestamp}.{method}.{path}.{body_sha256}"))

`body_sha256` is the hex sha256 of the raw request body (empty string
hash if no body). Timestamp skew tolerance: 5 minutes.
"""

from __future__ import annotations

import hashlib
import hmac
import time

from django.conf import settings
from rest_framework import authentication, permissions
from rest_framework.exceptions import AuthenticationFailed


_MAX_SKEW_SECONDS = 300


class _SiloIdentity:
    """Sentinel principal returned by SiloHMACAuthentication.

    DRF's IsAuthenticated only checks user.is_authenticated. We don't
    use it — IsSiloAuthenticated checks for this sentinel directly.
    """

    is_authenticated = False  # explicitly not a Plane user
    is_anonymous = True  # BaseModel.save() reads this via crum
    is_silo = True
    pk = None
    id = None

    def __str__(self) -> str:  # pragma: no cover - cosmetic
        return "silo-service"


SILO_PRINCIPAL = _SiloIdentity()


def _expected_signature(secret: str, timestamp: str, method: str, path: str, body: bytes) -> str:
    body_hash = hashlib.sha256(body or b"").hexdigest()
    msg = f"{timestamp}.{method.upper()}.{path}.{body_hash}".encode("utf-8")
    return hmac.new(secret.encode("utf-8"), msg, hashlib.sha256).hexdigest()


class SiloHMACAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        sig = request.headers.get("X-Silo-Signature")
        ts = request.headers.get("X-Silo-Timestamp")
        if not sig or not ts:
            return None

        secret = getattr(settings, "SILO_HMAC_SECRET_KEY", "") or ""
        if not secret:
            raise AuthenticationFailed("Silo HMAC not configured")

        try:
            ts_int = int(ts)
        except ValueError:
            raise AuthenticationFailed("Invalid X-Silo-Timestamp")
        if abs(int(time.time()) - ts_int) > _MAX_SKEW_SECONDS:
            raise AuthenticationFailed("Silo timestamp skew too large")

        expected = _expected_signature(
            secret, ts, request.method or "GET", request.path, request.body or b""
        )
        if not hmac.compare_digest(expected, sig):
            raise AuthenticationFailed("Invalid silo signature")

        return (SILO_PRINCIPAL, None)


class IsSiloAuthenticated(permissions.BasePermission):
    def has_permission(self, request, view):
        return getattr(request.user, "is_silo", False) is True