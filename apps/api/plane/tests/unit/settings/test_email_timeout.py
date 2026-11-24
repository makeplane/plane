# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Unit tests for the SMTP connection timeout (EMAIL_TIMEOUT)."""

import pytest
from django.conf import settings
from django.core.mail import get_connection

from plane.settings import common


@pytest.mark.unit
class TestEmailTimeoutSetting:
    def test_defaults_to_30_seconds(self, monkeypatch):
        monkeypatch.delenv("EMAIL_TIMEOUT", raising=False)
        assert common._email_timeout() == 30

    @pytest.mark.parametrize("value, expected", [("10", 10), ("120", 120)])
    def test_positive_integer_is_applied(self, monkeypatch, value, expected):
        monkeypatch.setenv("EMAIL_TIMEOUT", value)
        assert common._email_timeout() == expected

    @pytest.mark.parametrize("value", ["", "abc", "0", "-5", "1.5"])
    def test_invalid_or_non_positive_falls_back_to_default(self, monkeypatch, value):
        monkeypatch.setenv("EMAIL_TIMEOUT", value)
        assert common._email_timeout() == 30

    def test_setting_is_defined(self):
        assert settings.EMAIL_TIMEOUT == 30

    def test_smtp_connection_without_explicit_timeout_uses_setting(self):
        """Email tasks build connections like this; they must not block forever."""
        connection = get_connection(
            backend="django.core.mail.backends.smtp.EmailBackend",
            host="smtp.example.invalid",
            port=25,
            username="",
            password="",
            use_tls=False,
            use_ssl=False,
        )
        assert connection.timeout == settings.EMAIL_TIMEOUT == 30
