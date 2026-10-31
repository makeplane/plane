# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# ruff: noqa: F401, F811
"""Team Ops work calendar: day entries, the weekly plan and how a day is resolved."""

from datetime import date, datetime, time, timedelta, timezone as dt_timezone
from types import SimpleNamespace

import pytest
from freezegun import freeze_time
from rest_framework import status
from rest_framework.test import APIClient

from plane.celery import app as celery_app
from plane.db.models import WorkspaceMember
from plane.team_ops.models import (
    CalendarAudit,
    CalendarEntry,
    CalendarHoliday,
    CalendarSettings,
    CalendarTemplate,
)
from plane.team_ops.services.day_resolution import planned_seconds, resolve_day
from plane.team_ops.services.weekly_plan import extend_weekly_plans, user_today
from plane.team_ops.tasks import extend_weekly_plans_task
from plane.tests.contract.app.team_ops_support import (
    MEMBER,
    _no_broker,
    admin,
    admin_client,
    cal,
    colleague,
    guest,
    guest_client,
    join,
    lead,
    lead_client,
    make_team,
    make_user,
    member,
    member_client,
    next_monday,
    other_workspace,
    outsider,
    outsider_client,
    today,
    workspace,
)

WEEKDAYS = {1, 2, 3, 4, 5}


def entry_url(workspace, day, user=None):
    suffix = f"?user={user.id}" if user else ""
    return cal(workspace, f"entries/{day}/{suffix}")


def put_day(client, workspace, day, mode="ONSITE", user=None, **extra):
    body = {"work_mode": mode, **extra}
    if user:
        body["user"] = str(user.id)
    return client.put(entry_url(workspace, day), body, format="json")


def make_entry(workspace, user, day, mode="ONSITE", source="MANUAL", **extra):
    return CalendarEntry.objects.create(
        workspace=workspace, user=user, work_date=day, work_mode=mode, source=source, **extra
    )


def set_policy(workspace, **fields):
    row, _ = CalendarSettings.objects.get_or_create(workspace=workspace)
    for name, value in fields.items():
        setattr(row, name, value)
    row.save()
    return row


def plan_day(weekday, mode="ONSITE", start="09:00", end="17:00", **extra):
    return {
        "weekday": weekday,
        "work_mode": mode,
        "planned_start_time": start if mode in ("ONSITE", "REMOTE") else None,
        "planned_end_time": end if mode in ("ONSITE", "REMOTE") else None,
        **extra,
    }


def weekdays_in_horizon(weekdays, weeks=8):
    start = today()
    return [
        start + timedelta(days=offset)
        for offset in range(weeks * 7)
        if (start + timedelta(days=offset)).isoweekday() in weekdays
    ]


@pytest.mark.unit
class TestResolveDay:
    """The one rule that decides what a day looks like: manual > holiday > weekly plan > nothing."""

    MONDAY = date(2027, 1, 4)
    SATURDAY = date(2027, 1, 9)

    @staticmethod
    def entry(mode="ONSITE", source="MANUAL", start=None, end=None, leave_type=None, description=""):
        return SimpleNamespace(
            id="entry-id",
            work_mode=mode,
            source=source,
            planned_start_time=start,
            planned_end_time=end,
            description=description,
            leave_type=leave_type,
        )

    def test_a_manual_entry_beats_a_holiday_and_the_weekly_plan(self):
        day = resolve_day(self.MONDAY, self.entry("REMOTE", "MANUAL"), "New Year", WEEKDAYS)

        assert day["mode"] == "REMOTE" and day["source"] == "MANUAL"
        assert day["holiday"] == "New Year"

    def test_a_holiday_beats_the_weekly_plan(self):
        day = resolve_day(self.MONDAY, self.entry("ONSITE", "TEMPLATE"), "New Year", WEEKDAYS)

        assert day["mode"] is None and day["source"] == "HOLIDAY"
        assert day["holiday"] == "New Year" and day["entry"] is None

    def test_the_weekly_plan_applies_without_a_holiday_or_manual_entry(self):
        entry = self.entry("ONSITE", "TEMPLATE", time(9, 0), time(17, 30))

        day = resolve_day(self.MONDAY, entry, None, WEEKDAYS)

        assert day["mode"] == "ONSITE" and day["source"] == "TEMPLATE"
        assert (day["planned_start_time"], day["planned_end_time"]) == ("09:00", "17:30")
        assert day["planned_seconds"] == 8.5 * 3600

    def test_nothing_planned(self):
        day = resolve_day(self.MONDAY, None, None, WEEKDAYS)

        assert day["mode"] is None and day["source"] == "NONE" and day["entry"] is None

    def test_working_days_and_unplanned_days(self):
        planned = resolve_day(self.MONDAY, self.entry(), None, WEEKDAYS)
        unplanned = resolve_day(self.MONDAY, None, None, WEEKDAYS)
        weekend = resolve_day(self.SATURDAY, None, None, WEEKDAYS)
        holiday = resolve_day(self.MONDAY, None, "New Year", WEEKDAYS)
        worked_holiday = resolve_day(self.MONDAY, self.entry(), "New Year", WEEKDAYS)

        assert planned["is_working_day"] and not planned["is_unplanned"]
        assert unplanned["is_working_day"] and unplanned["is_unplanned"]
        # Weekends and holidays are never "unplanned"; a holiday stays a holiday even if someone works it.
        assert not weekend["is_working_day"] and not weekend["is_unplanned"]
        assert not holiday["is_working_day"] and not holiday["is_unplanned"]
        assert not worked_holiday["is_working_day"] and worked_holiday["mode"] == "ONSITE"

    def test_working_weekdays_are_configurable(self):
        saturday_shift = resolve_day(self.SATURDAY, None, None, {6, 7})

        assert saturday_shift["is_working_day"] and saturday_shift["is_unplanned"]

    def test_leave_days_carry_their_type(self):
        day = resolve_day(self.MONDAY, self.entry("LEAVE", leave_type="SICK"), None, WEEKDAYS)

        assert day["mode"] == "LEAVE" and day["leave_type"] == "SICK" and day["planned_seconds"] == 0

    def test_planned_seconds(self):
        assert planned_seconds(time(9, 0), time(17, 0)) == 8 * 3600
        assert planned_seconds(None, None) == 0


@pytest.mark.contract
class TestSetOwnDay:
    @pytest.mark.django_db
    def test_a_member_plans_a_day_and_it_shows_immediately(self, member_client, workspace, member):
        day = next_monday()

        response = put_day(
            member_client,
            workspace,
            day,
            planned_start_time="09:00",
            planned_end_time="17:00",
            description="Sprint planning",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["mode"] == "ONSITE" and response.data["source"] == "MANUAL"
        assert response.data["planned_start_time"] == "09:00"
        assert response.data["planned_seconds"] == 8 * 3600
        assert response.data["description"] == "Sprint planning"

        listed = member_client.get(cal(workspace, f"entries/?from={day}&to={day + timedelta(days=6)}"))
        assert listed.status_code == 200
        assert len(listed.data["days"]) == 7
        assert listed.data["days"][0]["mode"] == "ONSITE"
        assert listed.data["days"][1]["mode"] is None
        entry = CalendarEntry.objects.get(workspace=workspace, user=member, work_date=day)
        assert entry.source == "MANUAL"

    @pytest.mark.django_db
    def test_every_mode_can_be_planned(self, member_client, workspace):
        base = next_monday()
        cases = [
            ("ONSITE", {}),
            ("REMOTE", {"planned_start_time": "10:00", "planned_end_time": "18:00"}),
            ("OFF", {}),
            ("LEAVE", {"leave_type": "SICK"}),
        ]
        for offset, (mode, extra) in enumerate(cases):
            response = put_day(member_client, workspace, base + timedelta(days=offset), mode, **extra)
            assert response.status_code == 201, (mode, response.data)
            assert response.data["mode"] == mode

    @pytest.mark.django_db
    def test_a_leave_day_without_a_type_defaults_to_other(self, member_client, workspace):
        response = put_day(member_client, workspace, next_monday(), "LEAVE")

        assert response.status_code == 201 and response.data["leave_type"] == "OTHER"

    @pytest.mark.django_db
    def test_saving_again_replaces_the_whole_day(self, member_client, workspace):
        day = next_monday()
        put_day(member_client, workspace, day, planned_start_time="09:00", planned_end_time="17:00", description="x")

        response = put_day(member_client, workspace, day, "REMOTE")

        assert response.status_code == 200
        assert response.data["mode"] == "REMOTE"
        assert response.data["planned_start_time"] is None and response.data["description"] == ""
        assert CalendarEntry.objects.filter(workspace=workspace, work_date=day).count() == 1

    @pytest.mark.django_db
    @pytest.mark.parametrize(
        "mode, extra",
        [
            ("ONSITE", {"planned_start_time": "09:00"}),
            ("ONSITE", {"planned_end_time": "17:00"}),
            ("ONSITE", {"planned_start_time": "17:00", "planned_end_time": "09:00"}),
            ("ONSITE", {"planned_start_time": "09:00", "planned_end_time": "09:00"}),
            ("ONSITE", {"planned_start_time": "25:00", "planned_end_time": "26:00"}),
            ("OFF", {"planned_start_time": "09:00", "planned_end_time": "17:00"}),
            ("LEAVE", {"planned_start_time": "09:00", "planned_end_time": "17:00"}),
            ("ONSITE", {"leave_type": "SICK"}),
            ("OFF", {"leave_type": "ANNUAL"}),
            ("LEAVE", {"leave_type": "HOLIDAY"}),
            ("HYBRID", {}),
            ("ONSITE", {"description": "x" * 2001}),
        ],
    )
    def test_invalid_plans_are_rejected(self, member_client, workspace, mode, extra):
        response = put_day(member_client, workspace, next_monday(), mode, **extra)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert not CalendarEntry.objects.exists() and not CalendarAudit.objects.exists()

    @pytest.mark.django_db
    @pytest.mark.parametrize("day", ["2027-13-01", "2027-02-30", "tomorrow", "1999-12-31", "2101-01-01"])
    def test_invalid_dates_are_rejected(self, member_client, workspace, day):
        assert put_day(member_client, workspace, day).status_code == 400

    @pytest.mark.django_db
    def test_changes_are_audited_and_no_op_saves_are_not(self, member_client, workspace, member):
        day = next_monday()

        put_day(member_client, workspace, day, planned_start_time="09:00", planned_end_time="17:00")
        put_day(member_client, workspace, day, planned_start_time="09:00", planned_end_time="17:00")
        put_day(member_client, workspace, day, "REMOTE", planned_start_time="09:00", planned_end_time="17:00")

        audits = list(CalendarAudit.objects.filter(entity="ENTRY").order_by("created_at"))
        assert [audit.action for audit in audits] == ["CREATE", "UPDATE"]
        assert all(audit.subject_user == member and audit.changed_by == member for audit in audits)
        assert all(audit.work_date == day for audit in audits)
        assert audits[0].old_value is None and audits[0].new_value["work_mode"] == "ONSITE"
        assert audits[1].old_value["work_mode"] == "ONSITE" and audits[1].new_value["work_mode"] == "REMOTE"

    @pytest.mark.django_db
    def test_a_holiday_can_still_be_worked_with_a_manual_entry(self, member_client, workspace):
        day = next_monday()
        CalendarHoliday.objects.create(workspace=workspace, date=day, name="Founders Day")

        before = member_client.get(cal(workspace, f"entries/?from={day}&to={day}")).data["days"][0]
        assert before["source"] == "HOLIDAY" and before["mode"] is None and not before["is_unplanned"]

        put_day(member_client, workspace, day, "REMOTE")
        after = member_client.get(cal(workspace, f"entries/?from={day}&to={day}")).data["days"][0]
        assert after["source"] == "MANUAL" and after["mode"] == "REMOTE" and after["holiday"] == "Founders Day"

    @pytest.mark.django_db
    def test_unplanned_working_days_are_flagged(self, member_client, workspace):
        monday = next_monday()
        response = member_client.get(cal(workspace, f"entries/?from={monday}&to={monday + timedelta(days=6)}"))

        flags = [(day["date"], day["is_working_day"], day["is_unplanned"]) for day in response.data["days"]]
        assert [f[1] for f in flags] == [True] * 5 + [False] * 2
        assert [f[2] for f in flags] == [True] * 5 + [False] * 2

    @pytest.mark.django_db
    def test_the_user_in_the_payload_never_moves_data_across_workspaces(
        self, admin_client, workspace, other_workspace, member
    ):
        # A member of another workspace only: not a calendar user here.
        stranger = make_user("stranger")
        join(other_workspace, stranger, MEMBER)

        response = put_day(admin_client, workspace, next_monday(), user=stranger)

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert not CalendarEntry.objects.exists()


@pytest.mark.contract
class TestEntryAccess:
    @pytest.mark.django_db
    def test_guests_outsiders_and_anonymous_cannot_use_the_calendar(self, guest_client, outsider_client, workspace):
        day = next_monday()
        for client in (guest_client, outsider_client):
            assert client.get(cal(workspace, f"entries/?from={day}&to={day}")).status_code == 403
            assert put_day(client, workspace, day).status_code == 403
            assert client.delete(entry_url(workspace, day)).status_code == 403
            assert client.get(cal(workspace, "template/")).status_code == 403
        anonymous = APIClient()
        assert anonymous.get(cal(workspace, f"entries/?from={day}&to={day}")).status_code in (401, 403)
        assert put_day(anonymous, workspace, day).status_code in (401, 403)
        assert not CalendarEntry.objects.exists()

    @pytest.mark.django_db
    def test_a_member_cannot_read_or_change_a_colleague_by_default(self, member_client, workspace, colleague):
        day = next_monday()
        make_entry(workspace, colleague, day, "REMOTE")

        assert member_client.get(cal(workspace, f"entries/?from={day}&to={day}&user={colleague.id}")).status_code == 403
        assert put_day(member_client, workspace, day, "OFF", user=colleague).status_code == 403
        assert member_client.delete(entry_url(workspace, day, colleague)).status_code == 403
        assert CalendarEntry.objects.get(user=colleague).work_mode == "REMOTE"

    @pytest.mark.django_db
    def test_an_admin_reads_and_changes_anyone_and_it_is_audited_with_both_people(
        self, admin_client, workspace, admin, member
    ):
        day = next_monday()

        response = put_day(admin_client, workspace, day, "LEAVE", user=member, leave_type="ANNUAL")

        assert response.status_code == 201
        entry = CalendarEntry.objects.get(workspace=workspace, work_date=day)
        assert entry.user == member
        audit = CalendarAudit.objects.get(entity="ENTRY")
        assert audit.subject_user == member and audit.changed_by == admin
        read = admin_client.get(cal(workspace, f"entries/?from={day}&to={day}&user={member.id}"))
        assert read.data["days"][0]["mode"] == "LEAVE"

    @pytest.mark.django_db
    def test_editing_others_can_be_switched_off_even_for_admins(self, admin_client, workspace, member):
        set_policy(workspace, edit_others_access="NONE")

        assert put_day(admin_client, workspace, next_monday(), user=member).status_code == 403
        # Their own plan is still theirs to change.
        assert put_day(admin_client, workspace, next_monday()).status_code == 201

    @pytest.mark.django_db
    def test_a_team_lead_manages_only_their_team_when_the_policy_allows(
        self, lead_client, workspace, lead, member, colleague
    ):
        make_team(workspace, "Platform", leads=[lead], members=[member])
        day = next_monday()
        assert put_day(lead_client, workspace, day, user=member).status_code == 403  # default: admins only

        set_policy(workspace, edit_others_access="ADMINS_AND_LEADS")
        assert put_day(lead_client, workspace, day, "REMOTE", user=member).status_code == 201
        assert put_day(lead_client, workspace, day, "REMOTE", user=colleague).status_code == 403
        assert lead_client.get(cal(workspace, f"entries/?from={day}&to={day}&user={member.id}")).status_code == 200
        assert lead_client.get(cal(workspace, f"entries/?from={day}&to={day}&user={colleague.id}")).status_code == 403

    @pytest.mark.django_db
    def test_all_members_policy_lets_members_read_but_not_write(self, member_client, workspace, colleague):
        set_policy(workspace, team_view_access="ALL_MEMBERS")
        day = next_monday()

        assert member_client.get(cal(workspace, f"entries/?from={day}&to={day}&user={colleague.id}")).status_code == 200
        assert put_day(member_client, workspace, day, user=colleague).status_code == 403

    @pytest.mark.django_db
    def test_a_workspace_admin_has_no_access_to_another_workspace(self, admin_client, other_workspace):
        day = next_monday()

        assert admin_client.get(cal(other_workspace, f"entries/?from={day}&to={day}")).status_code == 403
        assert put_day(admin_client, other_workspace, day).status_code == 403
        assert not CalendarEntry.objects.exists()

    @pytest.mark.django_db
    def test_someone_who_left_the_workspace_loses_access(self, member_client, workspace, member):
        WorkspaceMember.objects.filter(workspace=workspace, member=member).update(is_active=False)

        assert put_day(member_client, workspace, next_monday()).status_code == 403

    @pytest.mark.django_db
    def test_entries_are_scoped_to_their_workspace(self, admin_client, workspace, other_workspace, admin):
        join(other_workspace, admin, MEMBER)
        day = next_monday()
        make_entry(other_workspace, admin, day, "OFF")

        response = admin_client.get(cal(workspace, f"entries/?from={day}&to={day}"))

        assert response.data["days"][0]["mode"] is None


@pytest.mark.contract
class TestPastDates:
    @pytest.mark.django_db
    def test_members_cannot_change_the_past_but_can_change_today_and_the_future(self, member_client, workspace):
        yesterday = today() - timedelta(days=1)

        denied = put_day(member_client, workspace, yesterday)

        assert denied.status_code == status.HTTP_403_FORBIDDEN
        assert denied.data["earliest_editable_date"] == today()
        assert put_day(member_client, workspace, today()).status_code == 201
        assert put_day(member_client, workspace, today() + timedelta(days=90)).status_code == 201
        assert member_client.delete(entry_url(workspace, yesterday)).status_code == 403

    @pytest.mark.django_db
    def test_the_window_is_configurable_and_admins_have_none(self, member_client, admin_client, workspace):
        set_policy(workspace, member_edit_past_days=3)

        assert put_day(member_client, workspace, today() - timedelta(days=3)).status_code == 201
        assert put_day(member_client, workspace, today() - timedelta(days=4)).status_code == 403
        assert put_day(admin_client, workspace, today() - timedelta(days=200)).status_code == 201

    @pytest.mark.django_db
    def test_a_member_cannot_rewrite_the_past_through_a_range(self, member_client, workspace, member):
        start = today() - timedelta(days=2)
        old = make_entry(workspace, member, start, "ONSITE")

        response = member_client.post(
            cal(workspace, "entries/bulk/"),
            {"work_mode": "OFF", "start_date": str(start), "end_date": str(start + timedelta(days=1))},
            format="json",
        )

        assert response.status_code == 403
        assert sorted(response.data["skipped_dates"]) == [start, start + timedelta(days=1)]
        old.refresh_from_db()
        assert old.work_mode == "ONSITE"


@pytest.mark.contract
class TestDeleteDay:
    @pytest.mark.django_db
    def test_removing_a_manual_day_clears_it_and_is_audited(self, member_client, workspace, member):
        day = next_monday()
        put_day(member_client, workspace, day, "REMOTE")

        response = member_client.delete(entry_url(workspace, day))

        assert response.status_code == 200
        assert response.data["mode"] is None and response.data["source"] == "NONE"
        assert not CalendarEntry.objects.exists()
        audit = CalendarAudit.objects.get(entity="ENTRY", action="DELETE")
        assert audit.old_value["work_mode"] == "REMOTE" and audit.new_value is None

    @pytest.mark.django_db
    def test_removing_a_manual_day_goes_back_to_the_weekly_plan(self, member_client, workspace, member):
        day = next_monday()
        member_client.put(cal(workspace, "template/"), {"days": [plan_day(day.isoweekday(), "REMOTE")]}, format="json")
        put_day(member_client, workspace, day, "OFF")
        assert CalendarEntry.objects.get(user=member, work_date=day).source == "MANUAL"

        response = member_client.delete(entry_url(workspace, day))

        assert response.data["mode"] == "REMOTE" and response.data["source"] == "TEMPLATE"
        assert CalendarEntry.objects.get(user=member, work_date=day).source == "TEMPLATE"
        audit = CalendarAudit.objects.get(entity="ENTRY", action="DELETE")
        assert audit.old_value["work_mode"] == "OFF" and audit.new_value["source"] == "TEMPLATE"

    @pytest.mark.django_db
    def test_a_day_with_nothing_set_by_hand_cannot_be_removed(self, member_client, workspace, member):
        day = next_monday()
        assert member_client.delete(entry_url(workspace, day)).status_code == 404

        make_entry(workspace, member, day, "ONSITE", source="TEMPLATE")
        assert member_client.delete(entry_url(workspace, day)).status_code == 404
        assert CalendarEntry.objects.filter(user=member, work_date=day).exists()

    @pytest.mark.django_db
    def test_removing_a_past_manual_day_does_not_refill_it_from_the_plan(self, admin_client, workspace, member):
        yesterday = today() - timedelta(days=1)
        admin_client.put(
            cal(workspace, "template/"),
            {"user": str(member.id), "days": [plan_day(yesterday.isoweekday(), "REMOTE")]},
            format="json",
        )
        make_entry(workspace, member, yesterday, "OFF")

        response = admin_client.delete(entry_url(workspace, yesterday, member))

        assert response.status_code == 200 and response.data["mode"] is None
        assert not CalendarEntry.objects.filter(user=member, work_date=yesterday).exists()


@pytest.mark.contract
class TestRangeReads:
    @pytest.mark.django_db
    def test_from_and_to_are_required_and_capped(self, member_client, workspace):
        day = next_monday()
        assert member_client.get(cal(workspace, "entries/")).status_code == 400
        assert member_client.get(cal(workspace, f"entries/?from={day}")).status_code == 400
        assert member_client.get(cal(workspace, f"entries/?from={day}&to={day - timedelta(days=1)}")).status_code == 400
        assert (
            member_client.get(cal(workspace, f"entries/?from={day}&to={day + timedelta(days=400)}")).status_code == 400
        )
        assert member_client.get(cal(workspace, f"entries/?from={day}&to=soon")).status_code == 400
        ok = member_client.get(cal(workspace, f"entries/?from={day}&to={day + timedelta(days=365)}"))
        assert ok.status_code == 200 and len(ok.data["days"]) == 366

    @pytest.mark.django_db
    def test_an_unknown_user_is_not_found(self, admin_client, workspace):
        day = next_monday()

        response = admin_client.get(
            cal(workspace, f"entries/?from={day}&to={day}&user=00000000-0000-0000-0000-000000000000")
        )

        assert response.status_code == 404
        assert admin_client.get(cal(workspace, f"entries/?from={day}&to={day}&user=nope")).status_code == 400


@pytest.mark.contract
class TestBulkApply:
    @pytest.mark.django_db
    def test_apply_one_plan_to_a_range_limited_to_weekdays(self, member_client, workspace, member):
        monday = next_monday()

        response = member_client.post(
            cal(workspace, "entries/bulk/"),
            {
                "work_mode": "REMOTE",
                "planned_start_time": "08:00",
                "planned_end_time": "16:00",
                "start_date": str(monday),
                "end_date": str(monday + timedelta(days=13)),
                "weekdays": [1, 2, 3, 4, 5],
            },
            format="json",
        )

        assert response.status_code == 200
        assert response.data == {"created": 10, "updated": 0, "unchanged": 0, "skipped_dates": []}
        saved = CalendarEntry.objects.filter(user=member)
        assert saved.count() == 10 and all(e.work_mode == "REMOTE" and e.source == "MANUAL" for e in saved)
        assert CalendarAudit.objects.filter(entity="ENTRY", action="CREATE").count() == 10

    @pytest.mark.django_db
    def test_applying_again_updates_changes_and_leaves_the_rest(self, member_client, workspace, member):
        monday = next_monday()
        body = {"work_mode": "ONSITE", "dates": [str(monday), str(monday + timedelta(days=1))]}
        member_client.post(cal(workspace, "entries/bulk/"), body, format="json")

        same = member_client.post(cal(workspace, "entries/bulk/"), body, format="json")
        assert same.data["unchanged"] == 2 and same.data["created"] == 0 and same.data["updated"] == 0

        changed = member_client.post(cal(workspace, "entries/bulk/"), {**body, "work_mode": "OFF"}, format="json")
        assert changed.data["updated"] == 2
        assert CalendarAudit.objects.filter(action="UPDATE").count() == 2

    @pytest.mark.django_db
    def test_past_days_are_skipped_and_reported(self, member_client, workspace, member):
        start = today() - timedelta(days=2)

        response = member_client.post(
            cal(workspace, "entries/bulk/"),
            {"work_mode": "OFF", "start_date": str(start), "end_date": str(today() + timedelta(days=1))},
            format="json",
        )

        assert response.status_code == 200
        assert response.data["created"] == 2
        assert response.data["skipped_dates"] == [start, start + timedelta(days=1)]
        assert not CalendarEntry.objects.filter(user=member, work_date__lt=today()).exists()

    @pytest.mark.django_db
    @pytest.mark.parametrize(
        "payload",
        [
            {},
            {"dates": ["2027-01-04"], "start_date": "2027-01-04", "end_date": "2027-01-05"},
            {"start_date": "2027-01-04"},
            {"start_date": "2027-01-10", "end_date": "2027-01-04"},
            {"start_date": "2027-01-04", "end_date": "2028-06-04"},
            {"start_date": "2027-01-09", "end_date": "2027-01-10", "weekdays": [1]},
            {"dates": ["2027-01-04"], "weekdays": []},
            {"dates": []},
            {"dates": ["2027-01-32"]},
        ],
    )
    def test_invalid_bulk_requests_are_rejected(self, member_client, workspace, payload):
        response = member_client.post(
            cal(workspace, "entries/bulk/"), {"work_mode": "ONSITE", **payload}, format="json"
        )

        assert response.status_code == 400
        assert not CalendarEntry.objects.exists()

    @pytest.mark.django_db
    def test_bulk_obeys_the_same_access_rules(self, member_client, lead_client, workspace, colleague, member):
        body = {"work_mode": "OFF", "dates": [str(next_monday())], "user": str(colleague.id)}

        assert member_client.post(cal(workspace, "entries/bulk/"), body, format="json").status_code == 403
        assert lead_client.post(cal(workspace, "entries/bulk/"), body, format="json").status_code == 403
        assert not CalendarEntry.objects.exists()

    @pytest.mark.django_db
    def test_bulk_turns_weekly_plan_days_into_manual_days(self, member_client, workspace, member):
        monday = next_monday()
        member_client.put(cal(workspace, "template/"), {"days": [plan_day(1, "ONSITE")]}, format="json")
        assert CalendarEntry.objects.filter(user=member, work_date=monday, source="TEMPLATE").exists()

        member_client.post(cal(workspace, "entries/bulk/"), {"work_mode": "OFF", "dates": [str(monday)]}, format="json")

        entry = CalendarEntry.objects.get(user=member, work_date=monday)
        assert entry.source == "MANUAL" and entry.work_mode == "OFF"
        assert CalendarAudit.objects.get(entity="ENTRY", work_date=monday).old_value["source"] == "TEMPLATE"


@pytest.mark.contract
class TestWeeklyPlan:
    @pytest.mark.django_db
    def test_saving_the_plan_writes_entries_for_the_horizon(self, member_client, workspace, member):
        response = member_client.put(
            cal(workspace, "template/"),
            {"days": [plan_day(1, "ONSITE"), plan_day(2, "REMOTE", "10:00", "18:00"), plan_day(3, "OFF")]},
            format="json",
        )

        assert response.status_code == 200
        expected = weekdays_in_horizon({1, 2, 3})
        assert response.data["materialized"] == {"created": len(expected), "updated": 0, "removed": 0}
        entries = CalendarEntry.objects.filter(user=member)
        assert sorted(entry.work_date for entry in entries) == expected
        assert all(entry.source == "TEMPLATE" for entry in entries)
        tuesday = next(e for e in entries if e.work_date.isoweekday() == 2)
        assert (tuesday.work_mode, tuesday.planned_start_time) == ("REMOTE", time(10, 0))
        assert [d["weekday"] for d in response.data["days"]] == [1, 2, 3]

        read = member_client.get(cal(workspace, "template/"))
        assert [d["work_mode"] for d in read.data["days"]] == ["ONSITE", "REMOTE", "OFF"]

    @pytest.mark.django_db
    def test_resolved_days_report_the_weekly_plan_as_their_source(self, member_client, workspace):
        member_client.put(cal(workspace, "template/"), {"days": [plan_day(1, "ONSITE")]}, format="json")
        monday = next_monday()

        day = member_client.get(cal(workspace, f"entries/?from={monday}&to={monday}")).data["days"][0]

        assert day["mode"] == "ONSITE" and day["source"] == "TEMPLATE" and not day["is_unplanned"]

    @pytest.mark.django_db
    def test_saving_twice_changes_nothing_the_second_time(self, member_client, workspace):
        body = {"days": [plan_day(1, "ONSITE"), plan_day(2, "REMOTE")]}
        member_client.put(cal(workspace, "template/"), body, format="json")

        again = member_client.put(cal(workspace, "template/"), body, format="json")

        assert again.data["materialized"] == {"created": 0, "updated": 0, "removed": 0}
        assert CalendarAudit.objects.filter(entity="TEMPLATE").count() == 1

    @pytest.mark.django_db
    def test_changing_the_plan_rewrites_only_future_plan_days(self, member_client, workspace, member):
        member_client.put(cal(workspace, "template/"), {"days": [plan_day(1, "ONSITE")]}, format="json")
        yesterday = today() - timedelta(days=1)
        past = make_entry(workspace, member, yesterday, "ONSITE", source="TEMPLATE")

        response = member_client.put(cal(workspace, "template/"), {"days": [plan_day(1, "REMOTE")]}, format="json")

        past.refresh_from_db()
        assert past.work_mode == "ONSITE"
        mondays = weekdays_in_horizon({1})
        assert response.data["materialized"]["updated"] == len(mondays)
        future = CalendarEntry.objects.filter(user=member, work_date__gte=today(), source="TEMPLATE")
        assert {e.work_mode for e in future} == {"REMOTE"}

    @pytest.mark.django_db
    def test_days_set_by_hand_survive_every_rewrite(self, member_client, workspace, member):
        monday = next_monday()
        make_entry(workspace, member, monday, "LEAVE", leave_type="ANNUAL", description="Trip")

        member_client.put(cal(workspace, "template/"), {"days": [plan_day(1, "ONSITE")]}, format="json")
        member_client.put(cal(workspace, "template/"), {"days": [plan_day(1, "REMOTE")]}, format="json")
        member_client.put(cal(workspace, "template/"), {"days": []}, format="json")

        entry = CalendarEntry.objects.get(user=member, work_date=monday)
        assert (entry.work_mode, entry.source, entry.description) == ("LEAVE", "MANUAL", "Trip")

    @pytest.mark.django_db
    def test_removing_a_weekday_removes_its_future_entries(self, member_client, workspace, member):
        member_client.put(
            cal(workspace, "template/"), {"days": [plan_day(1, "ONSITE"), plan_day(2, "ONSITE")]}, format="json"
        )

        response = member_client.put(cal(workspace, "template/"), {"days": [plan_day(1, "ONSITE")]}, format="json")

        assert response.data["materialized"]["removed"] == len(weekdays_in_horizon({2}))
        assert sorted(e.work_date for e in CalendarEntry.objects.filter(user=member)) == weekdays_in_horizon({1})

    @pytest.mark.django_db
    def test_an_inactive_weekday_is_kept_but_writes_nothing(self, member_client, workspace, member):
        response = member_client.put(
            cal(workspace, "template/"),
            {"days": [plan_day(1, "ONSITE"), plan_day(2, "ONSITE", is_active=False)]},
            format="json",
        )

        assert [d["is_active"] for d in response.data["days"]] == [True, False]
        assert {e.work_date.isoweekday() for e in CalendarEntry.objects.filter(user=member)} == {1}
        assert CalendarTemplate.objects.filter(user=member).count() == 2

    @pytest.mark.django_db
    def test_plan_changes_are_audited_as_one_template_change(self, member_client, workspace, member):
        member_client.put(cal(workspace, "template/"), {"days": [plan_day(1, "ONSITE")]}, format="json")
        member_client.put(cal(workspace, "template/"), {"days": [plan_day(1, "REMOTE")]}, format="json")
        member_client.put(cal(workspace, "template/"), {"days": []}, format="json")

        audits = list(CalendarAudit.objects.filter(entity="TEMPLATE").order_by("created_at"))
        assert [a.action for a in audits] == ["CREATE", "UPDATE", "DELETE"]
        assert audits[0].old_value is None and audits[0].new_value[0]["work_mode"] == "ONSITE"
        assert audits[1].old_value[0]["work_mode"] == "ONSITE" and audits[1].new_value[0]["work_mode"] == "REMOTE"
        assert audits[2].new_value is None
        assert all(a.subject_user == member and a.changed_by == member for a in audits)
        # Written-out entries are derived data and are not audited one by one.
        assert not CalendarAudit.objects.filter(entity="ENTRY").exists()

    @pytest.mark.django_db
    @pytest.mark.parametrize(
        "days",
        [
            [plan_day(1), plan_day(1, "REMOTE")],
            [{"weekday": 8, "work_mode": "OFF"}],
            [{"weekday": 0, "work_mode": "OFF"}],
            [{"weekday": 1, "work_mode": "LEAVE"}],
            [{"weekday": 1, "work_mode": "ONSITE", "planned_start_time": "17:00", "planned_end_time": "09:00"}],
            [{"weekday": 1, "work_mode": "OFF", "planned_start_time": "09:00", "planned_end_time": "17:00"}],
            [{"weekday": d, "work_mode": "OFF"} for d in (1, 2, 3, 4, 5, 6, 7, 1)],
        ],
    )
    def test_invalid_plans_are_rejected(self, member_client, workspace, days):
        response = member_client.put(cal(workspace, "template/"), {"days": days}, format="json")

        assert response.status_code == 400
        assert not CalendarTemplate.objects.exists() and not CalendarEntry.objects.exists()

    @pytest.mark.django_db
    def test_plans_follow_the_same_access_rules_as_days(
        self, member_client, admin_client, workspace, colleague, member
    ):
        body = {"days": [plan_day(1)], "user": str(colleague.id)}

        assert member_client.put(cal(workspace, "template/"), body, format="json").status_code == 403
        assert member_client.get(cal(workspace, f"template/?user={colleague.id}")).status_code == 403
        assert admin_client.put(cal(workspace, "template/"), body, format="json").status_code == 200
        assert CalendarTemplate.objects.get().user == colleague
        audit = CalendarAudit.objects.get(entity="TEMPLATE")
        assert audit.subject_user == colleague and audit.changed_by != colleague

    @pytest.mark.django_db
    def test_a_longer_horizon_takes_effect_immediately(self, member_client, admin_client, workspace, member):
        set_policy(workspace, template_horizon_weeks=2)
        member_client.put(cal(workspace, "template/"), {"days": [plan_day(1)]}, format="json")
        assert CalendarEntry.objects.filter(user=member).count() == len(weekdays_in_horizon({1}, weeks=2))

        admin_client.put(cal(workspace, "settings/"), {"template_horizon_weeks": 6}, format="json")
        assert CalendarEntry.objects.filter(user=member).count() == len(weekdays_in_horizon({1}, weeks=6))

        admin_client.put(cal(workspace, "settings/"), {"template_horizon_weeks": 1}, format="json")
        assert CalendarEntry.objects.filter(user=member).count() == len(weekdays_in_horizon({1}, weeks=1))


@pytest.mark.contract
class TestDailyExtension:
    @pytest.mark.django_db
    def test_the_daily_job_extends_plans_as_time_passes(self, member_client, workspace, member):
        start = datetime(2027, 3, 1, 9, 0, tzinfo=dt_timezone.utc)  # a Monday
        with freeze_time(start):
            member_client.put(cal(workspace, "template/"), {"days": [plan_day(1)]}, format="json")
            assert CalendarEntry.objects.filter(user=member).count() == 8

        with freeze_time(start + timedelta(days=14)):
            assert extend_weekly_plans_task() == 1
            dates = sorted(e.work_date for e in CalendarEntry.objects.filter(user=member))
            assert dates[0] == date(2027, 3, 1)  # the past stays
            # Two past Mondays stay as they were; eight more are planned from today.
            assert dates[-1] == date(2027, 5, 3) and len(dates) == 10
            # Running it again changes nothing.
            extend_weekly_plans_task()
            assert CalendarEntry.objects.filter(user=member).count() == 10

    @pytest.mark.django_db
    def test_people_who_left_the_workspace_are_no_longer_extended(self, member_client, workspace, member):
        start = datetime(2027, 3, 1, 9, 0, tzinfo=dt_timezone.utc)
        with freeze_time(start):
            member_client.put(cal(workspace, "template/"), {"days": [plan_day(1)]}, format="json")
        WorkspaceMember.objects.filter(workspace=workspace, member=member).update(is_active=False)

        with freeze_time(start + timedelta(days=14)):
            assert extend_weekly_plans() == 0

        assert CalendarEntry.objects.filter(user=member).count() == 8

    @pytest.mark.django_db
    def test_one_failing_person_does_not_stop_the_others(
        self, member_client, workspace, member, colleague, monkeypatch
    ):
        CalendarTemplate.objects.create(workspace=workspace, user=colleague, weekday=1, work_mode="OFF")
        CalendarTemplate.objects.create(workspace=workspace, user=member, weekday=1, work_mode="OFF")
        from plane.team_ops.services import weekly_plan

        real = weekly_plan.write_out_plan

        def flaky(**kwargs):
            if kwargs["user"].id == colleague.id:
                raise RuntimeError("boom")
            return real(**kwargs)

        monkeypatch.setattr(weekly_plan, "write_out_plan", flaky)

        assert extend_weekly_plans() == 1
        assert CalendarEntry.objects.filter(user=member).exists()
        assert not CalendarEntry.objects.filter(user=colleague).exists()

    @pytest.mark.django_db
    def test_the_job_is_scheduled_daily(self):
        entry = celery_app.conf.beat_schedule["team-ops-extend-calendar-weekly-plans"]

        assert entry["task"] == "plane.team_ops.tasks.extend_weekly_plans_task"

    def test_today_follows_the_profile_timezone(self):
        tokyo = SimpleNamespace(user_timezone="Asia/Tokyo")
        broken = SimpleNamespace(user_timezone="Not/AZone")

        with freeze_time("2027-01-04 23:00:00"):
            assert user_today(tokyo) == date(2027, 1, 5)
            assert user_today(broken) == date(2027, 1, 4)
