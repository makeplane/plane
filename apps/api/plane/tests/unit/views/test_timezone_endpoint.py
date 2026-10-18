# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Tests for the UTC/GMT offset labels returned by ``TimezoneEndpoint``.

Zones west of UTC with a half-hour offset (Marquesas, Newfoundland) used to
come back one hour too far west, because the hours were taken with floor
division on a negative number of seconds: ``-34200 // 3600 == -10``.
"""

from datetime import datetime
from unittest.mock import patch

import pytest
from django.core.cache import cache
from django.test import override_settings
from rest_framework.test import APIRequestFactory

from plane.app.views.timezone.base import TimezoneEndpoint

LOCMEM_CACHE = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}


def _get_timezones(now):
    class FixedDatetime(datetime):
        @classmethod
        def now(cls, tz=None):
            return now

    # The endpoint is wrapped in cache_page, so start each call from a cold cache
    cache.clear()
    with patch("plane.app.views.timezone.base.datetime", FixedDatetime):
        request = APIRequestFactory().get("/api/timezones/")
        response = TimezoneEndpoint.as_view()(request)

    assert response.status_code == 200
    return {tz["value"]: tz for tz in response.data["timezones"]}


@pytest.mark.unit
@override_settings(CACHES=LOCMEM_CACHE)
@pytest.mark.parametrize(
    "now, tz_identifier, expected",
    [
        # Negative half-hour offsets
        (datetime(2026, 1, 15, 12, 0), "Pacific/Marquesas", "-09:30"),
        (datetime(2026, 1, 15, 12, 0), "America/St_Johns", "-03:30"),
        (datetime(2026, 7, 15, 12, 0), "America/St_Johns", "-02:30"),
        # Positive and whole-hour offsets keep working
        (datetime(2026, 1, 15, 12, 0), "Asia/Kolkata", "+05:30"),
        (datetime(2026, 1, 15, 12, 0), "Asia/Kathmandu", "+05:45"),
        (datetime(2026, 1, 15, 12, 0), "America/Los_Angeles", "-08:00"),
        (datetime(2026, 1, 15, 12, 0), "Atlantic/Reykjavik", "+00:00"),
    ],
)
def test_timezone_offset_labels(now, tz_identifier, expected):
    tz = _get_timezones(now)[tz_identifier]

    assert tz["utc_offset"] == f"UTC{expected}"
    assert tz["gmt_offset"] == f"GMT{expected}"
