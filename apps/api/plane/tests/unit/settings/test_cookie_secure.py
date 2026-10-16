# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Unit tests for deriving the session/CSRF cookie Secure flag."""

import pytest

from plane.settings.common import _cookies_secure


@pytest.mark.unit
class TestCookiesSecure:
    def test_https_web_url_is_secure_even_with_http_cors_origin(self):
        origins = ["http://plane.example.com", "https://plane.example.com"]
        assert _cookies_secure("https://plane.example.com", origins) is True

    def test_https_web_url_is_secure_without_cors_origins(self):
        assert _cookies_secure("https://plane.example.com", []) is True

    def test_http_install_stays_non_secure(self):
        assert _cookies_secure("http://localhost", ["http://localhost"]) is False

    def test_local_dev_defaults_stay_non_secure(self):
        origins = ["http://localhost:3000", "http://localhost:3001"]
        assert _cookies_secure("http://localhost:8000", origins) is False

    def test_unset_web_url_and_cors_is_non_secure(self):
        assert _cookies_secure(None, []) is False

    def test_all_https_cors_origins_is_secure(self):
        assert _cookies_secure("http://localhost", ["https://plane.example.com"]) is True
