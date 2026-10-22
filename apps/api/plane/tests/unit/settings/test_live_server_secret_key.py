# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Unit tests for the LIVE_SERVER_SECRET_KEY setting in plane.settings.common."""

import importlib.util
import logging

import pytest

from plane.settings import common


def _load_common_settings():
    """Execute a fresh copy of common.py so module-level settings code re-runs against the current env."""
    spec = importlib.util.spec_from_file_location("plane.settings._common_under_test", common.__file__)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _live_key_warnings(caplog):
    return [r for r in caplog.records if r.levelno == logging.CRITICAL and "LIVE_SERVER_SECRET_KEY" in r.getMessage()]


@pytest.mark.unit
class TestLiveServerSecretKeySetting:
    @pytest.mark.parametrize(
        "value, expect_warning",
        [
            ("change-this-key-on-deployment", True),
            ("htbqvBJAgpm9bzvf3r4urJer0ENReatceh", True),
            ("unit-test-unique-live-key", False),
        ],
    )
    def test_critical_log_only_for_template_values(self, monkeypatch, caplog, value, expect_warning):
        monkeypatch.setenv("LIVE_SERVER_SECRET_KEY", value)

        with caplog.at_level(logging.CRITICAL, logger="plane"):
            settings = _load_common_settings()

        # The setting is kept either way, so existing installs keep working.
        assert settings.LIVE_SERVER_SECRET_KEY == value
        assert len(_live_key_warnings(caplog)) == (1 if expect_warning else 0)
