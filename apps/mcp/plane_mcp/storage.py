"""OAuth token storage backends.

Selects and verifies the storage backing the OAuth token cache used by the
HTTP / SSE transports. Priority order (highest first):

1. ``REDIS_URL`` → Redis from a single connection URL. The URL carries host,
   port, db, credentials and TLS (``rediss://``) in one value; ``REDIS_SSL``
   is ignored here because the scheme already decides. ``REDIS_PASSWORD``
   applies only when the URL itself carries no password.
2. ``REDIS_PASSWORD`` + ``REDIS_HOST``/``REDIS_PORT`` → Redis with a static password.
3. ``ELASTICACHE_SECRET_ARN`` + IRSA (``AWS_ROLE_ARN``) or EKS Pod Identity
   (``AWS_CONTAINER_CREDENTIALS_FULL_URI``) + host/port → Redis with a rotating
   AUTH token from AWS Secrets Manager.
4. ``REDIS_HOST`` + ``REDIS_PORT`` → plain Redis (no auth).
5. None of the above → in-memory store (dev only; tokens lost on restart).

On the host/port paths (2–4) ``REDIS_SSL`` turns on TLS for both the startup
PING and the token store's own connection. It defaults off, except on the
ElastiCache path (3), where it defaults on.

Misconfigurations raise ``RuntimeError`` at startup. Reachability is verified
eagerly with a synchronous PING.
"""

from __future__ import annotations

import os
from typing import Any
from urllib.parse import urlparse, urlunparse

from fastmcp.utilities.logging import get_logger
from key_value.aio.stores.memory import MemoryStore
from key_value.aio.stores.redis import RedisStore

logger = get_logger(__name__)


def _has_aws_credentials() -> bool:
    """True when IRSA or EKS Pod Identity env vars are set."""
    return bool(os.getenv("AWS_ROLE_ARN") or os.getenv("AWS_CONTAINER_CREDENTIALS_FULL_URI"))


def _redis_ssl_enabled(default: bool) -> bool:
    """Read REDIS_SSL with the caller's default. ElastiCache paths default True."""
    raw = os.getenv("REDIS_SSL")
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def _redis_client(host: str, port: int, *, password: str | None = None, ssl: bool = False) -> Any:
    """The async client a host/port token store connects with.

    Built here rather than by ``RedisStore(host=..., password=...)``: that
    constructor takes no TLS setting in the locked py-key-value-aio, so the
    store connected in plaintext — sending ``REDIS_PASSWORD`` in the clear —
    even when ``REDIS_SSL`` had made the startup PING use TLS.
    """
    from redis.asyncio import Redis as AsyncRedis

    return AsyncRedis(host=host, port=port, password=password, decode_responses=True, ssl=ssl)


def _redact_url(url: str) -> str:
    """The URL with any password replaced, safe to log."""
    parsed = urlparse(url)
    if not parsed.password:
        return url
    netloc = f"{parsed.username or ''}:***@{parsed.hostname}" + (f":{parsed.port}" if parsed.port else "")
    return urlunparse(parsed._replace(netloc=netloc))


def _url_password_override(url: str, password: str | None) -> dict[str, str]:
    """Extra client kwargs for a URL-configured connection.

    The URL's own credentials win; ``REDIS_PASSWORD`` fills in only when the
    URL carries none. Returned as kwargs rather than a value so an absent
    override cannot clobber a URL-embedded password with ``None``.
    """
    if password and not urlparse(url).password:
        return {"password": password}
    return {}


def _ping_redis_url(url: str, *, password: str | None = None, timeout_seconds: float = 5.0) -> None:
    """Verify Redis reachability from a connection URL with a one-shot PING.

    ``redis.Redis.from_url`` honours the scheme (``rediss://`` enables TLS)
    and any query parameters. Raises ``RuntimeError`` on failure.
    """
    import redis  # local: only loaded when Redis is configured

    client = redis.Redis.from_url(
        url,
        socket_connect_timeout=timeout_seconds,
        socket_timeout=timeout_seconds,
        **_url_password_override(url, password),
    )
    try:
        client.ping()
    except Exception as exc:
        raise RuntimeError(f"Redis connection failed during startup PING: {exc}") from exc
    finally:
        try:
            client.close()
        except Exception:
            pass

    logger.info("Redis connection verified (PING succeeded)")


def _ping_redis(
    host: str,
    port: int,
    *,
    password: str | None = None,
    ssl: bool = False,
    timeout_seconds: float = 5.0,
) -> None:
    """Verify Redis reachability with a one-shot synchronous PING.

    Raises ``RuntimeError`` on any connection or auth failure.
    """
    import redis  # local: only loaded when Redis is configured

    client = redis.Redis(
        host=host,
        port=port,
        password=password,
        ssl=ssl,
        socket_connect_timeout=timeout_seconds,
        socket_timeout=timeout_seconds,
    )
    try:
        client.ping()
    except Exception as exc:
        raise RuntimeError(f"Redis connection failed during startup PING: {exc}") from exc
    finally:
        try:
            client.close()
        except Exception:
            pass

    logger.info("Redis connection verified (PING succeeded)")


def build_token_store() -> Any:
    """Select and build the OAuth token store from environment variables.

    See the module docstring for the selection priority. The returned object
    is handed verbatim to ``PlaneOAuthProvider`` as ``client_storage``.
    """
    redis_url = os.getenv("REDIS_URL")
    redis_host = os.getenv("REDIS_HOST")
    redis_port = os.getenv("REDIS_PORT")
    password = os.getenv("REDIS_PASSWORD")
    secret_arn = os.getenv("ELASTICACHE_SECRET_ARN")

    # 1. Redis by connection URL
    if redis_url:
        if secret_arn:
            logger.warning("Both REDIS_URL and ELASTICACHE_SECRET_ARN set — the URL wins, Secrets Manager ignored.")
        if redis_host or redis_port:
            logger.warning("Both REDIS_URL and REDIS_HOST/REDIS_PORT set — the URL wins, host/port ignored.")

        _ping_redis_url(redis_url, password=password)

        # Not RedisStore(url=...): its own URL parser keeps host/port/db but
        # drops the scheme, silently downgrading rediss:// to plaintext.
        # redis-py's from_url honours the scheme and query parameters.
        from redis.asyncio import Redis as AsyncRedis

        async_client = AsyncRedis.from_url(
            redis_url,
            decode_responses=True,
            **_url_password_override(redis_url, password),
        )
        store = RedisStore(client=async_client)
        logger.info("Token store: Redis (url=%s)", _redact_url(redis_url))
        return store

    # 2. Static-password Redis
    if password:
        if not (redis_host and redis_port):
            raise RuntimeError("REDIS_PASSWORD is set but REDIS_HOST/REDIS_PORT are not — set both to use Redis.")
        if secret_arn:
            logger.warning(
                "Both REDIS_PASSWORD and ELASTICACHE_SECRET_ARN set — static password wins, Secrets Manager ignored."
            )

        # REDIS_SSL defaults False here: plain Redis is the common case for
        # static-password deployments. Set REDIS_SSL=true for TLS-fronted Redis.
        use_ssl = _redis_ssl_enabled(default=False)
        _ping_redis(redis_host, int(redis_port), password=password, ssl=use_ssl)
        store = RedisStore(client=_redis_client(redis_host, int(redis_port), password=password, ssl=use_ssl))
        logger.info(
            "Token store: Redis (auth=password, host=%s, port=%s, ssl=%s)",
            redis_host,
            redis_port,
            use_ssl,
        )
        return store

    # 3. ElastiCache + Secrets Manager
    if secret_arn and _has_aws_credentials():
        if not (redis_host and redis_port):
            raise RuntimeError(
                "ELASTICACHE_SECRET_ARN is set but REDIS_HOST/REDIS_PORT are not — set both to use Redis."
            )

        # Lazy imports keep the AWS path's deps optional.
        from redis.asyncio import Redis as AsyncRedis

        from plane_mcp.aws_secrets import ElastiCacheCredentialProvider, get_secret

        region = os.getenv("AWS_REGION", "us-east-1")
        token_key = os.getenv("REDIS_AUTH_TOKEN_KEY", "authToken")

        # Eager fetch — a missing key fails startup, not the first OAuth flow.
        secret = get_secret(secret_arn, region)
        if token_key not in secret:
            raise RuntimeError(f"REDIS_AUTH_TOKEN_KEY {token_key!r} not present in secret {secret_arn}")

        use_ssl = _redis_ssl_enabled(default=True)
        _ping_redis(redis_host, int(redis_port), password=secret[token_key], ssl=use_ssl)

        async_client = AsyncRedis(
            host=redis_host,
            port=int(redis_port),
            credential_provider=ElastiCacheCredentialProvider(secret_arn, region, token_key),
            decode_responses=True,
            ssl=use_ssl,
        )
        store = RedisStore(client=async_client)
        logger.info(
            "Token store: Redis (auth=secrets-manager, host=%s, port=%s, ssl=%s, region=%s)",
            redis_host,
            redis_port,
            use_ssl,
            region,
        )
        return store

    if secret_arn:
        logger.warning(
            "ELASTICACHE_SECRET_ARN is set but IRSA / Pod Identity env vars "
            "(AWS_ROLE_ARN or AWS_CONTAINER_CREDENTIALS_FULL_URI) are missing — "
            "skipping Secrets Manager auth."
        )

    # 4. Plain Redis
    if redis_host and redis_port:
        use_ssl = _redis_ssl_enabled(default=False)
        _ping_redis(redis_host, int(redis_port), ssl=use_ssl)
        store = RedisStore(client=_redis_client(redis_host, int(redis_port), ssl=use_ssl))
        logger.info("Token store: Redis (auth=none, host=%s, port=%s, ssl=%s)", redis_host, redis_port, use_ssl)
        return store

    # 5. In-memory fallback
    logger.warning(
        "Token store: in-memory (tokens lost on restart). Set REDIS_URL or REDIS_HOST and REDIS_PORT for production."
    )
    return MemoryStore()
