# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Cookie-authenticated writes must come from the request's own origin or a configured Plane origin."""

import pytest
from django.test import RequestFactory, override_settings
from rest_framework.exceptions import PermissionDenied

from plane.authentication.session import BaseSessionAuthentication, allowed_origins

ORIGIN_SETTINGS = {
    "WEB_URL": "https://plane.example.com",
    "APP_BASE_URL": None,
    "ADMIN_BASE_URL": "https://admin.example.com/god-mode/",
    "SPACE_BASE_URL": None,
    "LIVE_BASE_URL": None,
    "CORS_ALLOWED_ORIGINS": ["http://localhost:3000"],
    "CSRF_TRUSTED_ORIGINS": ["https://trusted.example.com"],
}


@pytest.fixture(autouse=True)
def origin_settings():
    allowed_origins.cache_clear()
    with override_settings(**ORIGIN_SETTINGS):
        yield
    allowed_origins.cache_clear()


def enforce(method="POST", origin=None):
    """Run the check on a request to http://testserver; raises PermissionDenied when refused."""
    extra = {} if origin is None else {"HTTP_ORIGIN": origin}
    request = RequestFactory().generic(method, "/api/users/me/", **extra)
    BaseSessionAuthentication().enforce_csrf(request)


@pytest.mark.unit
class TestSessionOriginCheck:
    @pytest.mark.parametrize("origin", ["http://testserver", "https://testserver", "HTTP://TestServer"])
    def test_request_own_host_is_allowed(self, origin):
        enforce(origin=origin)

    @pytest.mark.parametrize(
        "origin",
        [
            "https://plane.example.com",
            "https://admin.example.com",
            "http://localhost:3000",
            "https://trusted.example.com",
        ],
    )
    def test_configured_origins_are_allowed(self, origin):
        enforce(origin=origin)

    @pytest.mark.parametrize("method", ["POST", "PUT", "PATCH", "DELETE"])
    @pytest.mark.parametrize(
        "origin",
        ["https://evil.example.com", "https://plane.example.com.evil.com", "http://localhost:3999", "null", ""],
    )
    def test_other_origins_are_refused_on_writes(self, method, origin):
        with pytest.raises(PermissionDenied):
            enforce(method=method, origin=origin)

    @pytest.mark.parametrize("method", ["POST", "PATCH", "DELETE"])
    def test_missing_origin_is_allowed(self, method):
        enforce(method=method)

    @pytest.mark.parametrize("method", ["GET", "HEAD", "OPTIONS", "TRACE"])
    def test_safe_methods_are_not_checked(self, method):
        enforce(method=method, origin="https://evil.example.com")
