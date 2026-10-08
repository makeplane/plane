# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import date, datetime, timedelta, timezone as dt_timezone

import pytest
from freezegun import freeze_time

from plane.tests.factories_time_tracking import TimeEntryFactory, make_member, make_user
from plane.time_tracking.access import TimeTrackingAccess
from plane.time_tracking.services import (
    create_manual_entry,
    local_date_for,
    start_timer,
    update_entry,
    update_running_timer,
)


def utc(*args):
    return datetime(*args, tzinfo=dt_timezone.utc)


@pytest.mark.unit
class TestLocalDate:
    def test_lisbon_late_evening_is_still_that_day(self, db):
        # 23:30 in Lisbon (summer time, UTC+1) is 22:30Z
        user = make_user("lis", tz="Europe/Lisbon")
        assert local_date_for(user, utc(2026, 7, 14, 22, 30)) == date(2026, 7, 14)

    def test_after_midnight_in_lisbon_is_the_next_day(self, db):
        user = make_user("lis", tz="Europe/Lisbon")
        assert local_date_for(user, utc(2026, 7, 14, 23, 30)) == date(2026, 7, 15)

    def test_los_angeles_where_the_utc_date_differs(self, db):
        # 02:00Z on the 15th is still the evening of the 14th in Los Angeles
        user = make_user("la", tz="America/Los_Angeles")
        assert local_date_for(user, utc(2026, 7, 15, 2, 0)) == date(2026, 7, 14)

    def test_unknown_timezone_falls_back_to_utc(self, db):
        user = make_user("x")
        user.user_timezone = "Not/AZone"
        assert local_date_for(user, utc(2026, 7, 15, 2, 0)) == date(2026, 7, 15)


@pytest.mark.unit
class TestSpentOnDerivation:
    def _member(self, world, tz):
        user = make_member(world.workspace, make_user("tz", tz=tz), 15, world.web, 15)
        return user, TimeTrackingAccess(user, world.slug)

    @freeze_time("2026-07-15 02:00:00")
    def test_timer_uses_the_owners_local_date(self, world):
        user, access = self._member(world, "America/Los_Angeles")
        timer, _, _ = start_timer(access, user, project_id=world.web.id)
        assert timer.spent_on == date(2026, 7, 14)

    @freeze_time("2026-07-16 12:00:00")
    def test_start_end_entry_ignores_the_sent_spent_on(self, world):
        user, access = self._member(world, "America/Los_Angeles")
        entry = create_manual_entry(
            access,
            user,
            {
                "project_id": world.web.id,
                "started_at": utc(2026, 7, 15, 2, 0),
                "ended_at": utc(2026, 7, 15, 3, 0),
                "spent_on": date(2026, 7, 1),
            },
        )
        assert entry.spent_on == date(2026, 7, 14)

    @freeze_time("2026-07-16 12:00:00")
    def test_changing_started_at_recomputes_spent_on(self, world):
        user, access = self._member(world, "Europe/Lisbon")
        entry = TimeEntryFactory(
            project=world.web,
            user=user,
            started_at=utc(2026, 7, 14, 10, 0),
            ended_at=utc(2026, 7, 14, 11, 0),
            spent_on=date(2026, 7, 14),
        )
        update_entry(access, user, entry, {"started_at": utc(2026, 7, 15, 23, 30), "ended_at": utc(2026, 7, 16, 0, 30)})
        entry.refresh_from_db()
        assert entry.spent_on == date(2026, 7, 16)
        assert entry.duration_seconds == 3600

    @freeze_time("2026-07-15 02:00:00")
    def test_moving_a_running_timer_start_recomputes_spent_on(self, world):
        user, access = self._member(world, "UTC")
        timer = TimeEntryFactory.running(project=world.web, user=user, started_ago=timedelta(minutes=10))
        update_running_timer(access, user, timer, {"started_at": utc(2026, 7, 14, 23, 0)})
        timer.refresh_from_db()
        assert timer.spent_on == date(2026, 7, 14)

    @freeze_time("2026-07-15 02:00:00")
    def test_spent_on_does_not_change_when_the_owner_changes_timezone(self, world):
        user, access = self._member(world, "UTC")
        entry = create_manual_entry(access, user, {"project_id": world.web.id, "duration_seconds": 3600})
        user.user_timezone = "America/Los_Angeles"
        user.save()
        entry.refresh_from_db()
        assert entry.spent_on == date(2026, 7, 15)
