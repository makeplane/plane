# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Shared fixtures for the external-API contract tests.

Every test in this package authenticates with the ``api_token`` fixture, whose
token string is a constant. ``ApiKeyRateThrottle.get_cache_key`` keys on that
string, so all of these tests share one throttle bucket for the whole run --
``API_KEY_RATE_LIMIT`` defaults to 60/minute, and the suite finishes well inside
a minute. Once the package as a whole crosses 60 requests, whichever test issues
the next one fails with 429, which shows up as an unrelated test breaking in a
file nobody touched.

Resetting the bucket around each test keeps the failure attributable and stops
the package having an effective cap on how many API calls its tests may make in
total. Only this throttle's key is removed, mirroring the narrowly-scoped
``_clear_auth_throttle_keys`` helper in the app authentication tests, rather than
calling ``cache.clear()`` and disturbing unrelated cached state.
"""

import pytest
from django.core.cache import cache


def _clear_api_key_throttle_keys():
    """Delete only ApiKeyRateThrottle history keys from the shared cache.

    ``ApiKeyRateThrottle`` overrides ``get_cache_key`` to return
    ``f"{self.scope}:{api_key}"``, so its entries are ``api_key:<token>`` and do
    not carry DRF's usual ``throttle_`` prefix.
    """
    cache.delete_pattern("api_key:*")


@pytest.fixture(autouse=True)
def _reset_api_key_throttle_cache():
    """Give every external-API contract test a clean throttle bucket."""
    _clear_api_key_throttle_keys()
    yield
    _clear_api_key_throttle_keys()
