# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from types import SimpleNamespace

import pytest

from plane.bgtasks.email_notification_task import actor_avatar_url, format_activity_time

FALLBACK = "EMAIL_NOTIFICATION_FALLBACK_TIMEZONE"


@pytest.mark.unit
class TestFormatActivityTime:
    """Activity time is shown in the receiver's timezone with a 12-hour clock."""

    def test_converts_to_receiver_timezone(self, monkeypatch):
        monkeypatch.delenv(FALLBACK, raising=False)
        assert format_activity_time("2026-11-27 21:14:00", "America/Mexico_City") == "3:14 PM"

    def test_utc_profile_uses_fallback(self, monkeypatch):
        monkeypatch.setenv(FALLBACK, "America/Mexico_City")
        assert format_activity_time("2026-11-27 21:14:00", "UTC") == "3:14 PM"

    def test_invalid_profile_uses_fallback(self, monkeypatch):
        monkeypatch.setenv(FALLBACK, "America/Mexico_City")
        assert format_activity_time("2026-11-27 21:14:00", "Not/AZone") == "3:14 PM"

    def test_explicit_profile_wins_over_fallback(self, monkeypatch):
        monkeypatch.setenv(FALLBACK, "America/Mexico_City")
        assert format_activity_time("2026-11-27 21:14:00", "Europe/Madrid") == "10:14 PM"

    def test_without_fallback_stays_utc_with_12_hour_clock(self, monkeypatch):
        monkeypatch.delenv(FALLBACK, raising=False)
        assert format_activity_time("2026-11-27 21:14:00", "UTC") == "9:14 PM"

    def test_invalid_fallback_stays_utc(self, monkeypatch):
        monkeypatch.setenv(FALLBACK, "Not/AZone")
        assert format_activity_time("2026-11-27 09:05:00", "UTC") == "9:05 AM"


@pytest.mark.unit
class TestActorAvatarUrl:
    """A missing avatar must not produce a broken image URL."""

    def test_missing_avatar_is_empty(self):
        actor = SimpleNamespace(avatar_url=None)
        assert actor_avatar_url("https://plane.example.com", actor) == ""

    def test_uploaded_avatar_is_absolute(self):
        actor = SimpleNamespace(avatar_url="/api/assets/v2/static/abc/")
        assert (
            actor_avatar_url("https://plane.example.com", actor)
            == "https://plane.example.com/api/assets/v2/static/abc/"
        )
