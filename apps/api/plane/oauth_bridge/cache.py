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

# Python imports
import logging

# Django imports
from django.core.cache import cache as django_cache

# Third party imports
import jwt
from jwt import PyJWKClient, PyJWKSet
from jwt.exceptions import PyJWKSetError

logger = logging.getLogger("plane.oauth_bridge")

_CACHE_KEY_PREFIX = "plane:oauth_bridge:jwks"


def _cache_key(provider_id: str) -> str:
    return f"{_CACHE_KEY_PREFIX}:{provider_id}"


def get_signing_key_for_token(raw_token: str, provider):
    """
    Resolve the signing key for raw_token using provider's JWKS endpoint.

    The raw JWKS dict is stored in Django cache (Redis), keyed by provider UUID,
    with TTL from provider.jwks_cache_ttl. Shared across all gunicorn workers.

    On kid-not-found, forces a single refresh to handle key rotation.
    """
    provider_id = str(provider.id)
    cache_key = _cache_key(provider_id)

    jwks_data = django_cache.get(cache_key)
    if jwks_data is None:
        jwks_data = _fetch_and_cache(provider, cache_key)

    try:
        return _find_signing_key(raw_token, jwks_data)
    except PyJWKSetError:
        # kid not in cached set — could be key rotation, force one refresh
        logger.info("kid not found in cached JWKS for provider %s — refreshing", provider_id)
        jwks_data = _fetch_and_cache(provider, cache_key)
        return _find_signing_key(raw_token, jwks_data)


def invalidate_jwks_cache(provider_id: str) -> None:
    """
    Evict cached JWKS data for a provider.
    Call on provider update or delete so the next request fetches fresh keys.
    """
    django_cache.delete(_cache_key(provider_id))
    logger.debug("Invalidated JWKS cache for provider %s", provider_id)


def _fetch_and_cache(provider, cache_key: str) -> dict:
    """Fetch the raw JWKS dict from the provider endpoint and store in Django cache."""
    client = PyJWKClient(provider.jwks_url)
    jwks_data = client.fetch_data()
    django_cache.set(cache_key, jwks_data, timeout=provider.jwks_cache_ttl)
    logger.debug(
        "Fetched and cached JWKS for provider %s (%d key(s))",
        provider.id,
        len(jwks_data.get("keys", [])),
    )
    return jwks_data


def _find_signing_key(raw_token: str, jwks_data: dict):
    """
    Find the key in jwks_data whose key_id matches the token's kid header.
    Raises PyJWKSetError if no match — caller treats this as a cache miss.
    """
    unverified_header = jwt.get_unverified_header(raw_token)
    kid = unverified_header.get("kid")

    jwk_set = PyJWKSet.from_dict(jwks_data)

    if kid:
        for key in jwk_set.keys:
            if key.key_id == kid:
                return key
        raise PyJWKSetError(f"Unable to find a signing key matching kid={kid!r}")

    # No kid — only safe when exactly one key is present
    if len(jwk_set.keys) == 1:
        return jwk_set.keys[0]

    raise PyJWKSetError("Multiple keys in JWKS but token header has no 'kid'")
