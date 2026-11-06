"""AWS Secrets Manager helpers for rotating Redis / ElastiCache auth tokens."""

from __future__ import annotations

import json
import os
import threading
import time
from typing import Any

from fastmcp.utilities.logging import get_logger
from redis import CredentialProvider

logger = get_logger(__name__)

_DEFAULT_TTL_SECONDS = 300

_SECRET_CACHE: dict[tuple[str, str], dict[str, Any]] = {}
_cache_lock = threading.Lock()


def _get_ttl_seconds() -> int:
    """Read ``AWS_SECRET_CACHE_TTL`` at call time, falling back to the default."""
    raw = os.getenv("AWS_SECRET_CACHE_TTL")
    if raw is None:
        return _DEFAULT_TTL_SECONDS
    try:
        return int(raw)
    except ValueError:
        logger.warning(
            "AWS_SECRET_CACHE_TTL=%r is not an integer; using default %d",
            raw,
            _DEFAULT_TTL_SECONDS,
        )
        return _DEFAULT_TTL_SECONDS


def _is_fresh(entry: dict[str, Any], ttl: int) -> bool:
    return time.time() - entry["fetched_at"] < ttl


def get_secret(secret_arn: str, region: str, force_refresh: bool = False) -> dict[str, Any]:
    """Fetch and TTL-cache a JSON secret from AWS Secrets Manager.

    Args:
        secret_arn: ARN of the secret.
        region: AWS region.
        force_refresh: Bypass the cache.

    Returns:
        A copy of the parsed JSON dict. Safe to mutate.
    """
    import boto3  # lazy

    cache_key = (secret_arn, region)
    ttl = _get_ttl_seconds()

    if not force_refresh:
        with _cache_lock:
            entry = _SECRET_CACHE.get(cache_key)
            if entry and _is_fresh(entry, ttl):
                return dict(entry["value"])

    client = boto3.client("secretsmanager", region_name=region)
    response = client.get_secret_value(SecretId=secret_arn)
    value: dict[str, Any] = json.loads(response["SecretString"])
    logger.info("Refreshed secret from Secrets Manager", extra={"secret_arn": secret_arn})

    with _cache_lock:
        if not force_refresh:
            entry = _SECRET_CACHE.get(cache_key)
            if entry and _is_fresh(entry, ttl):
                # Another thread won the race; reuse their value.
                return dict(entry["value"])
        _SECRET_CACHE[cache_key] = {"value": value, "fetched_at": time.time()}

    return dict(value)


class ElastiCacheCredentialProvider(CredentialProvider):
    """redis-py credential provider backed by a Secrets Manager secret."""

    def __init__(
        self,
        secret_arn: str,
        region: str,
        token_key: str,
        username: str | None = None,
    ) -> None:
        self._arn = secret_arn
        self._region = region
        self._key = token_key
        self._username = username

    def get_credentials(self) -> tuple[str] | tuple[str, str]:
        secret = get_secret(self._arn, self._region)
        password = secret.get(self._key)
        if password is None:
            raise RuntimeError(f"REDIS_AUTH_TOKEN_KEY {self._key!r} not present in secret {self._arn}")
        if self._username:
            return (self._username, password)
        return (password,)
