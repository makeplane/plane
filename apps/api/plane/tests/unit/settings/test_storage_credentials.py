# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Unit tests for the object-storage credential settings in plane.settings.common."""

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


def _storage_warnings(caplog):
    return [r for r in caplog.records if r.levelno == logging.CRITICAL and "AWS_SECRET_ACCESS_KEY" in r.getMessage()]


@pytest.mark.unit
class TestStorageCredentialSettings:
    def test_no_placeholder_fallback_when_unset(self, monkeypatch):
        monkeypatch.delenv("AWS_ACCESS_KEY_ID", raising=False)
        monkeypatch.delenv("AWS_SECRET_ACCESS_KEY", raising=False)

        settings = _load_common_settings()

        assert settings.AWS_ACCESS_KEY_ID is None
        assert settings.AWS_SECRET_ACCESS_KEY is None

    @pytest.mark.parametrize(
        "use_minio, access_key, secret_key, expect_warning",
        [
            ("1", "access-key", "secret-key", True),
            ("1", "custom-key", "secret-key", True),
            ("1", "unit-test-access", "unit-test-secret-value", False),
            ("0", "access-key", "secret-key", False),
        ],
    )
    def test_critical_log_for_placeholder_credentials_with_minio(
        self, monkeypatch, caplog, use_minio, access_key, secret_key, expect_warning
    ):
        monkeypatch.setenv("USE_MINIO", use_minio)
        monkeypatch.setenv("AWS_ACCESS_KEY_ID", access_key)
        monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", secret_key)

        with caplog.at_level(logging.CRITICAL, logger="plane"):
            _load_common_settings()

        assert len(_storage_warnings(caplog)) == (1 if expect_warning else 0)
