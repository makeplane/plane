# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for ``UnsplashEndpoint``.

Unsplash answers 401 when the configured access key is invalid or revoked. The
endpoint used to forward that status verbatim, and the web app's API client
treats every 401 as an expired session and hard-redirects to ``/``, so merely
opening a page with the cover-image picker (e.g. profile settings) bounced the
user back to home. Upstream failures must surface as a 502 instead.
"""

from unittest import mock

import pytest
from rest_framework import status

UNSPLASH_URL = "/api/unsplash/"
CONFIG_PATH = "plane.app.views.external.base.get_configuration_value"
REQUESTS_GET_PATH = "plane.app.views.external.base.requests.get"


def _upstream_response(status_code, payload):
    response = mock.Mock()
    response.status_code = status_code
    response.ok = 200 <= status_code < 400
    response.json.return_value = payload
    return response


@pytest.mark.contract
class TestUnsplashEndpoint:
    @pytest.mark.django_db
    @pytest.mark.parametrize("upstream_status", [401, 403, 500])
    def test_upstream_error_is_not_forwarded(self, session_client, upstream_status):
        with (
            mock.patch(CONFIG_PATH, return_value=("bad-key",)),
            mock.patch(
                REQUESTS_GET_PATH,
                return_value=_upstream_response(upstream_status, {"errors": ["The access token is invalid"]}),
            ),
        ):
            response = session_client.get(UNSPLASH_URL)

        assert response.status_code == status.HTTP_502_BAD_GATEWAY

    @pytest.mark.django_db
    def test_success_is_passed_through(self, session_client):
        photos = [{"id": "abc"}]
        with (
            mock.patch(CONFIG_PATH, return_value=("good-key",)),
            mock.patch(REQUESTS_GET_PATH, return_value=_upstream_response(200, photos)),
        ):
            response = session_client.get(UNSPLASH_URL)

        assert response.status_code == status.HTTP_200_OK
        assert response.json() == photos

    @pytest.mark.django_db
    def test_missing_key_returns_empty_list(self, session_client):
        with mock.patch(CONFIG_PATH, return_value=(None,)):
            response = session_client.get(UNSPLASH_URL)

        assert response.status_code == status.HTTP_200_OK
        assert response.json() == []
