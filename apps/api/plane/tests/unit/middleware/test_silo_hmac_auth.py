# Copyright (c) 2026-present Zebaria.
# SPDX-License-Identifier: AGPL-3.0-only
"""Unit tests for SiloHMACAuthentication.

Covers the security boundary between silo and Django:
  - Missing headers → not authenticated (None, falls through)
  - Bad timestamp → AuthenticationFailed
  - Stale timestamp (skew exceeded) → AuthenticationFailed
  - Forged signature → AuthenticationFailed
  - Method mismatch (signature for GET, request was POST) → fail
  - Path mismatch → fail
  - Body hash mismatch → fail
  - Valid signature → returns SILO_PRINCIPAL
"""

from __future__ import annotations

import hashlib
import hmac
import time
from unittest.mock import MagicMock

import pytest
from rest_framework.exceptions import AuthenticationFailed

from plane.connections.auth import (
    SILO_PRINCIPAL,
    IsSiloAuthenticated,
    SiloHMACAuthentication,
)


SECRET = "unit-test-secret-do-not-use-in-prod"


def _sign(method: str, path: str, body: bytes, ts: str | None = None, secret: str = SECRET) -> tuple[str, str]:
    """Return (timestamp, signature) for a (method, path, body) tuple."""
    ts = ts or str(int(time.time()))
    body_hash = hashlib.sha256(body or b"").hexdigest()
    msg = f"{ts}.{method.upper()}.{path}.{body_hash}".encode()
    sig = hmac.new(secret.encode(), msg, hashlib.sha256).hexdigest()
    return ts, sig


def _build_request(method: str, path: str, body: bytes, ts: str | None = None, sig: str | None = None) -> MagicMock:
    """Mock a DRF request with .headers, .method, .path, .body."""
    req = MagicMock()
    req.method = method
    req.path = path
    req.body = body
    headers = {}
    if ts is not None:
        headers["X-Silo-Timestamp"] = ts
    if sig is not None:
        headers["X-Silo-Signature"] = sig
    req.headers.get = lambda k, default=None: headers.get(k, default)
    return req


@pytest.mark.unit
class TestSiloHMACAuthentication:
    """Spec for the silo→Django HMAC authentication class."""

    @pytest.fixture(autouse=True)
    def _override_secret(self, settings):
        settings.SILO_HMAC_SECRET_KEY = SECRET

    def setup_method(self) -> None:
        self.auth = SiloHMACAuthentication()

    def test_missing_headers_returns_none(self) -> None:
        """No HMAC headers → falls through to next auth class."""
        req = _build_request("POST", "/api/v1/silo/ping/", b"")
        assert self.auth.authenticate(req) is None

    def test_only_signature_no_timestamp_returns_none(self) -> None:
        req = _build_request("POST", "/api/v1/silo/ping/", b"", sig="deadbeef")
        assert self.auth.authenticate(req) is None

    def test_only_timestamp_no_signature_returns_none(self) -> None:
        req = _build_request("POST", "/api/v1/silo/ping/", b"", ts=str(int(time.time())))
        assert self.auth.authenticate(req) is None

    def test_non_numeric_timestamp_fails(self) -> None:
        req = _build_request("POST", "/api/v1/silo/ping/", b"", ts="not-a-number", sig="deadbeef")
        with pytest.raises(AuthenticationFailed):
            self.auth.authenticate(req)

    def test_stale_timestamp_fails(self) -> None:
        """Timestamp older than 5 minutes is rejected."""
        stale_ts = str(int(time.time()) - 600)
        ts, sig = _sign("POST", "/api/v1/silo/ping/", b"", ts=stale_ts)
        req = _build_request("POST", "/api/v1/silo/ping/", b"", ts=ts, sig=sig)
        with pytest.raises(AuthenticationFailed) as exc_info:
            self.auth.authenticate(req)
        assert "skew" in str(exc_info.value).lower()

    def test_future_timestamp_fails(self) -> None:
        """Timestamps too far in the future also fail."""
        future_ts = str(int(time.time()) + 600)
        ts, sig = _sign("POST", "/api/v1/silo/ping/", b"", ts=future_ts)
        req = _build_request("POST", "/api/v1/silo/ping/", b"", ts=ts, sig=sig)
        with pytest.raises(AuthenticationFailed):
            self.auth.authenticate(req)

    def test_forged_signature_fails(self) -> None:
        ts = str(int(time.time()))
        req = _build_request("POST", "/api/v1/silo/ping/", b"", ts=ts, sig="deadbeef" * 8)
        with pytest.raises(AuthenticationFailed) as exc_info:
            self.auth.authenticate(req)
        assert "signature" in str(exc_info.value).lower()

    def test_signature_bound_to_method(self) -> None:
        """Signature for GET cannot be reused on POST."""
        ts, sig = _sign("GET", "/api/v1/silo/ping/", b"")
        req = _build_request("POST", "/api/v1/silo/ping/", b"", ts=ts, sig=sig)
        with pytest.raises(AuthenticationFailed):
            self.auth.authenticate(req)

    def test_signature_bound_to_path(self) -> None:
        """Signature for /silo/ping cannot be reused on /silo/install."""
        ts, sig = _sign("POST", "/api/v1/silo/ping/", b"")
        req = _build_request("POST", "/api/v1/silo/slack/install/", b"", ts=ts, sig=sig)
        with pytest.raises(AuthenticationFailed):
            self.auth.authenticate(req)

    def test_signature_bound_to_body_hash(self) -> None:
        """Tampering with the body breaks the signature."""
        original_body = b'{"team_id":"T1"}'
        tampered_body = b'{"team_id":"T2"}'
        ts, sig = _sign("POST", "/api/v1/silo/foo/", original_body)
        req = _build_request("POST", "/api/v1/silo/foo/", tampered_body, ts=ts, sig=sig)
        with pytest.raises(AuthenticationFailed):
            self.auth.authenticate(req)

    def test_valid_signature_returns_silo_principal(self) -> None:
        ts, sig = _sign("POST", "/api/v1/silo/ping/", b"")
        req = _build_request("POST", "/api/v1/silo/ping/", b"", ts=ts, sig=sig)
        result = self.auth.authenticate(req)
        assert result is not None
        principal, token = result
        assert principal is SILO_PRINCIPAL
        assert token is None

    def test_valid_signature_with_body(self) -> None:
        body = b'{"workspace_slug":"wz","project_id":"abc"}'
        ts, sig = _sign("POST", "/api/v1/silo/work-items/", body)
        req = _build_request("POST", "/api/v1/silo/work-items/", body, ts=ts, sig=sig)
        result = self.auth.authenticate(req)
        assert result is not None
        principal, _ = result
        assert principal is SILO_PRINCIPAL

    def test_silo_principal_is_anonymous(self) -> None:
        """BaseModel.save reads is_anonymous via crum; silo principal must
        report True so created_by stays None for silo writes (the view
        bypasses BaseModel.save with .update() to set created_by explicitly)."""
        assert SILO_PRINCIPAL.is_anonymous is True
        assert SILO_PRINCIPAL.is_authenticated is False
        assert SILO_PRINCIPAL.is_silo is True


@pytest.mark.unit
class TestSiloHMACAuthenticationConfig:
    """SILO_HMAC_SECRET_KEY missing → fail closed."""

    def test_missing_secret_setting_fails_closed(self, settings) -> None:
        settings.SILO_HMAC_SECRET_KEY = ""
        ts = str(int(time.time()))
        # Even a "valid" signature can't pass without a configured secret.
        req = _build_request("POST", "/api/v1/silo/ping/", b"", ts=ts, sig="deadbeef" * 8)
        auth = SiloHMACAuthentication()
        with pytest.raises(AuthenticationFailed) as exc_info:
            auth.authenticate(req)
        assert "configured" in str(exc_info.value).lower()


@pytest.mark.unit
class TestIsSiloAuthenticatedPermission:
    """The companion permission class — accepts only the silo sentinel."""

    def setup_method(self) -> None:
        self.perm = IsSiloAuthenticated()

    def test_silo_principal_allowed(self) -> None:
        req = MagicMock()
        req.user = SILO_PRINCIPAL
        assert self.perm.has_permission(req, view=None) is True

    def test_anonymous_user_denied(self) -> None:
        from django.contrib.auth.models import AnonymousUser

        req = MagicMock()
        req.user = AnonymousUser()
        assert self.perm.has_permission(req, view=None) is False

    def test_real_user_denied(self) -> None:
        """A real Plane user (with API key auth) must NOT pass IsSiloAuthenticated.
        Silo endpoints are HMAC-only by design."""
        fake_user = MagicMock()
        fake_user.is_silo = False
        req = MagicMock()
        req.user = fake_user
        assert self.perm.has_permission(req, view=None) is False