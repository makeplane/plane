"""The header-auth token check and the Plane URL it calls.

Both were deployment hazards: a missing URL setting silently sent every user's
token to Plane Cloud, and checking the token on every request spent the
token's whole API rate limit on authentication, then reported "invalid token".
"""

from __future__ import annotations

import asyncio
import subprocess
import sys

import httpx
import pytest

from plane_mcp.auth import plane_header_auth_provider as header_auth
from plane_mcp.auth.plane_header_auth_provider import PlaneHeaderAuthProvider
from plane_mcp.client import MissingBaseURLError, plane_base_url


@pytest.fixture
def no_plane_url(monkeypatch):
    monkeypatch.delenv("PLANE_BASE_URL", raising=False)
    monkeypatch.delenv("PLANE_INTERNAL_BASE_URL", raising=False)


def test_no_url_is_an_error_not_plane_cloud(no_plane_url):
    with pytest.raises(MissingBaseURLError):
        plane_base_url()


def test_internal_url_wins_and_is_normalised(monkeypatch):
    monkeypatch.setenv("PLANE_BASE_URL", "https://public.example")
    monkeypatch.setenv("PLANE_INTERNAL_BASE_URL", "http://gateway/")
    assert plane_base_url() == "http://gateway"
    monkeypatch.setenv("PLANE_INTERNAL_BASE_URL", "")
    assert plane_base_url() == "https://public.example"


def test_missing_url_is_not_swallowed_as_no_request(no_plane_url):
    """verify_token treats RuntimeError as "no HTTP request" and returns None,
    which would hide the misconfiguration behind a 401."""
    assert not issubclass(MissingBaseURLError, RuntimeError)


def test_entrypoint_refuses_to_start_without_a_url(tmp_path):
    env = {"PATH": "/usr/bin:/bin", "HOME": str(tmp_path)}
    proc = subprocess.run(
        [sys.executable, "-c", "import nexus_serve"],
        cwd=str(__import__("pathlib").Path(__file__).resolve().parents[1]),
        env=env,
        capture_output=True,
        text=True,
        timeout=60,
    )
    assert proc.returncode != 0
    assert "PLANE_INTERNAL_BASE_URL" in proc.stderr


class _FakePlane:
    """Stands in for httpx.AsyncClient and answers /users/me/ with a fixed status."""

    def __init__(self, status: int):
        self.status = status
        self.calls: list[str] = []

    def __call__(self, *args, **kwargs):
        return self

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False

    async def get(self, url, headers):
        self.calls.append(url)
        return httpx.Response(self.status)


@pytest.fixture
def plane(monkeypatch):
    monkeypatch.setenv("PLANE_INTERNAL_BASE_URL", "http://gateway")

    def make(status: int) -> _FakePlane:
        fake = _FakePlane(status)
        monkeypatch.setattr(header_auth.httpx, "AsyncClient", fake)
        return fake

    return make


def _validate(provider, token="tok"):
    return asyncio.run(provider._validate_api_key(token))


def test_a_valid_token_is_checked_once_per_ttl(plane, monkeypatch):
    fake = plane(200)
    provider = PlaneHeaderAuthProvider()
    assert all(_validate(provider) for _ in range(5))
    assert fake.calls == ["http://gateway/api/v1/users/me/"]

    now = header_auth.time.monotonic()
    monkeypatch.setattr(header_auth.time, "monotonic", lambda: now + header_auth.VALIDATION_TTL_SECONDS + 1)
    assert _validate(provider)
    assert len(fake.calls) == 2


def test_an_invalid_token_is_never_cached(plane):
    fake = plane(401)
    provider = PlaneHeaderAuthProvider()
    assert not _validate(provider)
    assert not _validate(provider)
    assert len(fake.calls) == 2


def test_rate_limited_means_valid_not_invalid(plane):
    """Plane throttles only after authenticating, so a 429 proves the token."""
    plane(429)
    assert _validate(PlaneHeaderAuthProvider())


def test_cache_is_per_token_and_holds_no_token(plane):
    fake = plane(200)
    provider = PlaneHeaderAuthProvider()
    _validate(provider, "tok-a")
    fake.status = 401
    assert not _validate(provider, "tok-b")
    assert all("tok" not in key for key in provider._valid_until)
