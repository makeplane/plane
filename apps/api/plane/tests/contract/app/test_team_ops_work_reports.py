# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# ruff: noqa: F401, F811
"""Team Ops work reports: writing, submitting, reading and the team board."""

from datetime import datetime, timedelta, timezone as dt_timezone

import pytest
from rest_framework.test import APIClient

from plane.db.models import Issue
from plane.team_ops.models import CalendarEntry, CalendarHoliday, TimeEntry, WorkReport
from plane.tests.contract.app.team_ops_support import (
    MEMBER,
    _no_broker,
    admin,
    admin_client,
    cal,
    colleague,
    guest,
    guest_client,
    lead,
    lead_client,
    make_project,
    make_team,
    member,
    member_client,
    other_workspace,
    outsider,
    outsider_client,
    today,
    url,
    workspace,
)


def reports(workspace, path=""):
    return url(workspace, f"work-reports/{path}")


def monday_of(day):
    return day - timedelta(days=day.weekday())


def put(client, workspace, kind, day, **body):
    return client.put(reports(workspace, f"{kind}/{day}/"), body, format="json")


def last_week_monday():
    return monday_of(today()) - timedelta(days=7)


@pytest.mark.contract
class TestWriteReports:
    @pytest.mark.django_db
    def test_a_draft_is_saved_then_submitted_once(self, member_client, workspace, member):
        day = today()

        draft = put(member_client, workspace, "DAILY", day, done="Fixed login")
        assert draft.status_code == 200 and draft.data["status"] == "DRAFT" and draft.data["submitted_at"] is None

        done = put(member_client, workspace, "DAILY", day, done="Fixed login", blockers="CI", submit=True)
        first = WorkReport.objects.get(user=member).submitted_at
        again = put(member_client, workspace, "DAILY", day, next_steps="Review", submit=True)

        assert done.data["status"] == "SUBMITTED" and done.data["blockers"] == "CI"
        assert again.data["next_steps"] == "Review" and again.data["done"] == "Fixed login"
        assert WorkReport.objects.get(user=member).submitted_at == first
        assert WorkReport.objects.filter(user=member).count() == 1

    @pytest.mark.django_db
    def test_submit_freezes_the_time_logged_in_the_period(self, member_client, workspace, member):
        day = today()
        started = datetime.combine(day, datetime.min.time(), tzinfo=dt_timezone.utc) + timedelta(hours=1)
        TimeEntry.objects.create(
            workspace=workspace,
            user=member,
            started_at=started,
            ended_at=started + timedelta(hours=2),
            duration_seconds=7200,
        )

        response = put(member_client, workspace, "DAILY", day, done="x", submit=True)

        assert response.data["logged_seconds"] == 7200

    @pytest.mark.django_db
    def test_weekly_reports_start_on_a_monday_and_not_in_the_future(self, member_client, workspace):
        assert put(member_client, workspace, "WEEKLY", monday_of(today()) + timedelta(days=1)).status_code == 400
        assert put(member_client, workspace, "WEEKLY", monday_of(today()) + timedelta(days=7)).status_code == 400
        assert put(member_client, workspace, "DAILY", today() + timedelta(days=1)).status_code == 400
        assert put(member_client, workspace, "WEEKLY", monday_of(today()), done="ok").status_code == 200

    @pytest.mark.django_db
    @pytest.mark.parametrize("kind, day", [("MONTHLY", "2026-01-05"), ("DAILY", "nope"), ("DAILY", "1999-01-01")])
    def test_invalid_kind_or_date_is_rejected(self, member_client, workspace, kind, day):
        assert put(member_client, workspace, kind, day).status_code == 400

    @pytest.mark.django_db
    def test_guests_outsiders_and_anonymous_cannot_write(self, guest_client, outsider_client, workspace):
        for client in (guest_client, outsider_client):
            assert put(client, workspace, "DAILY", today()).status_code == 403
        assert put(APIClient(), workspace, "DAILY", today()).status_code in (401, 403)
        assert not WorkReport.objects.exists()

    @pytest.mark.django_db
    def test_a_person_cannot_write_for_someone_else(self, admin_client, workspace, admin, member):
        response = admin_client.put(
            reports(workspace, f"DAILY/{today()}/"), {"done": "x", "user": str(member.id)}, format="json"
        )

        assert response.status_code == 200
        assert WorkReport.objects.get().user == admin and not WorkReport.objects.filter(user=member).exists()


@pytest.mark.contract
class TestReadReports:
    @pytest.mark.django_db
    def test_detail_returns_an_empty_report_with_time_tracking_suggestions(
        self, member_client, workspace, admin, member
    ):
        project = make_project(workspace, admin, "OPS", members=[member])
        issue = Issue.objects.create(name="Fix login", project=project, workspace=workspace)
        started = datetime.combine(today(), datetime.min.time(), tzinfo=dt_timezone.utc) + timedelta(hours=2)
        TimeEntry.objects.create(
            workspace=workspace,
            project=project,
            issue=issue,
            user=member,
            started_at=started,
            ended_at=started + timedelta(hours=3),
            duration_seconds=10800,
        )

        response = member_client.get(reports(workspace, f"DAILY/{today()}/"))

        assert response.status_code == 200 and response.data["status"] is None and response.data["done"] == ""
        assert response.data["suggestions"][0]["key"] == f"OPS-{issue.sequence_id}"
        assert response.data["suggestions"][0]["seconds"] == 10800

    @pytest.mark.django_db
    def test_members_read_only_their_own_and_leads_their_team(
        self, member_client, lead_client, workspace, member, colleague, lead
    ):
        make_team(workspace, "Platform", leads=[lead], members=[member])
        put(APIClientFor(member), workspace, "DAILY", today(), done="mine")
        put(APIClientFor(colleague), workspace, "DAILY", today(), done="theirs")

        assert member_client.get(reports(workspace, f"DAILY/{today()}/?user={colleague.id}")).status_code == 403
        assert lead_client.get(reports(workspace, f"DAILY/{today()}/?user={member.id}")).data["done"] == "mine"
        assert lead_client.get(reports(workspace, f"DAILY/{today()}/?user={colleague.id}")).status_code == 403

    @pytest.mark.django_db
    def test_list_returns_the_reports_in_a_range(self, member_client, workspace):
        for offset in (1, 2, 40):
            put(member_client, workspace, "DAILY", today() - timedelta(days=offset), done=str(offset))

        response = member_client.get(reports(workspace, f"?kind=DAILY&from={today() - timedelta(days=5)}&to={today()}"))

        assert sorted(r["done"] for r in response.data["results"]) == ["1", "2"]

    @pytest.mark.django_db
    def test_other_workspaces_are_closed(self, admin_client, other_workspace):
        assert admin_client.get(reports(other_workspace, f"DAILY/{today()}/")).status_code == 403


def APIClientFor(user):
    from plane.tests.contract.app.team_ops_support import make_client

    return make_client(user)


@pytest.mark.contract
class TestBoard:
    @pytest.mark.django_db
    def test_missing_submitted_draft_and_not_expected(self, admin_client, workspace, admin, member, colleague, lead):
        day = today() - timedelta(days=3)  # a past day; make it a weekday for the policy
        while day.isoweekday() > 5:
            day -= timedelta(days=1)
        WorkReport.objects.create(
            workspace=workspace,
            user=member,
            kind="DAILY",
            period_start=day,
            status="SUBMITTED",
            submitted_at=datetime.now(dt_timezone.utc),
        )
        WorkReport.objects.create(workspace=workspace, user=colleague, kind="DAILY", period_start=day)
        CalendarEntry.objects.create(
            workspace=workspace, user=lead, work_date=day, work_mode="LEAVE", leave_type="SICK", source="MANUAL"
        )

        response = admin_client.get(reports(workspace, f"board/?kind=DAILY&from={day}&to={day}"))

        status_of = {str(row["user"]): row["periods"][0]["status"] for row in response.data["people"]}
        assert status_of[str(member.id)] == "SUBMITTED"
        assert status_of[str(colleague.id)] == "DRAFT"
        assert status_of[str(lead.id)] == "NOT_EXPECTED"
        assert status_of[str(admin.id)] == "MISSING"
        assert {r["missing"] for r in response.data["people"] if r["user"] == admin.id} == {1}

    @pytest.mark.django_db
    def test_weekends_holidays_and_the_future_are_not_expected(self, admin_client, workspace, admin):
        saturday = today() - timedelta(days=(today().weekday() + 2) % 7 or 7)
        while saturday.isoweekday() != 6:
            saturday -= timedelta(days=1)
        holiday = saturday - timedelta(days=2)
        CalendarHoliday.objects.create(workspace=workspace, date=holiday, name="Day")

        past = admin_client.get(reports(workspace, f"board/?kind=DAILY&from={holiday}&to={saturday}&user={admin.id}"))
        tomorrow = today() + timedelta(days=1)
        future = admin_client.get(
            reports(
                workspace,
                f"board/?kind=DAILY&from={tomorrow}&to={tomorrow + timedelta(days=1)}&user={admin.id}",
            )
        )

        statuses = {c["start"]: c["status"] for c in past.data["people"][0]["periods"]}
        assert statuses[holiday.isoformat()] == "NOT_EXPECTED" and statuses[saturday.isoformat()] == "NOT_EXPECTED"
        assert {c["status"] for c in future.data["people"][0]["periods"]} == {"NOT_EXPECTED"}

    @pytest.mark.django_db
    def test_weekly_board_uses_mondays(self, admin_client, workspace, admin):
        monday = last_week_monday()
        WorkReport.objects.create(
            workspace=workspace,
            user=admin,
            kind="WEEKLY",
            period_start=monday,
            status="SUBMITTED",
            submitted_at=datetime.now(dt_timezone.utc),
        )

        response = admin_client.get(
            reports(
                workspace,
                f"board/?kind=WEEKLY&from={monday + timedelta(days=2)}&to={monday + timedelta(days=9)}&user={admin.id}",
            )
        )

        assert response.data["periods"] == [monday.isoformat(), (monday + timedelta(days=7)).isoformat()]
        assert response.data["people"][0]["periods"][0]["status"] == "SUBMITTED"

    @pytest.mark.django_db
    def test_access_scope_and_limits(
        self, member_client, lead_client, admin_client, guest_client, workspace, lead, member
    ):
        make_team(workspace, "Platform", leads=[lead], members=[member])
        day = today()
        path = f"board/?kind=DAILY&from={day}&to={day}"

        assert member_client.get(reports(workspace, path)).status_code == 403
        assert guest_client.get(reports(workspace, path)).status_code == 403
        assert sorted(str(r["user"]) for r in lead_client.get(reports(workspace, path)).data["people"]) == sorted(
            [str(lead.id), str(member.id)]
        )
        assert (
            admin_client.get(
                reports(workspace, f"board/?kind=DAILY&from={day}&to={day + timedelta(days=62)}")
            ).status_code
            == 400
        )
        assert admin_client.get(reports(workspace, "board/?kind=DAILY")).status_code == 400
        assert admin_client.get(reports(workspace, f"board/?kind=X&from={day}&to={day}")).status_code == 400
