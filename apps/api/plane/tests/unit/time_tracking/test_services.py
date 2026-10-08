# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import date, datetime, timedelta, timezone as dt_timezone

import pytest
from django.utils import timezone
from freezegun import freeze_time

from plane.tests.factories_time_tracking import ProjectTimeSettingFactory, TimeEntryFactory
from plane.time_tracking.access import TimeTrackingAccess
from plane.time_tracking.models import TimeEntry
from plane.time_tracking.services import (
    TimeTrackingError,
    bulk_update,
    create_manual_entry,
    delete_entry,
    discard_timer,
    start_timer,
    stop_timer,
    update_entry,
    update_running_timer,
)


def access(world, user):
    return TimeTrackingAccess(user, world.slug)


def raises_code(code):
    class _Ctx:
        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            assert exc_type is TimeTrackingError, f"expected {code}, got {exc_type}"
            assert exc.code == code, f"expected {code}, got {exc.code}: {exc.message}"
            return True

    return _Ctx()


@pytest.mark.unit
class TestStopTimer:
    def test_under_a_minute_is_discarded(self, world):
        timer = TimeEntryFactory.running(project=world.web, user=world.ben, started_ago=timedelta(seconds=30))
        entry, discarded = stop_timer(timer)
        assert entry is None and discarded is True
        assert not TimeEntry.objects.filter(id=timer.id).exists()
        assert TimeEntry.all_objects.get(id=timer.id).deleted_at is not None

    def test_normal_stop_sets_duration_and_keeps_the_start_date(self, world):
        timer = TimeEntryFactory.running(project=world.web, user=world.ben, started_ago=timedelta(minutes=90))
        spent_on = timer.spent_on
        entry, discarded = stop_timer(timer, description="Done")
        assert discarded is False
        assert 5395 <= entry.duration_seconds <= 5405
        assert entry.ended_at is not None and entry.auto_stopped is False
        assert entry.spent_on == spent_on and entry.description == "Done"

    def test_over_twelve_hours_caps_and_flags(self, world):
        timer = TimeEntryFactory.running(project=world.web, user=world.ben, started_ago=timedelta(hours=14))
        entry, _ = stop_timer(timer)
        assert entry.duration_seconds == 43_200
        assert entry.ended_at == entry.started_at + timedelta(hours=12)
        assert entry.auto_stopped is True

    def test_auto_stop_flags_the_entry(self, world):
        timer = TimeEntryFactory.running(project=world.web, user=world.ben, started_ago=timedelta(hours=2))
        entry, _ = stop_timer(timer, auto=True)
        assert entry.auto_stopped is True

    def test_auto_stop_still_discards_short_timers(self, world):
        timer = TimeEntryFactory.running(project=world.web, user=world.ben, started_ago=timedelta(seconds=10))
        assert stop_timer(timer, auto=True) == (None, True)

    def test_stop_keeps_created_by(self, world):
        timer = TimeEntryFactory.running(project=world.web, user=world.ben, started_ago=timedelta(minutes=5))
        entry, _ = stop_timer(timer, auto=True)
        entry.refresh_from_db()
        assert entry.created_by_id == world.ben.id


@pytest.mark.unit
class TestStartTimer:
    def test_start_on_a_work_item_takes_its_project(self, world):
        timer, stopped, _ = start_timer(access(world, world.ben), world.ben, issue_id=world.web_1.id)
        assert timer.project_id == world.web.id and timer.issue_id == world.web_1.id
        assert timer.is_running and stopped is None
        assert timer.source == TimeEntry.Source.TIMER and timer.created_by_id == world.ben.id

    def test_start_while_running_stops_the_old_one(self, world):
        old = TimeEntryFactory.running(project=world.web, user=world.ben, started_ago=timedelta(minutes=20))
        timer, stopped, discarded = start_timer(access(world, world.ben), world.ben, issue_id=world.web_2.id)
        assert stopped.id == old.id and discarded is False
        old.refresh_from_db()
        assert old.ended_at is not None and old.duration_seconds >= 1200
        running = TimeEntry.objects.filter(user=world.ben, started_at__isnull=False, ended_at__isnull=True)
        assert list(running.values_list("id", flat=True)) == [timer.id]

    def test_start_while_a_short_timer_runs_discards_it(self, world):
        TimeEntryFactory.running(project=world.web, user=world.ben, started_ago=timedelta(seconds=5))
        _, stopped, discarded = start_timer(access(world, world.ben), world.ben, project_id=world.web.id)
        assert stopped is None and discarded is True

    def test_billable_defaults_from_the_project(self, world):
        ProjectTimeSettingFactory(project=world.web, default_billable=True)
        timer, _, _ = start_timer(access(world, world.ben), world.ben, project_id=world.web.id)
        assert timer.is_billable is True

    def test_explicit_billable_wins(self, world):
        ProjectTimeSettingFactory(project=world.web, default_billable=True)
        timer, _, _ = start_timer(access(world, world.ben), world.ben, project_id=world.web.id, is_billable=False)
        assert timer.is_billable is False

    def test_non_member_cannot_start(self, world):
        with raises_code("PROJECT_NOT_LOGGABLE"):
            start_timer(access(world, world.cal), world.cal, project_id=world.web.id)

    def test_project_and_work_item_required(self, world):
        with raises_code("VALIDATION_ERROR"):
            start_timer(access(world, world.ben), world.ben)


@pytest.mark.unit
class TestRunningTimerEdits:
    def test_edit_description_issue_billable(self, world):
        timer = TimeEntryFactory.running(project=world.web, user=world.ben)
        update_running_timer(
            access(world, world.ben),
            world.ben,
            timer,
            {"description": "Review", "issue_id": world.web_1.id, "is_billable": True},
        )
        timer.refresh_from_db()
        assert (timer.description, timer.issue_id, timer.is_billable) == ("Review", world.web_1.id, True)

    def test_started_at_in_the_future_is_rejected(self, world):
        timer = TimeEntryFactory.running(project=world.web, user=world.ben)
        with raises_code("FUTURE_TIME"):
            update_running_timer(
                access(world, world.ben), world.ben, timer, {"started_at": timezone.now() + timedelta(minutes=5)}
            )

    def test_started_at_more_than_twelve_hours_ago_is_rejected(self, world):
        timer = TimeEntryFactory.running(project=world.web, user=world.ben)
        with raises_code("DURATION_OUT_OF_RANGE"):
            update_running_timer(
                access(world, world.ben), world.ben, timer, {"started_at": timezone.now() - timedelta(hours=13)}
            )

    def test_only_the_owner_can_edit_or_discard(self, world):
        timer = TimeEntryFactory.running(project=world.web, user=world.ben)
        with raises_code("FORBIDDEN"):
            update_entry(access(world, world.pia), world.pia, timer, {"description": "x"})
        with raises_code("FORBIDDEN"):
            discard_timer(timer, world.pia)

    def test_admin_can_delete_a_running_timer(self, world):
        timer = TimeEntryFactory.running(project=world.web, user=world.ben)
        delete_entry(access(world, world.pia), world.pia, timer)
        assert not TimeEntry.objects.filter(id=timer.id).exists()


@pytest.mark.unit
@freeze_time("2026-10-07 12:00:00")
class TestManualEntries:
    def test_duration_mode(self, world):
        entry = create_manual_entry(
            access(world, world.ben),
            world.ben,
            {"project_id": world.web.id, "spent_on": date(2026, 10, 6), "duration_seconds": 5400},
        )
        assert (entry.spent_on, entry.duration_seconds, entry.started_at) == (date(2026, 10, 6), 5400, None)
        assert entry.source == TimeEntry.Source.MANUAL

    def test_duration_mode_defaults_to_today(self, world):
        entry = create_manual_entry(
            access(world, world.ben), world.ben, {"project_id": world.web.id, "duration_seconds": 600}
        )
        assert entry.spent_on == date(2026, 10, 7)

    def test_start_end_mode(self, world):
        start = datetime(2026, 10, 7, 8, 0, tzinfo=dt_timezone.utc)
        entry = create_manual_entry(
            access(world, world.ben),
            world.ben,
            {"project_id": world.web.id, "started_at": start, "ended_at": start + timedelta(hours=2)},
        )
        assert entry.duration_seconds == 7200 and entry.spent_on == date(2026, 10, 7)

    def test_admin_logs_on_behalf(self, world):
        entry = create_manual_entry(
            access(world, world.pia),
            world.pia,
            {"project_id": world.web.id, "user_id": world.ben.id, "duration_seconds": 3600},
        )
        assert entry.user_id == world.ben.id and entry.created_by_id == world.pia.id


@pytest.mark.unit
@freeze_time("2026-10-07 12:00:00")
class TestPatchSemantics:
    START = datetime(2026, 10, 7, 8, 0, tzinfo=dt_timezone.utc)

    def _start_end(self, world, user=None):
        return TimeEntryFactory(
            project=world.web,
            user=user or world.ben,
            started_at=self.START,
            ended_at=self.START + timedelta(hours=1),
            duration_seconds=3600,
            spent_on=date(2026, 10, 7),
        )

    def test_duration_on_start_end_entry_moves_the_end(self, world):
        entry = self._start_end(world)
        update_entry(access(world, world.ben), world.ben, entry, {"duration_seconds": 5400})
        entry.refresh_from_db()
        assert entry.started_at == self.START and entry.ended_at == self.START + timedelta(seconds=5400)

    def test_moving_times_recomputes_duration(self, world):
        entry = self._start_end(world)
        update_entry(access(world, world.ben), world.ben, entry, {"ended_at": self.START + timedelta(hours=3)})
        entry.refresh_from_db()
        assert entry.duration_seconds == 3 * 3600

    def test_spent_on_on_entry_with_times_is_rejected(self, world):
        entry = self._start_end(world)
        with raises_code("SPENT_ON_DERIVED"):
            update_entry(access(world, world.ben), world.ben, entry, {"spent_on": date(2026, 10, 5)})

    def test_clearing_times_converts_to_duration_mode(self, world):
        entry = self._start_end(world)
        update_entry(
            access(world, world.ben),
            world.ben,
            entry,
            {"started_at": None, "ended_at": None, "spent_on": date(2026, 10, 5)},
        )
        entry.refresh_from_db()
        assert (entry.started_at, entry.ended_at, entry.duration_seconds) == (None, None, 3600)
        assert entry.spent_on == date(2026, 10, 5)

    def test_owner_edit_clears_auto_stopped(self, world):
        entry = TimeEntryFactory(project=world.web, user=world.ben, auto_stopped=True)
        update_entry(access(world, world.ben), world.ben, entry, {"description": "fixed"})
        entry.refresh_from_db()
        assert entry.auto_stopped is False

    def test_confirm_clears_auto_stopped(self, world):
        entry = TimeEntryFactory(project=world.web, user=world.ben, auto_stopped=True, duration_seconds=43200)
        update_entry(access(world, world.ben), world.ben, entry, {"confirm": True})
        entry.refresh_from_db()
        assert entry.auto_stopped is False and entry.duration_seconds == 43200

    def test_admin_edit_does_not_clear_auto_stopped(self, world):
        entry = TimeEntryFactory(project=world.web, user=world.ben, auto_stopped=True)
        update_entry(access(world, world.pia), world.pia, entry, {"description": "x"})
        entry.refresh_from_db()
        assert entry.auto_stopped is True and entry.updated_by_id == world.pia.id
        assert entry.user_id == world.ben.id

    def test_only_owner_can_confirm(self, world):
        entry = TimeEntryFactory(project=world.web, user=world.ben, auto_stopped=True)
        with raises_code("FORBIDDEN"):
            update_entry(access(world, world.pia), world.pia, entry, {"confirm": True})

    def test_changing_project_clears_a_work_item_from_another_project(self, world):
        from plane.db.models import ProjectMember

        ProjectMember.objects.create(workspace=world.workspace, project=world.sec, member=world.ben, role=15)
        entry = TimeEntryFactory(project=world.web, user=world.ben, issue=world.web_1)
        update_entry(access(world, world.ben), world.ben, entry, {"project_id": world.sec.id})
        entry.refresh_from_db()
        assert entry.project_id == world.sec.id and entry.issue_id is None

    def test_changing_project_keeps_a_work_item_from_that_project(self, world):
        entry = TimeEntryFactory(project=world.web, user=world.ben, issue=world.web_1)
        update_entry(access(world, world.ben), world.ben, entry, {"project_id": world.web.id})
        entry.refresh_from_db()
        assert entry.issue_id == world.web_1.id

    def test_issue_only_takes_the_project_from_the_issue(self, world):
        from plane.db.models import ProjectMember

        ProjectMember.objects.create(workspace=world.workspace, project=world.sec, member=world.ben, role=15)
        entry = TimeEntryFactory(project=world.web, user=world.ben)
        update_entry(access(world, world.ben), world.ben, entry, {"issue_id": world.sec_1.id})
        entry.refresh_from_db()
        assert (entry.project_id, entry.issue_id) == (world.sec.id, world.sec_1.id)

    def test_existing_entry_on_archived_work_item_stays_editable(self, world):
        entry = TimeEntryFactory(project=world.web, user=world.ben, issue=world.web_1)
        world.web_1.archived_at = date(2026, 10, 1)
        world.web_1.save()
        update_entry(access(world, world.ben), world.ben, entry, {"duration_seconds": 1800})
        entry.refresh_from_db()
        assert entry.duration_seconds == 1800 and entry.issue_id == world.web_1.id

    def test_admin_changes_the_owner(self, world):
        entry = TimeEntryFactory(project=world.web, user=world.ben)
        update_entry(access(world, world.pia), world.pia, entry, {"user_id": world.ana.id})
        entry.refresh_from_db()
        assert entry.user_id == world.ana.id

    def test_member_cannot_change_the_owner(self, world):
        entry = TimeEntryFactory(project=world.web, user=world.ben)
        with raises_code("FORBIDDEN"):
            update_entry(access(world, world.ben), world.ben, entry, {"user_id": world.pia.id})

    def test_owner_must_be_a_project_member(self, world):
        entry = TimeEntryFactory(project=world.web, user=world.ben)
        with raises_code("TARGET_USER_NOT_PROJECT_MEMBER"):
            update_entry(access(world, world.pia), world.pia, entry, {"user_id": world.cal.id})


@pytest.mark.unit
class TestBulk:
    def test_delete_own(self, world):
        ids = [TimeEntryFactory(project=world.web, user=world.ben).id for _ in range(3)]
        assert bulk_update(access(world, world.ben), world.ben, "delete", ids) == 3
        assert not TimeEntry.objects.filter(id__in=ids).exists()

    def test_mixed_permissions_change_nothing(self, world):
        mine = TimeEntryFactory(project=world.web, user=world.ben)
        theirs = TimeEntryFactory(project=world.web, user=world.pia)
        with raises_code("FORBIDDEN"):
            bulk_update(access(world, world.ben), world.ben, "set_billable", [mine.id, theirs.id], True)
        mine.refresh_from_db()
        assert mine.is_billable is False

    def test_invisible_ids_are_forbidden(self, world):
        secret = TimeEntryFactory(project=world.sec, user=world.ana)
        with raises_code("FORBIDDEN"):
            bulk_update(access(world, world.pia), world.pia, "delete", [secret.id])

    def test_limit(self, world):
        import uuid

        with raises_code("BULK_LIMIT"):
            bulk_update(access(world, world.ben), world.ben, "delete", [uuid.uuid4() for _ in range(501)])

    def test_set_billable(self, world):
        ids = [TimeEntryFactory(project=world.web, user=world.ben).id for _ in range(2)]
        bulk_update(access(world, world.pia), world.pia, "set_billable", ids, True)
        assert TimeEntry.objects.filter(id__in=ids, is_billable=True).count() == 2
