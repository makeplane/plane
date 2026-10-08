# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import timedelta

import pytest

from plane.db.models import IssueActivity
from plane.tests.factories_time_tracking import TimeEntryFactory
from plane.time_tracking.models import TimeEntry
from plane.time_tracking.tasks import format_short, record_time_entry_activity, stop_stale_timers


@pytest.mark.unit
class TestStopStaleTimers:
    def test_stops_at_exactly_twelve_hours(self, world):
        stale = TimeEntryFactory.running(project=world.web, user=world.ben, started_ago=timedelta(hours=13))
        fresh = TimeEntryFactory.running(project=world.web, user=world.pia, started_ago=timedelta(hours=11, minutes=59))
        assert stop_stale_timers() == 1

        stale.refresh_from_db()
        assert stale.ended_at == stale.started_at + timedelta(hours=12)
        assert stale.duration_seconds == 43_200 and stale.auto_stopped is True
        assert stale.created_by_id == world.ben.id

        fresh.refresh_from_db()
        assert fresh.ended_at is None and fresh.duration_seconds is None

    def test_is_idempotent(self, world):
        TimeEntryFactory.running(project=world.web, user=world.ben, started_ago=timedelta(hours=20))
        assert stop_stale_timers() == 1
        assert stop_stale_timers() == 0

    def test_records_activity_for_work_item_timers(self, world):
        TimeEntryFactory.running(project=world.web, user=world.ben, issue=world.web_1, started_ago=timedelta(hours=13))
        stop_stale_timers()
        activity = IssueActivity.objects.get(issue=world.web_1, field="time_entry")
        assert activity.verb == "created" and activity.new_value == "43200"

    def test_ignores_deleted_timers(self, world):
        timer = TimeEntryFactory.running(project=world.web, user=world.ben, started_ago=timedelta(hours=13))
        TimeEntry.objects.filter(id=timer.id).update(deleted_at=timer.started_at)
        assert stop_stale_timers() == 0


@pytest.mark.unit
class TestActivity:
    def test_created(self, world):
        entry = TimeEntryFactory(project=world.web, user=world.ben, issue=world.web_1, duration_seconds=5400)
        record_time_entry_activity(str(entry.id), "created", str(world.ben.id), str(world.web_1.id), None, 5400)
        activity = IssueActivity.objects.get(issue=world.web_1, field="time_entry")
        assert activity.verb == "created"
        assert (activity.old_value, activity.new_value) == (None, "5400")
        assert activity.new_identifier == entry.id and activity.old_identifier == world.ben.id
        assert activity.actor_id == world.ben.id
        assert activity.comment == "logged 1h 30m"
        assert activity.project_id == world.web.id and activity.workspace_id == world.workspace.id

    def test_updated_on_behalf(self, world):
        entry = TimeEntryFactory(project=world.web, user=world.ben, issue=world.web_1)
        record_time_entry_activity(str(entry.id), "updated", str(world.pia.id), str(world.web_1.id), 3600, 7200)
        activity = IssueActivity.objects.get(issue=world.web_1, field="time_entry")
        assert activity.comment == "changed logged time from 1h to 2h"
        assert activity.actor_id == world.pia.id and activity.old_identifier == world.ben.id

    def test_deleted(self, world):
        entry = TimeEntryFactory(project=world.web, user=world.ben, issue=world.web_1)
        record_time_entry_activity(str(entry.id), "deleted", str(world.ben.id), str(world.web_1.id), 2700, None)
        assert IssueActivity.objects.get(issue=world.web_1).comment == "removed 45m of logged time"

    def test_services_queue_activity_on_commit(self, world, django_capture_on_commit_callbacks):
        from plane.time_tracking.access import TimeTrackingAccess
        from plane.time_tracking.services import create_manual_entry, update_entry

        access = TimeTrackingAccess(world.ben, world.slug)
        with mock_delay() as calls, django_capture_on_commit_callbacks(execute=True):
            entry = create_manual_entry(
                access, world.ben, {"project_id": world.web.id, "issue_id": world.web_1.id, "duration_seconds": 600}
            )
        assert [c["verb"] for c in calls] == ["created"]

        with mock_delay() as calls, django_capture_on_commit_callbacks(execute=True):
            update_entry(access, world.ben, entry, {"issue_id": world.web_2.id})
        assert [(c["verb"], c["issue_id"]) for c in calls] == [
            ("deleted", str(world.web_1.id)),
            ("created", str(world.web_2.id)),
        ]

    def test_project_time_records_nothing(self, world, django_capture_on_commit_callbacks):
        from plane.time_tracking.access import TimeTrackingAccess
        from plane.time_tracking.services import create_manual_entry

        with mock_delay() as calls, django_capture_on_commit_callbacks(execute=True):
            create_manual_entry(
                TimeTrackingAccess(world.ben, world.slug),
                world.ben,
                {"project_id": world.web.id, "duration_seconds": 600},
            )
        assert calls == []


def mock_delay():
    from contextlib import contextmanager
    from unittest import mock

    @contextmanager
    def _ctx():
        calls = []
        with mock.patch(
            "plane.time_tracking.tasks.record_time_entry_activity.delay", side_effect=lambda **kw: calls.append(kw)
        ):
            yield calls

    return _ctx()


@pytest.mark.unit
@pytest.mark.parametrize("seconds,text", [(0, "0m"), (2700, "45m"), (3600, "1h"), (5400, "1h 30m")])
def test_format_short(seconds, text):
    assert format_short(seconds) == text
