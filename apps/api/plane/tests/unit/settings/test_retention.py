# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Unit tests for the log-retention env parsing helper."""

import pytest

from plane.settings.common import _retention_days

ENV_VAR = "TEST_RETENTION_DAYS"


@pytest.mark.unit
class TestRetentionDays:
    def test_uses_default_when_unset(self, monkeypatch):
        monkeypatch.delenv(ENV_VAR, raising=False)
        assert _retention_days(ENV_VAR, 14) == 14

    def test_uses_env_value_when_valid(self, monkeypatch):
        monkeypatch.setenv(ENV_VAR, "30")
        assert _retention_days(ENV_VAR, 14) == 30

    def test_zero_is_allowed(self, monkeypatch):
        monkeypatch.setenv(ENV_VAR, "0")
        assert _retention_days(ENV_VAR, 14) == 0

    def test_negative_falls_back_to_default(self, monkeypatch):
        monkeypatch.setenv(ENV_VAR, "-5")
        assert _retention_days(ENV_VAR, 14) == 14

    def test_unparseable_falls_back_to_default(self, monkeypatch):
        monkeypatch.setenv(ENV_VAR, "abc")
        assert _retention_days(ENV_VAR, 7) == 7
