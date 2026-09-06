# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Unit tests for the clear_cache management command and Redis KEY_PREFIX."""

from unittest.mock import MagicMock, patch

import pytest
from django.core.management import call_command


@pytest.mark.unit
class TestClearCacheCommand:
    @patch("plane.db.management.commands.clear_cache.cache")
    def test_clear_cache_with_specific_key(self, mock_cache):
        """Test clearing a single key deletes only that key."""
        call_command("clear_cache", key="user_session_123")
        mock_cache.delete.assert_called_once_with("user_session_123")
        mock_cache.clear.assert_not_called()

    @patch("plane.db.management.commands.clear_cache.cache")
    def test_clear_cache_scoped_by_key_prefix(self, mock_cache):
        """Test default clear_cache only deletes keys matching the prefix pattern."""
        mock_cache.key_prefix = "plane"
        mock_cache.delete_pattern = MagicMock()

        call_command("clear_cache")

        mock_cache.delete_pattern.assert_called_once_with("plane:*")
        # Ensure full database flush was NOT called
        mock_cache.clear.assert_not_called()

    @patch("plane.db.management.commands.clear_cache.cache")
    def test_clear_cache_with_all_flag_calls_flushdb(self, mock_cache):
        """Test --all flag explicitly forces a full cache.clear() / FLUSHDB."""
        mock_cache.key_prefix = "plane"
        mock_cache.delete_pattern = MagicMock()

        call_command("clear_cache", all=True)

        mock_cache.clear.assert_called_once()
        mock_cache.delete_pattern.assert_not_called()

    @patch("plane.db.management.commands.clear_cache.cache")
    def test_clear_cache_fallback_when_no_delete_pattern(self, mock_cache):
        """Test graceful fallback to cache.clear() if backend does not support delete_pattern."""
        mock_cache.key_prefix = "plane"
        del mock_cache.delete_pattern  # Simulate backend without delete_pattern (e.g. LocMemCache)

        call_command("clear_cache")

        mock_cache.clear.assert_called_once()


@pytest.mark.unit
class TestRedisKeyPrefixSetting:
    def test_redis_key_prefix_configured_in_caches(self, settings):
        """Test that default CACHES setting includes KEY_PREFIX."""
        assert "KEY_PREFIX" in settings.CACHES["default"]
        assert settings.CACHES["default"]["KEY_PREFIX"] == getattr(settings, "REDIS_KEY_PREFIX", "plane")
