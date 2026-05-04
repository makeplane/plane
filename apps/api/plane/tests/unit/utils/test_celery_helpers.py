# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Unit tests for plane.utils.celery_helpers — working_day_required decorator."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone as dt_timezone
from unittest.mock import MagicMock, call, patch

import pytest

from plane.utils.celery_helpers import VN_TZ, working_day_required


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_task(resolver=None):
    """Wrap a simple spy function with working_day_required."""
    inner = MagicMock(return_value="result")
    inner.__name__ = "my_task"
    wrapped = working_day_required(schedule_resolver=resolver)(inner)
    return wrapped, inner


# ---------------------------------------------------------------------------
# Test suite
# ---------------------------------------------------------------------------

@pytest.mark.unit
class TestWorkingDayRequired:
    """Tests for the working_day_required decorator."""

    # --- non-working day: task skipped ---

    def test_skip_on_non_working_day(self):
        wrapped, inner = _make_task()
        with (
            patch("plane.utils.celery_helpers.timezone") as mock_tz,
            patch("plane.utils.celery_helpers.BusinessCalendarService.is_working_day", return_value=False),
        ):
            mock_tz.now.return_value = datetime(2025, 4, 30, 10, 0, tzinfo=dt_timezone.utc)
            result = wrapped("arg1", key="val")

        inner.assert_not_called()
        assert result is None

    def test_skip_logs_info_message(self, caplog):
        wrapped, inner = _make_task()
        with (
            patch("plane.utils.celery_helpers.timezone") as mock_tz,
            patch("plane.utils.celery_helpers.BusinessCalendarService.is_working_day", return_value=False),
            caplog.at_level("INFO", logger="plane.utils.celery_helpers"),
        ):
            mock_tz.now.return_value = datetime(2025, 4, 30, 10, 0, tzinfo=dt_timezone.utc)
            wrapped()

        assert any("Skip" in r.message and "not a working day" in r.message for r in caplog.records)

    # --- working day: task runs ---

    def test_runs_on_working_day(self):
        wrapped, inner = _make_task()
        with (
            patch("plane.utils.celery_helpers.timezone") as mock_tz,
            patch("plane.utils.celery_helpers.BusinessCalendarService.is_working_day", return_value=True),
        ):
            mock_tz.now.return_value = datetime(2025, 4, 28, 10, 0, tzinfo=dt_timezone.utc)
            result = wrapped("a", b=2)

        inner.assert_called_once_with("a", b=2)
        assert result == "result"

    # --- fail-open: service exception → task still runs ---

    def test_fail_open_on_service_exception(self):
        wrapped, inner = _make_task()
        with (
            patch("plane.utils.celery_helpers.timezone") as mock_tz,
            patch(
                "plane.utils.celery_helpers.BusinessCalendarService.is_working_day",
                side_effect=RuntimeError("DB down"),
            ),
        ):
            mock_tz.now.return_value = datetime(2025, 4, 28, 10, 0, tzinfo=dt_timezone.utc)
            result = wrapped("x")

        inner.assert_called_once_with("x")
        assert result == "result"

    def test_fail_open_logs_exception(self, caplog):
        wrapped, inner = _make_task()
        with (
            patch("plane.utils.celery_helpers.timezone") as mock_tz,
            patch(
                "plane.utils.celery_helpers.BusinessCalendarService.is_working_day",
                side_effect=RuntimeError("DB down"),
            ),
            caplog.at_level("ERROR", logger="plane.utils.celery_helpers"),
        ):
            mock_tz.now.return_value = datetime(2025, 4, 28, 10, 0, tzinfo=dt_timezone.utc)
            wrapped()

        assert any("fail-open" in r.message for r in caplog.records)

    # --- schedule_resolver: id is resolved and forwarded ---

    def test_schedule_resolver_called_with_task_args(self):
        sid = uuid.uuid4()
        resolver = MagicMock(return_value=sid)
        wrapped, inner = _make_task(resolver=resolver)

        with (
            patch("plane.utils.celery_helpers.timezone") as mock_tz,
            patch(
                "plane.utils.celery_helpers.BusinessCalendarService.is_working_day", return_value=True
            ) as mock_is_working,
        ):
            mock_tz.now.return_value = datetime(2025, 4, 28, 10, 0, tzinfo=dt_timezone.utc)
            wrapped("task_arg", kw="kw_val")

        resolver.assert_called_once_with("task_arg", kw="kw_val")
        # Verify sid was forwarded to the service (second positional arg)
        _date_arg, sid_arg = mock_is_working.call_args.args
        assert sid_arg == sid

    def test_no_resolver_passes_none_as_schedule_id(self):
        wrapped, inner = _make_task(resolver=None)

        with (
            patch("plane.utils.celery_helpers.timezone") as mock_tz,
            patch(
                "plane.utils.celery_helpers.BusinessCalendarService.is_working_day", return_value=True
            ) as mock_is_working,
        ):
            mock_tz.now.return_value = datetime(2025, 4, 28, 10, 0, tzinfo=dt_timezone.utc)
            wrapped()

        _date_arg, sid_arg = mock_is_working.call_args.args
        assert sid_arg is None

    # --- timezone handling: UTC 23:00 → VN next day ---

    def test_utc_2300_uses_vn_next_day_date(self):
        """UTC 23:00 on Monday = VN 06:00 Tuesday. Should use Tuesday's VN date."""
        wrapped, inner = _make_task()

        captured_dates = []

        def capture_date(d, sid):
            captured_dates.append(d)
            return True

        with (
            patch("plane.utils.celery_helpers.timezone") as mock_tz,
            patch("plane.utils.celery_helpers.BusinessCalendarService.is_working_day", side_effect=capture_date),
        ):
            # Monday 2025-04-28 23:00 UTC = Tuesday 2025-04-29 06:00 VN
            mock_tz.now.return_value = datetime(2025, 4, 28, 23, 0, tzinfo=dt_timezone.utc)
            wrapped()

        from datetime import date
        assert captured_dates[0] == date(2025, 4, 29), f"Expected 2025-04-29 VN date, got {captured_dates[0]}"

    # --- functools.wraps preserves name ---

    def test_wraps_preserves_function_name(self):
        def original_task():
            pass

        decorated = working_day_required()(original_task)
        assert decorated.__name__ == "original_task"
