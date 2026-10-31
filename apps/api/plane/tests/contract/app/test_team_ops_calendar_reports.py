# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# ruff: noqa: F401, F811
"""Team Ops work calendar: the plan summary and the planned-versus-logged reports, JSON and CSV."""

import csv
import io
from datetime import datetime, timedelta, timezone as dt_timezone

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import User
from plane.team_ops.models import CalendarEntry, CalendarHoliday, CalendarSettings, TimeEntry
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
    make_project,
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

NOTICE = "A work mode is a plan, not proof of presence or of hours worked."


def report_url(workspace, report, start, end, **filters):
    query = "&".join(f"{key}={value}" for key, value in {"from": start, "to": end, **filters}.items())
    return cal(workspace, f"reports/{report}/?{query}")


def plan(workspace, user, day, mode="ONSITE", **extra):
    return CalendarEntry.objects.create(
        workspace=workspace, user=user, work_date=day, work_mode=mode, source="MANUAL", **extra
    )


def log(workspace, user, day, seconds=3600, project=None, hour=9):
    started = datetime.combine(day, datetime.min.time(), tzinfo=dt_timezone.utc) + timedelta(hours=hour)
    return TimeEntry.objects.create(
        workspace=workspace,
        project=project,
        user=user,
        started_at=started,
        ended_at=started + timedelta(seconds=seconds),
        duration_seconds=seconds,
    )


def ids(values):
    return sorted(str(value) for value in values)


def rows_by_user(response):
    return {str(row["user"]): row for row in response.data["people"]}


def parse_csv(response):
    text = response.content.decode("utf-8")
    assert text.startswith("﻿")
    return list(csv.reader(io.StringIO(text.removeprefix("﻿"))))


@pytest.fixture
def report_week(workspace, admin, member, colleague, lead):
    """A future week: one planned workday each for three people, and a holiday on Tuesday."""
    monday = next_monday()
    plan(workspace, member, monday, "ONSITE", planned_start_time="09:00", planned_end_time="17:00")
    plan(workspace, colleague, monday, "REMOTE")
    plan(workspace, lead, monday, "LEAVE", leave_type="SICK")
    CalendarHoliday.objects.create(workspace=workspace, date=monday + timedelta(days=1), name="Founders Day")
    return monday


@pytest.mark.contract
class TestPlanSummary:
    @pytest.mark.django_db
    def test_counts_days_per_category_and_planned_hours(
        self, admin_client, workspace, admin, member, colleague, lead, report_week
    ):
        response = admin_client.get(report_url(workspace, "plan-summary", report_week, report_week + timedelta(days=6)))

        assert response.status_code == status.HTTP_200_OK
        assert response.data["notice"] == NOTICE
        rows = rows_by_user(response)
        assert set(rows) == set(ids([admin.id, member.id, colleague.id, lead.id]))
        assert rows[str(member.id)]["counts"] == {
            "ONSITE": 1,
            "REMOTE": 0,
            "OFF": 0,
            "LEAVE": 0,
            "HOLIDAY": 1,
            "UNPLANNED": 3,
        }
        assert rows[str(member.id)]["planned_seconds"] == 8 * 3600
        assert rows[str(colleague.id)]["counts"]["REMOTE"] == 1 and rows[str(colleague.id)]["planned_seconds"] == 0
        assert rows[str(lead.id)]["counts"]["LEAVE"] == 1 and rows[str(lead.id)]["leave_by_type"] == {"SICK": 1}
        assert rows[str(admin.id)]["counts"]["UNPLANNED"] == 4
        totals = response.data["totals"]
        assert totals["counts"]["ONSITE"] == 1 and totals["counts"]["HOLIDAY"] == 4
        assert totals["counts"]["UNPLANNED"] == 4 + 3 + 3 + 3
        assert totals["planned_seconds"] == 8 * 3600

    @pytest.mark.django_db
    def test_weekly_plan_days_count_and_weekends_do_not_count_as_unplanned(self, admin_client, workspace, member):
        monday = next_monday()
        for offset in range(5):
            CalendarEntry.objects.create(
                workspace=workspace,
                user=member,
                work_date=monday + timedelta(days=offset),
                work_mode="ONSITE" if offset % 2 == 0 else "REMOTE",
                source="TEMPLATE",
                planned_start_time="10:00",
                planned_end_time="18:00",
            )

        row = rows_by_user(
            admin_client.get(report_url(workspace, "plan-summary", monday, monday + timedelta(days=6), user=member.id))
        )[str(member.id)]

        assert row["counts"]["ONSITE"] == 3 and row["counts"]["REMOTE"] == 2 and row["counts"]["UNPLANNED"] == 0
        assert row["planned_seconds"] == 5 * 8 * 3600

    @pytest.mark.django_db
    def test_a_member_sees_only_their_own_row(self, member_client, workspace, member, colleague, report_week):
        own = member_client.get(report_url(workspace, "plan-summary", report_week, report_week))
        other = member_client.get(report_url(workspace, "plan-summary", report_week, report_week, user=colleague.id))

        assert own.status_code == 200 and [str(row["user"]) for row in own.data["people"]] == [str(member.id)]
        assert other.status_code == 200 and other.data["people"] == []

    @pytest.mark.django_db
    def test_a_lead_sees_their_team_and_an_admin_everyone(
        self, lead_client, admin_client, workspace, lead, member, colleague, report_week
    ):
        make_team(workspace, "Platform", leads=[lead], members=[member])

        lead_rows = lead_client.get(report_url(workspace, "plan-summary", report_week, report_week))
        admin_rows = admin_client.get(report_url(workspace, "plan-summary", report_week, report_week))

        assert ids(row["user"] for row in lead_rows.data["people"]) == ids([lead.id, member.id])
        assert len(admin_rows.data["people"]) == 4

    @pytest.mark.django_db
    def test_filters_narrow_the_people(self, admin_client, workspace, admin, lead, member, report_week):
        team = make_team(workspace, "Platform", leads=[lead], members=[member])
        project = make_project(workspace, admin, "OPS", members=[member])
        base = (report_week, report_week)

        by_team = admin_client.get(report_url(workspace, "plan-summary", *base, team=team.id))
        by_project = admin_client.get(report_url(workspace, "plan-summary", *base, project=project.id))

        assert ids(row["user"] for row in by_team.data["people"]) == ids([lead.id, member.id])
        assert ids(row["user"] for row in by_project.data["people"]) == ids([admin.id, member.id])

    @pytest.mark.django_db
    def test_guests_outsiders_anonymous_and_other_workspaces_are_refused(
        self, guest_client, outsider_client, admin_client, workspace, other_workspace, report_week
    ):
        url = report_url(workspace, "plan-summary", report_week, report_week)

        assert guest_client.get(url).status_code == 403
        assert outsider_client.get(url).status_code == 403
        assert APIClient().get(url).status_code in (401, 403)
        assert (
            admin_client.get(report_url(other_workspace, "plan-summary", report_week, report_week)).status_code == 403
        )

    @pytest.mark.django_db
    def test_range_is_required_and_capped_at_a_year(self, admin_client, workspace):
        day = next_monday()

        assert admin_client.get(cal(workspace, "reports/plan-summary/")).status_code == 400
        assert admin_client.get(cal(workspace, f"reports/plan-summary/?from={day}")).status_code == 400
        assert (
            admin_client.get(report_url(workspace, "plan-summary", day, day + timedelta(days=366))).status_code == 400
        )
        assert (
            admin_client.get(report_url(workspace, "plan-summary", day, day + timedelta(days=365))).status_code == 200
        )
        assert admin_client.get(report_url(workspace, "plan-summary", day, day, export="pdf")).status_code == 400

    @pytest.mark.django_db
    def test_csv_export_carries_the_numbers_and_the_notice(self, admin_client, workspace, member, report_week):
        response = admin_client.get(
            report_url(workspace, "plan-summary", report_week, report_week + timedelta(days=6), export="csv")
        )

        assert response.status_code == 200
        assert response["Content-Type"].startswith("text/csv")
        assert response["Content-Disposition"] == (
            f'attachment; filename="plan-summary_{report_week}_{report_week + timedelta(days=6)}.csv"'
        )
        table = parse_csv(response)
        header = table[0]
        assert header[:2] == ["Person", "Email"]
        assert "Onsite days" in header and "Planned hours" in header
        by_email = {row[1]: dict(zip(header, row)) for row in table[1:] if len(row) > 2}
        member_row = by_email[member.email]
        assert member_row["Onsite days"] == "1" and member_row["Planned hours"] == "8.00"
        assert by_email[""]["Person"] == "Total"
        assert table[-1] == [NOTICE]
        assert table[-2] == []

    @pytest.mark.django_db
    def test_csv_names_that_look_like_formulas_are_escaped(self, admin_client, workspace, member, report_week):
        User.objects.filter(id=member.id).update(display_name='=HYPERLINK("http://evil")')

        table = parse_csv(
            admin_client.get(report_url(workspace, "plan-summary", report_week, report_week, export="csv"))
        )

        names = [row[0] for row in table[1:] if row]
        assert '\'=HYPERLINK("http://evil")' in names
        assert not any(name.startswith("=") for name in names)

    @pytest.mark.django_db
    def test_csv_follows_the_same_scope_as_json(self, member_client, workspace, member, report_week):
        table = parse_csv(
            member_client.get(report_url(workspace, "plan-summary", report_week, report_week, export="csv"))
        )

        people = [row for row in table[1:] if len(row) > 2 and row[0] != "Total"]
        assert [row[1] for row in people] == [member.email]


@pytest.fixture
def last_week(workspace, admin, member, colleague, lead):
    """Past days where the plan and the logged time disagree in each way."""
    monday = today() - timedelta(days=today().weekday() + 7)
    plan(workspace, member, monday, "ONSITE", planned_start_time="09:00", planned_end_time="17:00")  # logged less
    plan(workspace, lead, monday, "REMOTE", planned_start_time="09:00", planned_end_time="17:00")  # logged nothing
    plan(workspace, colleague, monday, "OFF")  # logged on a day off
    log(workspace, member, monday, 6 * 3600)
    log(workspace, colleague, monday, 3600)
    log(workspace, admin, monday, 7200)  # logged with no plan at all
    return monday


@pytest.mark.contract
class TestPlannedVsLogged:
    @pytest.mark.django_db
    def test_totals_and_flags_per_person(self, admin_client, workspace, admin, member, colleague, lead, last_week):
        monday = last_week

        response = admin_client.get(report_url(workspace, "planned-vs-logged", monday, monday + timedelta(days=6)))

        assert response.status_code == 200
        assert response.data["notice"] == NOTICE
        rows = rows_by_user(response)
        member_row = rows[str(member.id)]
        assert member_row["planned_seconds"] == 8 * 3600 and member_row["logged_seconds"] == 6 * 3600
        assert member_row["difference_seconds"] == -2 * 3600
        assert member_row["flags"]["PLANNED_NOTHING_LOGGED"] == 0
        assert rows[str(lead.id)]["flags"]["PLANNED_NOTHING_LOGGED"] == 1
        assert rows[str(colleague.id)]["flags"]["LOGGED_ON_DAY_OFF"] == 1
        assert rows[str(admin.id)]["flags"]["LOGGED_NOT_PLANNED"] == 1
        assert response.data["totals"]["planned_seconds"] == 16 * 3600
        assert response.data["totals"]["logged_seconds"] == 6 * 3600 + 3600 + 7200
        assert response.data["flag_labels"]["PLANNED_NOTHING_LOGGED"]

    @pytest.mark.django_db
    def test_days_list_only_days_with_a_plan_or_logged_time(self, admin_client, workspace, member, last_week):
        monday = last_week

        row = rows_by_user(
            admin_client.get(
                report_url(workspace, "planned-vs-logged", monday, monday + timedelta(days=6), user=member.id)
            )
        )[str(member.id)]

        assert [day["date"] for day in row["days"]] == [monday.isoformat()]
        assert row["days"][0] == {
            "date": monday.isoformat(),
            "kind": "ONSITE",
            "planned_seconds": 8 * 3600,
            "logged_seconds": 6 * 3600,
            "flag": None,
        }

    @pytest.mark.django_db
    def test_future_plans_are_not_flagged_for_missing_logs(self, admin_client, workspace, member):
        tomorrow = today() + timedelta(days=1)
        plan(workspace, member, tomorrow, "ONSITE", planned_start_time="09:00", planned_end_time="17:00")

        row = rows_by_user(
            admin_client.get(report_url(workspace, "planned-vs-logged", tomorrow, tomorrow, user=member.id))
        )[str(member.id)]

        assert row["flags"]["PLANNED_NOTHING_LOGGED"] == 0 and row["planned_seconds"] == 8 * 3600

    @pytest.mark.django_db
    def test_holiday_time_counts_as_a_day_off_flag(self, admin_client, workspace, member):
        day = today() - timedelta(days=3)
        CalendarHoliday.objects.create(workspace=workspace, date=day, name="Founders Day")
        log(workspace, member, day, 1800)

        row = rows_by_user(admin_client.get(report_url(workspace, "planned-vs-logged", day, day, user=member.id)))[
            str(member.id)
        ]

        assert row["flags"]["LOGGED_ON_DAY_OFF"] == 1 and row["days"][0]["kind"] == "HOLIDAY"

    @pytest.mark.django_db
    def test_logged_time_is_cut_at_each_persons_own_midnight(self, admin_client, workspace, colleague):
        User.objects.filter(id=colleague.id).update(user_timezone="Asia/Tokyo")
        day = today() - timedelta(days=5)
        # 16:30 UTC the evening before is 01:30 on `day` in Tokyo.
        instant = datetime.combine(day - timedelta(days=1), datetime.min.time(), tzinfo=dt_timezone.utc) + timedelta(
            hours=16, minutes=30
        )
        TimeEntry.objects.create(
            workspace=workspace,
            user=colleague,
            started_at=instant,
            ended_at=instant + timedelta(seconds=1800),
            duration_seconds=1800,
        )

        row = rows_by_user(admin_client.get(report_url(workspace, "planned-vs-logged", day, day, user=colleague.id)))[
            str(colleague.id)
        ]

        assert row["logged_seconds"] == 1800

    @pytest.mark.django_db
    def test_scope_and_access_follow_the_calendar_rules(
        self, member_client, guest_client, workspace, member, colleague, last_week
    ):
        monday = last_week
        url = report_url(workspace, "planned-vs-logged", monday, monday + timedelta(days=6))

        own = member_client.get(url)

        assert own.status_code == 200 and [str(row["user"]) for row in own.data["people"]] == [str(member.id)]
        assert guest_client.get(url).status_code == 403

    @pytest.mark.django_db
    def test_range_is_capped_at_a_quarter(self, admin_client, workspace):
        day = today()

        assert (
            admin_client.get(report_url(workspace, "planned-vs-logged", day, day + timedelta(days=92))).status_code
            == 200
        )
        assert (
            admin_client.get(report_url(workspace, "planned-vs-logged", day, day + timedelta(days=93))).status_code
            == 400
        )

    @pytest.mark.django_db
    def test_csv_has_one_row_per_person_and_day_with_a_note(self, admin_client, workspace, lead, last_week):
        monday = last_week

        response = admin_client.get(
            report_url(workspace, "planned-vs-logged", monday, monday + timedelta(days=6), export="csv")
        )

        assert response.status_code == 200
        assert response["Content-Disposition"].endswith(f'planned-vs-logged_{monday}_{monday + timedelta(days=6)}.csv"')
        table = parse_csv(response)
        header = table[0]
        assert header == [
            "Date",
            "Person",
            "Email",
            "Plan",
            "Planned hours",
            "Logged hours",
            "Difference hours",
            "Note",
        ]
        rows = [dict(zip(header, row)) for row in table[1:] if len(row) == len(header)]
        assert len(rows) == 4
        lead_row = next(row for row in rows if row["Email"] == lead.email)
        assert (
            lead_row["Plan"] == "Remote" and lead_row["Planned hours"] == "8.00" and lead_row["Logged hours"] == "0.00"
        )
        assert lead_row["Difference hours"] == "-8.00"
        assert lead_row["Note"] == "Planned, nothing logged"
        assert table[-1] == [NOTICE]
