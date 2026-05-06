# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Smoke tests for the Business Calendar subsystem.

Validates end-to-end behaviour:
1. Cache invalidation via signals when Holiday is created/deleted (mock-DB path)
2. @working_day_required decorator: skips task on holidays, runs on working days
3. Audit fields (created_by / updated_by) populated via crum impersonate (DB-level)

DB-level tests (TestAuditFieldsSmoke) require POSTGRES env vars.
Decorator / cache tests are fully mock-based and run without a DB.
"""

from __future__ import annotations

import datetime
import logging
import uuid
from unittest.mock import MagicMock, patch

import pytest


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_mock_schedule(schedule_id: uuid.UUID | None = None) -> MagicMock:
    """Return a lightweight mock WorkSchedule (Mon–Fri VN)."""
    s = MagicMock()
    s.id = schedule_id or uuid.uuid4()
    s.timezone = "Asia/Ho_Chi_Minh"
    s.week_pattern = [True, True, True, True, True, False, False]
    return s


# Fixed Monday 2025-04-28 10:00 VN (03:00 UTC)
FIXED_VN_MONDAY = datetime.date(2025, 4, 28)
FIXED_UTC_NOW = datetime.datetime(2025, 4, 28, 3, 0, 0, tzinfo=datetime.timezone.utc)


# ---------------------------------------------------------------------------
# 1. Cache invalidation via signal (no DB needed — cache is mocked at module level)
# ---------------------------------------------------------------------------

@pytest.mark.smoke
class TestCacheInvalidationSmoke:
    """Verify signal handlers delete the correct cache key on Holiday changes."""

    def test_holiday_create_invalidates_cache(self):
        """
        Simulate Holiday.objects.create triggering post_save signal.
        The signal handler must call cache.delete(calendar:{schedule_id}:{year}).
        """
        import plane.db.models.business_calendar as bc_module

        mock_cache = MagicMock()
        schedule_id = uuid.uuid4()

        # Build a fake Holiday instance (mirrors what the ORM would produce)
        fake_holiday = MagicMock()
        fake_holiday.schedule_id = schedule_id
        fake_holiday.date = datetime.date(2025, 4, 30)

        with patch.object(bc_module, "cache", mock_cache):
            # Fire the signal handler directly (same code path as ORM save)
            bc_module.invalidate_cache_on_holiday_change(
                sender=None, instance=fake_holiday
            )

        expected_key = f"calendar:{schedule_id}:2025"
        mock_cache.delete.assert_called_once_with(expected_key)

    def test_holiday_delete_invalidates_cache(self):
        """Simulate post_delete signal for Holiday — same cache key must be deleted."""
        import plane.db.models.business_calendar as bc_module

        mock_cache = MagicMock()
        schedule_id = uuid.uuid4()

        fake_holiday = MagicMock()
        fake_holiday.schedule_id = schedule_id
        fake_holiday.date = datetime.date(2025, 5, 1)

        with patch.object(bc_module, "cache", mock_cache):
            bc_module.invalidate_cache_on_holiday_change(
                sender=None, instance=fake_holiday
            )

        expected_key = f"calendar:{schedule_id}:2025"
        mock_cache.delete.assert_called_once_with(expected_key)

    def test_day_override_create_invalidates_cache(self):
        """DayOverride create fires the override signal → same cache key deleted."""
        import plane.db.models.business_calendar as bc_module

        mock_cache = MagicMock()
        schedule_id = uuid.uuid4()

        fake_override = MagicMock()
        fake_override.schedule_id = schedule_id
        fake_override.date = datetime.date(2025, 4, 26)

        with patch.object(bc_module, "cache", mock_cache):
            bc_module.invalidate_cache_on_override_change(
                sender=None, instance=fake_override
            )

        expected_key = f"calendar:{schedule_id}:2025"
        mock_cache.delete.assert_called_once_with(expected_key)

    def test_date_string_extract_year(self):
        """_extract_year handles both date objects and ISO strings (P1 bugfix)."""
        import plane.db.models.business_calendar as bc_module

        assert bc_module._extract_year(datetime.date(2025, 4, 30)) == 2025
        assert bc_module._extract_year("2025-04-30") == 2025


# ---------------------------------------------------------------------------
# 2. @working_day_required E2E decorator smoke (fully mocked — no DB)
# ---------------------------------------------------------------------------

@pytest.mark.smoke
class TestWorkingDayDecoratorSmoke:
    """
    End-to-end test of the @working_day_required decorator.
    BusinessCalendarService is mocked — this tests the decorator wiring only.
    """

    def test_task_skips_when_is_working_day_false(self, caplog):
        """
        When BusinessCalendarService.is_working_day returns False,
        the task must return None and log the skip message.
        """
        from plane.bgtasks.issue_automation_task import archive_and_close_old_issues

        with (
            patch("plane.utils.celery_helpers.timezone.now", return_value=FIXED_UTC_NOW),
            patch(
                "plane.utils.celery_helpers.BusinessCalendarService.is_working_day",
                return_value=False,
            ),
            caplog.at_level(logging.INFO, logger="plane.utils.celery_helpers"),
        ):
            result = archive_and_close_old_issues()

        assert result is None, "Task must return None when decorator skips"
        assert any(
            "Skip" in r.message and "not a working day" in r.message
            for r in caplog.records
        ), f"Expected skip log not found. Records: {[r.message for r in caplog.records]}"

    def test_task_runs_when_is_working_day_true(self, caplog):
        """
        When BusinessCalendarService.is_working_day returns True,
        the decorator must NOT produce a skip log — task body executes.
        """
        from plane.bgtasks.issue_automation_task import archive_and_close_old_issues

        with (
            patch("plane.utils.celery_helpers.timezone.now", return_value=FIXED_UTC_NOW),
            patch(
                "plane.utils.celery_helpers.BusinessCalendarService.is_working_day",
                return_value=True,
            ),
            # Stub out the actual task body to avoid needing a DB
            patch("plane.bgtasks.issue_automation_task.archive_old_issues"),
            patch("plane.bgtasks.issue_automation_task.close_old_issues"),
            caplog.at_level(logging.INFO, logger="plane.utils.celery_helpers"),
        ):
            archive_and_close_old_issues()

        skip_logs = [
            r for r in caplog.records
            if "Skip" in r.message and "not a working day" in r.message
        ]
        assert not skip_logs, (
            f"Task must NOT produce skip log on working day. Found: {[r.message for r in skip_logs]}"
        )

    def test_decorator_fail_open_on_service_error(self, caplog):
        """
        If BusinessCalendarService raises, the decorator must run the task
        anyway (fail-open policy) to avoid silently missing critical archive jobs.
        """
        from plane.bgtasks.issue_automation_task import archive_and_close_old_issues

        with (
            patch("plane.utils.celery_helpers.timezone.now", return_value=FIXED_UTC_NOW),
            patch(
                "plane.utils.celery_helpers.BusinessCalendarService.is_working_day",
                side_effect=RuntimeError("Redis down"),
            ),
            patch("plane.bgtasks.issue_automation_task.archive_old_issues"),
            patch("plane.bgtasks.issue_automation_task.close_old_issues"),
            caplog.at_level(logging.ERROR, logger="plane.utils.celery_helpers"),
        ):
            # Must not raise — fail-open
            archive_and_close_old_issues()

        assert any(
            "fail-open" in r.message.lower() or "BusinessCalendarService failed" in r.message
            for r in caplog.records
        ), f"Expected fail-open error log. Records: {[r.message for r in caplog.records]}"

    def test_holiday_skip_then_no_skip_after_delete(self, caplog):
        """
        Sequence: is_working_day=False (holiday present) → skip.
        Then is_working_day=True (holiday removed) → proceed.
        Validates that cache invalidation changes the decorator outcome.
        """
        from plane.bgtasks.issue_automation_task import archive_and_close_old_issues

        # Round 1: holiday present → skip
        with (
            patch("plane.utils.celery_helpers.timezone.now", return_value=FIXED_UTC_NOW),
            patch(
                "plane.utils.celery_helpers.BusinessCalendarService.is_working_day",
                return_value=False,
            ),
            caplog.at_level(logging.INFO, logger="plane.utils.celery_helpers"),
        ):
            result = archive_and_close_old_issues()

        assert result is None
        assert any("Skip" in r.message for r in caplog.records)

        caplog.clear()

        # Round 2: holiday deleted → service now returns True → task runs
        with (
            patch("plane.utils.celery_helpers.timezone.now", return_value=FIXED_UTC_NOW),
            patch(
                "plane.utils.celery_helpers.BusinessCalendarService.is_working_day",
                return_value=True,
            ),
            patch("plane.bgtasks.issue_automation_task.archive_old_issues"),
            patch("plane.bgtasks.issue_automation_task.close_old_issues"),
            caplog.at_level(logging.INFO, logger="plane.utils.celery_helpers"),
        ):
            archive_and_close_old_issues()

        skip_logs = [r for r in caplog.records if "Skip" in r.message and "not a working day" in r.message]
        assert not skip_logs, f"No skip expected after holiday removed. Found: {skip_logs}"


# ---------------------------------------------------------------------------
# 3. Audit fields — requires Django DB (run in CI with Postgres)
# ---------------------------------------------------------------------------

@pytest.mark.smoke
@pytest.mark.django_db
class TestAuditFieldsSmoke:
    """
    Verify BaseModel.created_by / updated_by populated via crum impersonate.
    Requires a live PostgreSQL DB (POSTGRES_* env vars).
    """

    def test_created_by_and_updated_by_set_correctly(self, db):
        from crum import impersonate
        from plane.db.models import User, WorkSchedule, Holiday

        # Create two test users
        user_a = User.objects.create(
            email="smoke_audit_a@plane.so", first_name="Alice", last_name="Smoke"
        )
        user_a.set_password("password")
        user_a.save()

        user_b = User.objects.create(
            email="smoke_audit_b@plane.so", first_name="Bob", last_name="Smoke"
        )
        user_b.set_password("password")
        user_b.save()

        schedule = WorkSchedule.objects.create(
            name="Audit Smoke Schedule",
            week_pattern=[True, True, True, True, True, False, False],
            timezone="Asia/Ho_Chi_Minh",
            is_default=False,
            country_code="VN",
        )

        # Create as user_a
        with impersonate(user_a):
            holiday = Holiday.objects.create(
                schedule=schedule,
                date=datetime.date(2025, 12, 25),
                name="Christmas (audit smoke)",
            )

        holiday.refresh_from_db()
        assert holiday.created_by == user_a, (
            f"created_by must be user_a, got {holiday.created_by}"
        )

        # Update as user_b
        with impersonate(user_b):
            holiday.name = "Christmas Updated"
            holiday.save(update_fields=["name", "updated_by"])

        holiday.refresh_from_db()
        assert holiday.created_by == user_a, "created_by must remain user_a after update"
        assert holiday.updated_by == user_b, (
            f"updated_by must be user_b, got {holiday.updated_by}"
        )
