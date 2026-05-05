# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Unit tests for plane.bgtasks.worklog_reminder_task.worklog_daily_reminder.

Verifies the @working_day_required() decorator is applied: the task skips on
non-working days and runs on working days. Decorator internals are covered by
plane.tests.unit.utils.test_celery_helpers.TestWorkingDayRequired.
"""

from __future__ import annotations

from datetime import datetime, timezone as dt_timezone
from unittest.mock import patch

import pytest


@pytest.mark.unit
class TestWorklogDailyReminder:
    """Decorator integration: skip on non-working day, run on working day."""

    def test_skips_on_non_working_day(self):
        from plane.bgtasks.worklog_reminder_task import worklog_daily_reminder

        with (
            patch("plane.utils.celery_helpers.timezone") as mock_tz,
            patch(
                "plane.utils.celery_helpers.BusinessCalendarService.is_working_day",
                return_value=False,
            ),
            patch("plane.bgtasks.worklog_reminder_task._send_reminders") as mock_send,
        ):
            mock_tz.now.return_value = datetime(2025, 4, 26, 10, 0, tzinfo=dt_timezone.utc)
            result = worklog_daily_reminder()

        assert result is None
        mock_send.assert_not_called()

    def test_runs_on_working_day(self):
        from plane.bgtasks.worklog_reminder_task import worklog_daily_reminder

        with (
            patch("plane.utils.celery_helpers.timezone") as mock_tz,
            patch(
                "plane.utils.celery_helpers.BusinessCalendarService.is_working_day",
                return_value=True,
            ),
            patch("plane.bgtasks.worklog_reminder_task._send_reminders") as mock_send,
        ):
            mock_tz.now.return_value = datetime(2025, 4, 28, 10, 0, tzinfo=dt_timezone.utc)
            worklog_daily_reminder()

        mock_send.assert_called_once()

    def test_fail_open_runs_on_calendar_error(self):
        """If BusinessCalendarService raises, decorator runs the task anyway."""
        from plane.bgtasks.worklog_reminder_task import worklog_daily_reminder

        with (
            patch("plane.utils.celery_helpers.timezone") as mock_tz,
            patch(
                "plane.utils.celery_helpers.BusinessCalendarService.is_working_day",
                side_effect=RuntimeError("DB down"),
            ),
            patch("plane.bgtasks.worklog_reminder_task._send_reminders") as mock_send,
        ):
            mock_tz.now.return_value = datetime(2025, 4, 26, 10, 0, tzinfo=dt_timezone.utc)
            worklog_daily_reminder()

        mock_send.assert_called_once()
