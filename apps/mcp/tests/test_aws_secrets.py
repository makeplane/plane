"""Unit tests for plane_mcp.aws_secrets and the Redis token-store resolver.

These tests run without a live Redis or AWS environment. boto3 is patched to
return canned responses via ``botocore.stub.Stubber``; redis-py is patched at
the module level so the synchronous PING never hits a real socket.
"""

from __future__ import annotations

import json
import logging
import time
from typing import Any

import boto3
import pytest
from botocore.stub import Stubber
from key_value.aio.stores.memory import MemoryStore
from key_value.aio.stores.redis import RedisStore

from plane_mcp import aws_secrets, storage
from plane_mcp.aws_secrets import ElastiCacheCredentialProvider, get_secret
from plane_mcp.storage import build_token_store

ARN = "arn:aws:secretsmanager:us-east-1:123456789012:secret:test"
REGION = "us-east-1"

# Dummy AWS credentials so boto3's credential resolver is short-circuited and
# never tries to hit the IMDS endpoint when AWS_CONTAINER_CREDENTIALS_FULL_URI
# is set by a test fixture. These values are inert — boto3 calls are stubbed.
_FAKE_AWS_ENV = {
    "AWS_ACCESS_KEY_ID": "test",
    "AWS_SECRET_ACCESS_KEY": "test",
    "AWS_SESSION_TOKEN": "test",
}


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture(autouse=True)
def _reset_state(monkeypatch):
    """Per-test isolation: clear the secret cache and unset Redis/AWS env vars."""
    aws_secrets._SECRET_CACHE.clear()

    for k in (
        "REDIS_URL",
        "REDIS_HOST",
        "REDIS_PORT",
        "REDIS_PASSWORD",
        "REDIS_SSL",
        "ELASTICACHE_SECRET_ARN",
        "REDIS_AUTH_TOKEN_KEY",
        "AWS_REGION",
        "AWS_ROLE_ARN",
        "AWS_CONTAINER_CREDENTIALS_FULL_URI",
        "AWS_SECRET_CACHE_TTL",
    ):
        monkeypatch.delenv(k, raising=False)

    # Inject inert AWS creds so boto3 never reaches out to IMDS even when a
    # test sets AWS_CONTAINER_CREDENTIALS_FULL_URI to a fake endpoint.
    for k, v in _FAKE_AWS_ENV.items():
        monkeypatch.setenv(k, v)

    yield
    aws_secrets._SECRET_CACHE.clear()


def _stub_secrets(monkeypatch, payloads: list[dict[str, Any]]) -> Stubber:
    """Return a Stubber-backed Secrets Manager client and patch boto3.client.

    Each entry in ``payloads`` becomes one queued ``get_secret_value``
    response. The boto3 client is created inside the patch so the dummy AWS
    credentials in the fixture are used; the real IMDS endpoint is never
    contacted.
    """
    client = boto3.client("secretsmanager", region_name=REGION)
    stubber = Stubber(client)
    for payload in payloads:
        stubber.add_response(
            "get_secret_value",
            {"SecretString": json.dumps(payload)},
            expected_params={"SecretId": ARN},
        )
    stubber.activate()

    # Patch the boto3 reference that aws_secrets imports lazily.
    def _client_factory(*_a, **_k):
        return client

    monkeypatch.setattr("boto3.client", _client_factory)
    return stubber


def _forbid_boto3_secretsmanager(monkeypatch) -> None:
    """Fail the test if anything calls boto3.client('secretsmanager', ...)."""

    def _explode(service_name=None, *_a, **_k):
        if service_name == "secretsmanager":
            raise AssertionError("Unexpected boto3.client('secretsmanager', ...) call")
        return boto3.session.Session().client(service_name, *_a, **_k)

    monkeypatch.setattr("boto3.client", _explode)


@pytest.fixture
def no_ping(monkeypatch):
    """Skip the synchronous Redis PING so store-resolution tests need no Redis."""
    monkeypatch.setattr(storage, "_ping_redis", lambda *a, **kw: None)
    monkeypatch.setattr(storage, "_ping_redis_url", lambda *a, **kw: None)


@pytest.fixture
def capture_log(caplog):
    """Capture records from a fastmcp-namespaced logger.

    The ``fastmcp`` logger sets ``propagate=False``, so caplog's root handler
    never sees these records — attach it directly to the target logger.
    """

    def _capture(logger_name: str):
        target = logging.getLogger(logger_name)
        target.addHandler(caplog.handler)
        target.setLevel(logging.WARNING)
        return caplog

    return _capture


# ---------------------------------------------------------------------------
# get_secret — caching & race handling
# ---------------------------------------------------------------------------


def test_get_secret_caches_within_ttl(monkeypatch):
    stubber = _stub_secrets(monkeypatch, [{"authToken": "p1"}])
    assert get_secret(ARN, REGION) == {"authToken": "p1"}
    assert get_secret(ARN, REGION) == {"authToken": "p1"}
    stubber.assert_no_pending_responses()


def test_get_secret_refreshes_after_ttl(monkeypatch):
    stubber = _stub_secrets(monkeypatch, [{"authToken": "p1"}, {"authToken": "p2"}])
    monkeypatch.setenv("AWS_SECRET_CACHE_TTL", "0")
    assert get_secret(ARN, REGION)["authToken"] == "p1"
    assert get_secret(ARN, REGION)["authToken"] == "p2"
    stubber.assert_no_pending_responses()


def test_get_secret_force_refresh(monkeypatch):
    stubber = _stub_secrets(monkeypatch, [{"authToken": "p1"}, {"authToken": "p2"}])
    assert get_secret(ARN, REGION)["authToken"] == "p1"
    assert get_secret(ARN, REGION, force_refresh=True)["authToken"] == "p2"
    stubber.assert_no_pending_responses()


def test_get_secret_returns_copy(monkeypatch):
    _stub_secrets(monkeypatch, [{"authToken": "p1"}])
    first = get_secret(ARN, REGION)
    first["authToken"] = "mutated"
    second = get_secret(ARN, REGION)
    assert second["authToken"] == "p1"


def test_get_ttl_seconds_valid(monkeypatch):
    monkeypatch.setenv("AWS_SECRET_CACHE_TTL", "60")
    assert aws_secrets._get_ttl_seconds() == 60


def test_get_ttl_seconds_unset(monkeypatch):
    monkeypatch.delenv("AWS_SECRET_CACHE_TTL", raising=False)
    assert aws_secrets._get_ttl_seconds() == 300


def test_get_ttl_seconds_invalid_falls_back(monkeypatch, capture_log):
    caplog = capture_log("fastmcp.plane_mcp.aws_secrets")
    monkeypatch.setenv("AWS_SECRET_CACHE_TTL", "not-a-number")
    assert aws_secrets._get_ttl_seconds() == 300
    assert any("not an integer" in rec.message for rec in caplog.records)


def test_get_secret_concurrent_race_uses_existing_fresh_entry(monkeypatch):
    """If another thread populates the cache while we're fetching, prefer the
    existing fresh entry rather than overwriting it."""
    stubber = _stub_secrets(monkeypatch, [{"authToken": "ours"}])

    # Simulate a racing thread that wrote a fresh entry after our fast-path
    # check passed but before our write-back. We do that by injecting into
    # json.loads — which runs between the boto3 call and the lock re-check.
    original_loads = aws_secrets.json.loads

    def _injecting_loads(s):
        aws_secrets._SECRET_CACHE[(ARN, REGION)] = {
            "value": {"authToken": "theirs"},
            "fetched_at": time.time(),
        }
        return original_loads(s)

    monkeypatch.setattr(aws_secrets.json, "loads", _injecting_loads)

    result = get_secret(ARN, REGION)
    assert result == {"authToken": "theirs"}
    assert aws_secrets._SECRET_CACHE[(ARN, REGION)]["value"] == {"authToken": "theirs"}
    stubber.assert_no_pending_responses()


def test_get_secret_force_refresh_overwrites_race_winner(monkeypatch):
    """``force_refresh=True`` always installs the freshly-fetched value."""
    stubber = _stub_secrets(monkeypatch, [{"authToken": "forced"}])
    original_loads = aws_secrets.json.loads

    def _injecting_loads(s):
        aws_secrets._SECRET_CACHE[(ARN, REGION)] = {
            "value": {"authToken": "stale-racer"},
            "fetched_at": time.time(),
        }
        return original_loads(s)

    monkeypatch.setattr(aws_secrets.json, "loads", _injecting_loads)

    result = get_secret(ARN, REGION, force_refresh=True)
    assert result == {"authToken": "forced"}
    assert aws_secrets._SECRET_CACHE[(ARN, REGION)]["value"] == {"authToken": "forced"}
    stubber.assert_no_pending_responses()


# ---------------------------------------------------------------------------
# ElastiCacheCredentialProvider
# ---------------------------------------------------------------------------


def test_credential_provider_returns_password(monkeypatch):
    _stub_secrets(monkeypatch, [{"authToken": "secret-pw"}])
    provider = ElastiCacheCredentialProvider(ARN, REGION, "authToken")
    assert provider.get_credentials() == ("secret-pw",)


def test_credential_provider_with_username(monkeypatch):
    _stub_secrets(monkeypatch, [{"authToken": "secret-pw"}])
    provider = ElastiCacheCredentialProvider(ARN, REGION, "authToken", username="alice")
    assert provider.get_credentials() == ("alice", "secret-pw")


def test_credential_provider_missing_key_raises(monkeypatch):
    _stub_secrets(monkeypatch, [{"otherKey": "value"}])
    provider = ElastiCacheCredentialProvider(ARN, REGION, "authToken")
    with pytest.raises(RuntimeError, match="authToken"):
        provider.get_credentials()


# ---------------------------------------------------------------------------
# _build_token_store — backend selection
# ---------------------------------------------------------------------------


def test_build_token_store_no_env_returns_memory_store():
    assert isinstance(build_token_store(), MemoryStore)


def test_build_token_store_host_port_only_returns_redis(monkeypatch, no_ping):
    monkeypatch.setenv("REDIS_HOST", "localhost")
    monkeypatch.setenv("REDIS_PORT", "6379")
    _forbid_boto3_secretsmanager(monkeypatch)
    assert isinstance(build_token_store(), RedisStore)


def test_build_token_store_url_returns_redis(monkeypatch, no_ping):
    monkeypatch.setenv("REDIS_URL", "redis://localhost:6379/0")
    _forbid_boto3_secretsmanager(monkeypatch)
    assert isinstance(build_token_store(), RedisStore)


def test_build_token_store_url_wins_over_host_port(monkeypatch, no_ping, capture_log):
    caplog = capture_log("fastmcp.plane_mcp.storage")
    monkeypatch.setenv("REDIS_URL", "redis://url-host:6390/2")
    monkeypatch.setenv("REDIS_HOST", "other-host")
    monkeypatch.setenv("REDIS_PORT", "6379")

    store = build_token_store()

    assert isinstance(store, RedisStore)
    kwargs = store._client.connection_pool.connection_kwargs
    assert kwargs["host"] == "url-host"
    assert kwargs["port"] == 6390
    assert kwargs["db"] == 2
    assert any("host/port ignored" in rec.message for rec in caplog.records)


def test_build_token_store_url_wins_over_arn(monkeypatch, no_ping, capture_log):
    caplog = capture_log("fastmcp.plane_mcp.storage")
    monkeypatch.setenv("REDIS_URL", "redis://localhost:6379/0")
    monkeypatch.setenv("ELASTICACHE_SECRET_ARN", ARN)
    monkeypatch.setenv("AWS_ROLE_ARN", "arn:aws:iam::123:role/test")
    _forbid_boto3_secretsmanager(monkeypatch)

    assert isinstance(build_token_store(), RedisStore)
    assert any("Secrets Manager ignored" in rec.message for rec in caplog.records)


def test_build_token_store_rediss_url_enables_tls(monkeypatch, no_ping):
    monkeypatch.setenv("REDIS_URL", "rediss://:pw@localhost:6379/0")
    store = build_token_store()
    assert store._client.connection_pool.connection_class.__name__ == "SSLConnection"


def test_build_token_store_url_password_env_fills_gap(monkeypatch, no_ping):
    monkeypatch.setenv("REDIS_URL", "redis://localhost:6379/0")
    monkeypatch.setenv("REDIS_PASSWORD", "env-pw")
    store = build_token_store()
    assert store._client.connection_pool.connection_kwargs["password"] == "env-pw"


def test_build_token_store_url_own_password_beats_env(monkeypatch, no_ping):
    monkeypatch.setenv("REDIS_URL", "redis://:url-pw@localhost:6379/0")
    monkeypatch.setenv("REDIS_PASSWORD", "env-pw")
    store = build_token_store()
    assert store._client.connection_pool.connection_kwargs["password"] == "url-pw"


def test_redact_url_hides_password():
    assert storage._redact_url("redis://user:pw@host:6379/0") == "redis://user:***@host:6379/0"
    assert storage._redact_url("rediss://:pw@host:6380") == "rediss://:***@host:6380"
    assert storage._redact_url("redis://host:6379/0") == "redis://host:6379/0"


def test_build_token_store_password_wins_over_arn(monkeypatch, no_ping, capture_log):
    caplog = capture_log("fastmcp.plane_mcp.storage")
    monkeypatch.setenv("REDIS_HOST", "localhost")
    monkeypatch.setenv("REDIS_PORT", "6379")
    monkeypatch.setenv("REDIS_PASSWORD", "pw")
    monkeypatch.setenv("ELASTICACHE_SECRET_ARN", ARN)
    monkeypatch.setenv("AWS_ROLE_ARN", "arn:aws:iam::123:role/test")
    _forbid_boto3_secretsmanager(monkeypatch)

    assert isinstance(build_token_store(), RedisStore)
    assert any("static password wins" in rec.message for rec in caplog.records), (
        "Expected a warning when both REDIS_PASSWORD and ELASTICACHE_SECRET_ARN are set"
    )


def test_build_token_store_password_without_host_port_raises(monkeypatch):
    monkeypatch.setenv("REDIS_PASSWORD", "pw")
    with pytest.raises(RuntimeError, match="REDIS_PASSWORD"):
        build_token_store()


def test_build_token_store_arn_without_host_port_raises(monkeypatch):
    monkeypatch.setenv("ELASTICACHE_SECRET_ARN", ARN)
    monkeypatch.setenv("AWS_ROLE_ARN", "arn:aws:iam::123:role/test")
    with pytest.raises(RuntimeError, match="ELASTICACHE_SECRET_ARN"):
        build_token_store()


def test_build_token_store_arn_without_irsa_skips_sm(monkeypatch, capture_log, no_ping):
    caplog = capture_log("fastmcp.plane_mcp.storage")
    monkeypatch.setenv("ELASTICACHE_SECRET_ARN", ARN)
    monkeypatch.setenv("REDIS_HOST", "localhost")
    monkeypatch.setenv("REDIS_PORT", "6379")
    _forbid_boto3_secretsmanager(monkeypatch)

    store = build_token_store()

    assert isinstance(store, RedisStore)
    assert any("IRSA / Pod Identity" in rec.message for rec in caplog.records)


def test_build_token_store_arn_with_aws_role_arn_activates_sm(monkeypatch, no_ping):
    monkeypatch.setenv("ELASTICACHE_SECRET_ARN", ARN)
    monkeypatch.setenv("REDIS_HOST", "localhost")
    monkeypatch.setenv("REDIS_PORT", "6379")
    monkeypatch.setenv("AWS_ROLE_ARN", "arn:aws:iam::123:role/test")
    stubber = _stub_secrets(monkeypatch, [{"authToken": "secret-pw"}])
    assert isinstance(build_token_store(), RedisStore)
    stubber.assert_no_pending_responses()


def test_build_token_store_arn_with_pod_identity_activates_sm(monkeypatch, no_ping):
    monkeypatch.setenv("ELASTICACHE_SECRET_ARN", ARN)
    monkeypatch.setenv("REDIS_HOST", "localhost")
    monkeypatch.setenv("REDIS_PORT", "6379")
    monkeypatch.setenv("AWS_CONTAINER_CREDENTIALS_FULL_URI", "http://169.254.170.23/v1/credentials")
    stubber = _stub_secrets(monkeypatch, [{"authToken": "secret-pw"}])
    assert isinstance(build_token_store(), RedisStore)
    stubber.assert_no_pending_responses()


def test_build_token_store_arn_missing_token_key_raises(monkeypatch):
    monkeypatch.setenv("ELASTICACHE_SECRET_ARN", ARN)
    monkeypatch.setenv("REDIS_HOST", "localhost")
    monkeypatch.setenv("REDIS_PORT", "6379")
    monkeypatch.setenv("AWS_ROLE_ARN", "arn:aws:iam::123:role/test")
    _stub_secrets(monkeypatch, [{"otherKey": "value"}])
    with pytest.raises(RuntimeError, match="REDIS_AUTH_TOKEN_KEY"):
        build_token_store()


def test_build_token_store_custom_token_key(monkeypatch, no_ping):
    monkeypatch.setenv("ELASTICACHE_SECRET_ARN", ARN)
    monkeypatch.setenv("REDIS_HOST", "localhost")
    monkeypatch.setenv("REDIS_PORT", "6379")
    monkeypatch.setenv("AWS_ROLE_ARN", "arn:aws:iam::123:role/test")
    monkeypatch.setenv("REDIS_AUTH_TOKEN_KEY", "token")
    _stub_secrets(monkeypatch, [{"token": "secret-pw"}])
    assert isinstance(build_token_store(), RedisStore)


# ---------------------------------------------------------------------------
# TLS on the Secrets Manager path
# ---------------------------------------------------------------------------


def _capture_async_redis_kwargs(monkeypatch) -> dict[str, Any]:
    """Patch redis.asyncio.Redis to record the kwargs the SM path builds with."""
    import redis.asyncio as aioredis

    captured: dict[str, Any] = {}

    class _FakeAsyncRedis:
        def __init__(self, **kwargs):
            captured.update(kwargs)

    monkeypatch.setattr(aioredis, "Redis", _FakeAsyncRedis)
    return captured


def test_build_token_store_secret_path_uses_tls_by_default(monkeypatch, no_ping):
    monkeypatch.setenv("ELASTICACHE_SECRET_ARN", ARN)
    monkeypatch.setenv("REDIS_HOST", "localhost")
    monkeypatch.setenv("REDIS_PORT", "6379")
    monkeypatch.setenv("AWS_ROLE_ARN", "arn:aws:iam::123:role/test")
    _stub_secrets(monkeypatch, [{"authToken": "secret-pw"}])
    captured = _capture_async_redis_kwargs(monkeypatch)

    build_token_store()
    assert captured["ssl"] is True


def test_build_token_store_secret_path_ssl_can_be_disabled(monkeypatch, no_ping):
    monkeypatch.setenv("ELASTICACHE_SECRET_ARN", ARN)
    monkeypatch.setenv("REDIS_HOST", "localhost")
    monkeypatch.setenv("REDIS_PORT", "6379")
    monkeypatch.setenv("AWS_ROLE_ARN", "arn:aws:iam::123:role/test")
    monkeypatch.setenv("REDIS_SSL", "false")
    _stub_secrets(monkeypatch, [{"authToken": "secret-pw"}])
    captured = _capture_async_redis_kwargs(monkeypatch)

    build_token_store()
    assert captured["ssl"] is False


@pytest.mark.parametrize(
    "value,default,expected",
    [
        # Unset: caller's default wins.
        (None, True, True),
        (None, False, False),
        # Truthy values override default=False.
        ("true", False, True),
        ("True", False, True),
        ("1", False, True),
        ("yes", False, True),
        ("on", False, True),
        # Falsy values override default=True.
        ("false", True, False),
        ("0", True, False),
        ("no", True, False),
        ("", True, False),
    ],
)
def test_redis_ssl_enabled(monkeypatch, value, default, expected):
    if value is None:
        monkeypatch.delenv("REDIS_SSL", raising=False)
    else:
        monkeypatch.setenv("REDIS_SSL", value)
    assert storage._redis_ssl_enabled(default=default) is expected


def test_password_path_honors_redis_ssl_true(monkeypatch, no_ping):
    """REDIS_PASSWORD + REDIS_SSL=true must produce an SSL-enabled connection."""
    monkeypatch.setenv("REDIS_HOST", "localhost")
    monkeypatch.setenv("REDIS_PORT", "6379")
    monkeypatch.setenv("REDIS_PASSWORD", "pw")
    monkeypatch.setenv("REDIS_SSL", "true")
    _forbid_boto3_secretsmanager(monkeypatch)

    captured: list[dict[str, Any]] = []
    monkeypatch.setattr(storage, "_ping_redis", lambda *a, **kw: captured.append(kw))

    build_token_store()
    assert captured and captured[0]["ssl"] is True


# ---------------------------------------------------------------------------
# _ping_redis — eager reachability check
# ---------------------------------------------------------------------------


def _patch_sync_redis(monkeypatch, *, ping_result=None, ping_exc: Exception | None = None):
    """Replace ``redis.Redis`` with a fake whose ``ping`` is scripted.

    Returns the list that will receive constructor kwargs for assertions.
    """
    import redis

    constructor_calls: list[dict[str, Any]] = []

    class _FakeSyncRedis:
        def __init__(self, **kwargs):
            constructor_calls.append(kwargs)

        def ping(self):
            if ping_exc is not None:
                raise ping_exc
            return ping_result

        def close(self):
            pass

    monkeypatch.setattr(redis, "Redis", _FakeSyncRedis)
    return constructor_calls


def test_ping_redis_succeeds(monkeypatch):
    _patch_sync_redis(monkeypatch, ping_result=True)
    storage._ping_redis("localhost", 6379)  # should not raise


def test_ping_redis_raises_on_failure(monkeypatch):
    _patch_sync_redis(monkeypatch, ping_exc=OSError("connection refused"))
    with pytest.raises(RuntimeError, match="Redis connection failed during startup PING"):
        storage._ping_redis("localhost", 6379)


def test_ping_redis_passes_through_credentials_and_ssl(monkeypatch):
    calls = _patch_sync_redis(monkeypatch, ping_result=True)
    storage._ping_redis("redis.example.com", 6380, password="pw", ssl=True)
    assert calls[0]["host"] == "redis.example.com"
    assert calls[0]["port"] == 6380
    assert calls[0]["password"] == "pw"
    assert calls[0]["ssl"] is True


# ---------------------------------------------------------------------------
# TLS on the host/port paths: REDIS_SSL must reach the store, not just the PING
# ---------------------------------------------------------------------------


def _connection_class(store: RedisStore) -> str:
    return store._client.connection_pool.connection_class.__name__


def test_build_token_store_password_path_ssl_applies_to_store(monkeypatch, no_ping):
    monkeypatch.setenv("REDIS_HOST", "localhost")
    monkeypatch.setenv("REDIS_PORT", "6380")
    monkeypatch.setenv("REDIS_PASSWORD", "pw")
    monkeypatch.setenv("REDIS_SSL", "true")
    store = build_token_store()
    assert _connection_class(store) == "SSLConnection"
    assert store._client.connection_pool.connection_kwargs["password"] == "pw"


def test_build_token_store_password_path_defaults_plaintext(monkeypatch, no_ping):
    monkeypatch.setenv("REDIS_HOST", "localhost")
    monkeypatch.setenv("REDIS_PORT", "6379")
    monkeypatch.setenv("REDIS_PASSWORD", "pw")
    assert _connection_class(build_token_store()) == "Connection"


def test_build_token_store_plain_path_ssl_applies_to_store(monkeypatch, no_ping):
    monkeypatch.setenv("REDIS_HOST", "localhost")
    monkeypatch.setenv("REDIS_PORT", "6380")
    monkeypatch.setenv("REDIS_SSL", "true")
    assert _connection_class(build_token_store()) == "SSLConnection"


def test_build_token_store_ping_and_store_agree_on_ssl(monkeypatch):
    """The startup PING and the store must use the same transport."""
    pinged: dict[str, Any] = {}
    monkeypatch.setattr(storage, "_ping_redis", lambda *a, **kw: pinged.update(kw))
    monkeypatch.setenv("REDIS_HOST", "localhost")
    monkeypatch.setenv("REDIS_PORT", "6380")
    monkeypatch.setenv("REDIS_PASSWORD", "pw")
    monkeypatch.setenv("REDIS_SSL", "true")
    store = build_token_store()
    assert pinged["ssl"] is True
    assert _connection_class(store) == "SSLConnection"
