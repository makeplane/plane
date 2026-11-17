# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Unit tests for the optional NUM_PROXIES setting."""

import importlib

import pytest

from plane.settings import common


@pytest.fixture
def load_rest_framework(monkeypatch):
    """Re-execute settings/common.py with NUM_PROXIES set to ``value`` (None = unset)."""

    def _load(value):
        if value is None:
            monkeypatch.delenv("NUM_PROXIES", raising=False)
        else:
            monkeypatch.setenv("NUM_PROXIES", value)
        return importlib.reload(common).REST_FRAMEWORK

    yield _load
    monkeypatch.undo()
    importlib.reload(common)


@pytest.mark.unit
class TestNumProxiesSetting:
    @pytest.mark.parametrize("value", [None, "", "abc", "-1", "9" * 5000])
    def test_unset_or_invalid_keeps_drf_default(self, load_rest_framework, value):
        assert "NUM_PROXIES" not in load_rest_framework(value)

    @pytest.mark.parametrize("value, expected", [("1", 1), ("0", 0)])
    def test_non_negative_integer_is_applied(self, load_rest_framework, value, expected):
        assert load_rest_framework(value)["NUM_PROXIES"] == expected
