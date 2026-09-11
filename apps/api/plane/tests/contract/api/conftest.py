# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from django.core.cache import cache

from plane.api.rate_limit import ApiKeyRateThrottle


@pytest.fixture
def api_key_client(api_client, api_token):
    """API-key authenticated client with a clean rate-limit budget.

    ``ApiKeyRateThrottle`` (``plane.api.rate_limit``) records request history in the
    shared cache under ``"<scope>:<token>"``. These contract tests reuse a single
    fixed token, so without a reset the request count accumulates across the whole
    session and eventually trips the 60/minute limit, failing later tests with HTTP
    429. Only this token's throttle key is deleted — flushing the whole cache would
    be needlessly broad and could interfere with other tests.
    """
    cache.delete(f"{ApiKeyRateThrottle.scope}:{api_token.token}")
    api_client.credentials(HTTP_X_API_KEY=api_token.token)
    return api_client
