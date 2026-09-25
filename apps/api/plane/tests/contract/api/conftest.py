# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from django.core.cache import cache


def _clear_api_key_throttle_keys():
    """Delete only the ApiKeyRateThrottle history keys from the shared cache.

    ``ApiKeyRateThrottle.get_cache_key`` returns ``api_key:<token>``, so scoping
    the pattern to ``api_key:`` removes just this throttle's entries instead of
    wiping unrelated cache state.
    """
    cache.delete_pattern("api_key:*")


@pytest.fixture(autouse=True)
def _reset_api_key_throttle_cache():
    """Clear the API-key throttle state around every test in this package.

    Every test here authenticates with the same token from the ``api_token``
    fixture, and the request history behind ``ApiKeyRateThrottle`` lives in a
    cache the whole session shares. Without this the count leaks across tests
    until the suite trips its own rate limit and later tests fail with 429
    regardless of the code under test. Mirrors ``_reset_auth_throttle_cache``
    in ``plane/tests/contract/app/test_authentication.py``.
    """
    _clear_api_key_throttle_keys()
    yield
    _clear_api_key_throttle_keys()
