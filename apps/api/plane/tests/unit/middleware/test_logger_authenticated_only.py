# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Unit tests for which requests APITokenLogMiddleware logs.

Only a request that authenticated with an API key is logged, and the stored
request and response bodies are capped.
"""

from unittest.mock import patch

import pytest
from django.test import RequestFactory
from rest_framework.response import Response
from rest_framework.views import APIView

from plane.api.middleware.api_authentication import APIKeyAuthentication
from plane.db.models import APIToken
from plane.middleware.logger import MAX_LOGGED_BODY_LENGTH, TRUNCATION_MARKER, APITokenLogMiddleware


class EchoView(APIView):
    """A view behind API key authentication, like the external API views."""

    authentication_classes = [APIKeyAuthentication]
    throttle_classes = []

    def post(self, request):
        return Response({"echo": request.data["text"]})


def _post(api_key, text):
    """Send a request through the middleware and return the enqueued log data, if any."""
    middleware = APITokenLogMiddleware(lambda request: EchoView.as_view()(request).render())
    request = RequestFactory().post(
        "/api/v1/echo/", {"text": text}, content_type="application/json", HTTP_X_API_KEY=api_key
    )
    with patch("plane.middleware.logger.process_logs") as process_logs:
        response = middleware(request)
    log_data = process_logs.delay.call_args.kwargs["log_data"] if process_logs.delay.called else None
    return response, log_data


@pytest.fixture
def api_key(create_user):
    return APIToken.objects.create(user=create_user, label="Log Token").token


@pytest.mark.unit
@pytest.mark.django_db
class TestAPITokenLogAuthenticatedOnly:
    def test_request_that_did_not_authenticate_is_not_logged(self, api_key):
        response, log_data = _post("not-a-valid-api-key", "hello")

        assert response.status_code in (401, 403)
        assert log_data is None

    def test_authenticated_request_is_logged(self, api_key):
        response, log_data = _post(api_key, "hello")

        assert response.status_code == 200
        assert log_data["body"] == '{"text": "hello"}'
        assert log_data["response_body"] == '{"echo":"hello"}'
        assert log_data["response_code"] == 200

    def test_logged_bodies_are_truncated(self, api_key):
        response, log_data = _post(api_key, "x" * (MAX_LOGGED_BODY_LENGTH * 2))

        assert response.status_code == 200
        for field in ("body", "response_body"):
            assert len(log_data[field]) == MAX_LOGGED_BODY_LENGTH + len(TRUNCATION_MARKER)
            assert log_data[field].endswith(TRUNCATION_MARKER)
