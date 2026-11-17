# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Unit tests for deriving the CORS settings.

``_cors_settings`` returns (allowed origins, allow all origins, allow credentials).
"""

import pytest

from plane.settings.common import _cors_settings


@pytest.mark.unit
class TestCorsSettings:
    def test_explicit_origins_win_over_base_urls(self):
        origins = ["https://app.example.com", "https://admin.example.com"]

        assert _cors_settings(origins, ["https://plane.example.com"]) == (origins, False, True)

    def test_base_url_origins_are_used_when_no_origins_are_configured(self):
        base_urls = [
            "https://plane.example.com/",
            "http://localhost:3001/god-mode/",
            "https://Plane.example.com/spaces/",
            None,
            "",
            "not a url",
            "http://[::1",
        ]

        assert _cors_settings([], base_urls) == (
            ["https://plane.example.com", "http://localhost:3001"],
            False,
            True,
        )

    @pytest.mark.parametrize("base_urls", [[], [None, "", "not a url", "http://[::1"]])
    def test_all_origins_are_allowed_without_credentials_when_nothing_is_configured(self, base_urls):
        assert _cors_settings([], base_urls) == ([], True, False)
