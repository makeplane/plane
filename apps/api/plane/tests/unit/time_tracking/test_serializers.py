# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Every validation rule in plan 6.6: input parsing (serializers) plus the rules in services."""

from datetime import date, datetime, timedelta, timezone as dt_timezone
from unittest import mock

import pytest
from django.utils import timezone
from freezegun import freeze_time

from plane.db.models import State
from plane.tests.factories_time_tracking import IssueFactory, TimeEntryFactory
from plane.time_tracking.access import TimeTrackingAccess
from plane.time_tracking.serializers import TimeEntryCreateSerializer, TimeEntrySerializer, validated
from plane.time_tracking.services import TimeTrackingError, create_manual_entry, start_timer, update_entry

NOW = datetime(2026, 10, 7, 12, 0, tzinfo=dt_timezone.utc)


def create(world, user=None, **data):
    user = user or world.ben
    data.setdefault("project_id", world.web.id)
    return create_manual_entry(TimeTrackingAccess(user, world.slug), user, data)


def code_of(fn):
    with pytest.raises(TimeTrackingError) as exc:
        fn()
    return exc.value.code, exc.value.status, exc.value.field


@pytest.mark.unit
@freeze_time(NOW)
class TestCreateRules:
    @pytest.mark.parametrize("seconds,ok", [(59, False), (60, True), (86_400, True), (86_401, False)])
    def test_duration_boundaries(self, world, seconds, ok):
        if ok:
            assert create(world, duration_seconds=seconds).duration_seconds == seconds
        else:
            assert code_of(lambda: create(world, duration_seconds=seconds))[0] == "DURATION_OUT_OF_RANGE"

    @pytest.mark.parametrize("minutes,ok", [(0.5, False), (1, True), (24 * 60, True), (24 * 60 + 1, False)])
    def test_start_end_boundaries(self, world, minutes, ok):
        start = NOW - timedelta(hours=25)
        call = lambda: create(world, started_at=start, ended_at=start + timedelta(minutes=minutes))  # noqa: E731
        if ok:
            assert call().duration_seconds == int(minutes * 60)
        else:
            assert code_of(call)[0] == "DURATION_OUT_OF_RANGE"

    @pytest.mark.parametrize(
        "data",
        [
            {},
            {"duration_seconds": 600, "started_at": NOW - timedelta(hours=1), "ended_at": NOW},
            {"started_at": NOW - timedelta(hours=1)},
            {"ended_at": NOW},
        ],
    )
    def test_ambiguous_mode(self, world, data):
        assert code_of(lambda: create(world, **data))[0] == "AMBIGUOUS_ENTRY_MODE"

    def test_end_before_start(self, world):
        assert (
            code_of(lambda: create(world, started_at=NOW - timedelta(hours=1), ended_at=NOW - timedelta(hours=2)))[0]
            == "INVALID_TIME_RANGE"
        )

    def test_future_date(self, world):
        assert code_of(lambda: create(world, spent_on=date(2026, 10, 8), duration_seconds=600))[0] == "FUTURE_TIME"

    def test_today_in_a_timezone_ahead_of_utc_is_not_future(self, world):
        world.ben.user_timezone = "Pacific/Auckland"  # already the 8th there
        world.ben.save()
        assert create(world, spent_on=date(2026, 10, 8), duration_seconds=600).spent_on == date(2026, 10, 8)

    def test_future_end(self, world):
        assert code_of(lambda: create(world, started_at=NOW, ended_at=NOW + timedelta(minutes=5)))[0] == "FUTURE_TIME"

    def test_end_within_clock_skew_is_fine(self, world):
        create(world, started_at=NOW - timedelta(minutes=30), ended_at=NOW + timedelta(seconds=30))

    def test_description_too_long(self, world):
        assert code_of(lambda: create(world, duration_seconds=600, description="x" * 2001))[0] == "DESCRIPTION_TOO_LONG"
        assert create(world, duration_seconds=600, description="x" * 2000).description == "x" * 2000

    def test_issue_from_another_project(self, world):
        assert code_of(lambda: create(world, issue_id=world.sec_1.id, duration_seconds=600))[0] == (
            "ISSUE_NOT_IN_PROJECT"
        )

    def test_issue_only_takes_its_project(self, world):
        entry = create(world, project_id=None, issue_id=world.web_1.id, duration_seconds=600)
        assert entry.project_id == world.web.id

    def test_archived_issue(self, world):
        world.web_1.archived_at = date(2026, 10, 1)
        world.web_1.save()
        assert code_of(lambda: create(world, issue_id=world.web_1.id, duration_seconds=600))[0] == (
            "ISSUE_NOT_LOGGABLE"
        )

    def test_draft_issue(self, world):
        draft = IssueFactory(project=world.web, is_draft=True)
        assert code_of(lambda: create(world, issue_id=draft.id, duration_seconds=600))[0] == "ISSUE_NOT_LOGGABLE"

    def test_triage_issue(self, world):
        triage = State.all_state_objects.create(
            project=world.web, workspace=world.workspace, name="Triage", group="triage", is_triage=True
        )
        item = IssueFactory(project=world.web, state=triage)
        assert code_of(lambda: create(world, issue_id=item.id, duration_seconds=600))[0] == "ISSUE_NOT_LOGGABLE"

    def test_deleted_issue(self, world):
        world.web_1.deleted_at = timezone.now()
        world.web_1.save()
        assert code_of(lambda: create(world, issue_id=world.web_1.id, duration_seconds=600))[0] == (
            "ISSUE_NOT_LOGGABLE"
        )

    def test_archived_project(self, world):
        world.web.archived_at = timezone.now()
        world.web.save()
        code, status, _ = code_of(lambda: create(world, duration_seconds=600))
        assert (code, status) == ("PROJECT_NOT_LOGGABLE", 403)

    def test_non_member(self, world):
        code, status, _ = code_of(lambda: create(world, user=world.cal, duration_seconds=600))
        assert (code, status) == ("PROJECT_NOT_LOGGABLE", 403)

    def test_member_cannot_log_for_others(self, world):
        code, status, _ = code_of(lambda: create(world, user_id=world.pia.id, duration_seconds=600))
        assert (code, status) == ("FORBIDDEN", 403)

    def test_admin_cannot_log_for_a_non_member(self, world):
        code, status, _ = code_of(lambda: create(world, user=world.pia, user_id=world.cal.id, duration_seconds=600))
        assert (code, status) == ("TARGET_USER_NOT_PROJECT_MEMBER", 400)


@pytest.mark.unit
class TestTimerConflict:
    def test_lost_race_is_a_409(self, world):
        TimeEntryFactory.running(project=world.web, user=world.ben)
        # simulate the race: the lock sees no running timer, but the unique constraint does
        with mock.patch("plane.time_tracking.services.get_running_timer", return_value=None):
            code, status, _ = code_of(
                lambda: start_timer(TimeTrackingAccess(world.ben, world.slug), world.ben, project_id=world.web.id)
            )
        assert (code, status) == ("TIMER_CONFLICT", 409)


@pytest.mark.unit
class TestUpdateRules:
    def test_other_member_cannot_edit(self, world):
        entry = TimeEntryFactory(project=world.web, user=world.pia)
        code, status, _ = code_of(
            lambda: update_entry(TimeTrackingAccess(world.ben, world.slug), world.ben, entry, {"description": "x"})
        )
        assert (code, status) == ("FORBIDDEN", 403)

    def test_patch_cannot_move_onto_a_draft(self, world):
        draft = IssueFactory(project=world.web, is_draft=True)
        entry = TimeEntryFactory(project=world.web, user=world.ben)
        access = TimeTrackingAccess(world.ben, world.slug)
        assert code_of(lambda: update_entry(access, world.ben, entry, {"issue_id": draft.id}))[0] == (
            "ISSUE_NOT_LOGGABLE"
        )


@pytest.mark.unit
class TestInputParsing:
    def test_only_sent_keys_are_returned(self):
        assert validated(TimeEntryCreateSerializer, {"duration_seconds": 60}) == {"duration_seconds": 60}

    def test_bad_uuid_is_a_validation_error(self):
        with pytest.raises(TimeTrackingError) as exc:
            validated(TimeEntryCreateSerializer, {"project_id": "nope"})
        assert (exc.value.code, exc.value.field) == ("VALIDATION_ERROR", "project_id")

    def test_negative_duration(self):
        with pytest.raises(TimeTrackingError) as exc:
            validated(TimeEntryCreateSerializer, {"duration_seconds": -1})
        assert exc.value.code == "DURATION_OUT_OF_RANGE"


@pytest.mark.unit
class TestReadShape:
    def test_shape(self, world):
        entry = TimeEntryFactory(project=world.web, user=world.ben, issue=world.web_1)
        data = TimeEntrySerializer(entry, context={"access": TimeTrackingAccess(world.ben, world.slug)}).data
        assert data["issue_detail"] == {
            "id": str(world.web_1.id),
            "sequence_id": world.web_1.sequence_id,
            "name": "Fix login",
            "project_identifier": "WEB",
            "state_group": "backlog",
            "is_archived": False,
        }
        assert data["can_edit"] is True and data["is_running"] is False
        assert data["project_detail"]["identifier"] == "WEB"

    def test_project_time_has_no_issue_detail(self, world):
        entry = TimeEntryFactory(project=world.web, user=world.ben)
        data = TimeEntrySerializer(entry, context={"access": TimeTrackingAccess(world.cal, world.slug)}).data
        assert data["issue_detail"] is None and data["can_edit"] is False

    def test_datetimes_are_utc(self, world, settings):
        start = datetime(2026, 10, 7, 8, 0, tzinfo=dt_timezone.utc)
        entry = TimeEntryFactory(
            project=world.web, user=world.ben, started_at=start, ended_at=start + timedelta(hours=1)
        )
        with timezone.override("Asia/Kolkata"):
            data = TimeEntrySerializer(entry).data
        assert data["started_at"] == "2026-10-07T08:00:00Z"
