# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# ruff: noqa: F401, F811
"""Team Ops work calendar: the team view and the per-day detail."""

from datetime import datetime, timedelta, timezone as dt_timezone
from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import ProjectMember, User, WorkspaceMember
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
    make_client,
    make_project,
    make_team,
    make_user,
    make_workspace,
    member,
    member_client,
    next_monday,
    other_workspace,
    outsider,
    outsider_client,
    today,
    workspace,
)


def team_url(workspace, start, end, **filters):
    query = "&".join(f"{key}={value}" for key, value in {"from": start, "to": end, **filters}.items())
    return cal(workspace, f"team/?{query}")


def day_url(workspace, day, **filters):
    query = "&".join(f"{key}={value}" for key, value in filters.items())
    return cal(workspace, f"team/day/{day}/" + (f"?{query}" if query else ""))


def plan(workspace, user, day, mode="ONSITE", **extra):
    return CalendarEntry.objects.create(
        workspace=workspace, user=user, work_date=day, work_mode=mode, source="MANUAL", **extra
    )


def log(workspace, user, started_at, seconds=3600, project=None):
    return TimeEntry.objects.create(
        workspace=workspace,
        project=project,
        user=user,
        started_at=started_at,
        ended_at=started_at + timedelta(seconds=seconds),
        duration_seconds=seconds,
    )


def set_policy(workspace, **fields):
    row, _ = CalendarSettings.objects.get_or_create(workspace=workspace)
    for name, value in fields.items():
        setattr(row, name, value)
    row.save()


def ids(values):
    return sorted(str(value) for value in values)


@pytest.fixture
def team_week(workspace, admin, member, colleague, lead):
    """A Monday with a mix of plans, a holiday on Tuesday and nothing on the weekend."""
    monday = next_monday()
    plan(workspace, member, monday, "ONSITE", planned_start_time="09:00", planned_end_time="17:00")
    plan(workspace, colleague, monday, "REMOTE")
    plan(workspace, lead, monday, "LEAVE", leave_type="SICK")
    CalendarHoliday.objects.create(workspace=workspace, date=monday + timedelta(days=1), name="Founders Day")
    return monday


@pytest.mark.contract
class TestTeamSummary:
    @pytest.mark.django_db
    def test_admin_sees_every_calendar_user_and_their_days(
        self, admin_client, workspace, admin, member, colleague, lead, guest, team_week
    ):
        monday = team_week

        response = admin_client.get(team_url(workspace, monday, monday + timedelta(days=6)))

        assert response.status_code == status.HTTP_200_OK
        assert ids(response.data["users"]) == ids([admin.id, member.id, colleague.id, lead.id])
        assert guest.id not in response.data["users"]
        first = response.data["days"][0]
        assert first["date"] == monday.isoformat()
        assert first["counts"] == {
            "ONSITE": 1,
            "REMOTE": 1,
            "OFF": 0,
            "LEAVE": 1,
            "HOLIDAY": 0,
            "UNPLANNED": 1,
        }
        assert ids(first["users"]["ONSITE"]) == ids([member.id])
        assert ids(first["users"]["UNPLANNED"]) == ids([admin.id])
        assert len(response.data["days"]) == 7

    @pytest.mark.django_db
    def test_holidays_and_weekends_are_not_unplanned(self, admin_client, workspace, team_week):
        monday = team_week

        response = admin_client.get(team_url(workspace, monday, monday + timedelta(days=6)))

        tuesday, saturday = response.data["days"][1], response.data["days"][5]
        assert tuesday["holiday"] == "Founders Day"
        assert tuesday["counts"]["HOLIDAY"] == 4 and tuesday["counts"]["UNPLANNED"] == 0
        assert sum(saturday["counts"].values()) == 0
        assert response.data["totals"]["UNPLANNED"] == 1 + 3 * 4  # Monday's admin, Wednesday to Friday for all four

    @pytest.mark.django_db
    def test_a_person_working_a_holiday_counts_as_their_mode(self, admin_client, workspace, member, team_week):
        tuesday = team_week + timedelta(days=1)
        plan(workspace, member, tuesday, "REMOTE")

        day = admin_client.get(team_url(workspace, tuesday, tuesday)).data["days"][0]

        assert day["counts"]["REMOTE"] == 1 and day["counts"]["HOLIDAY"] == 3

    @pytest.mark.django_db
    def test_template_days_count_like_any_other(self, admin_client, workspace, member):
        monday = next_monday()
        CalendarEntry.objects.create(
            workspace=workspace, user=member, work_date=monday, work_mode="REMOTE", source="TEMPLATE"
        )

        day = admin_client.get(team_url(workspace, monday, monday)).data["days"][0]

        assert day["counts"]["REMOTE"] == 1

    @pytest.mark.django_db
    def test_working_weekdays_policy_decides_unplanned(self, admin_client, workspace):
        saturday = next_monday() + timedelta(days=5)
        assert admin_client.get(team_url(workspace, saturday, saturday)).data["days"][0]["counts"]["UNPLANNED"] == 0

        set_policy(workspace, working_weekdays=[1, 2, 3, 4, 5, 6])

        assert admin_client.get(team_url(workspace, saturday, saturday)).data["days"][0]["counts"]["UNPLANNED"] == 4

    @pytest.mark.django_db
    def test_people_who_left_the_workspace_disappear(self, admin_client, workspace, member, team_week):
        WorkspaceMember.objects.filter(workspace=workspace, member=member).update(is_active=False)

        response = admin_client.get(team_url(workspace, team_week, team_week))

        assert member.id not in response.data["users"]
        assert response.data["days"][0]["counts"]["ONSITE"] == 0

    @pytest.mark.django_db
    def test_other_workspaces_never_leak_in(self, admin_client, workspace, other_workspace, admin, team_week):
        join(other_workspace, admin, MEMBER)
        plan(other_workspace, admin, team_week, "OFF")
        stranger = make_user("stranger")
        join(other_workspace, stranger, MEMBER)
        plan(other_workspace, stranger, team_week, "OFF")

        response = admin_client.get(team_url(workspace, team_week, team_week))

        assert stranger.id not in response.data["users"]
        assert response.data["days"][0]["counts"]["OFF"] == 0

    @pytest.mark.django_db
    def test_people_are_ordered_by_name(self, admin_client, workspace, admin, member, colleague, lead):
        User.objects.filter(id=admin.id).update(display_name="Zed")
        User.objects.filter(id=member.id).update(display_name="adam")
        User.objects.filter(id=colleague.id).update(display_name="Bea")
        User.objects.filter(id=lead.id).update(display_name="Cy")
        day = next_monday()

        response = admin_client.get(team_url(workspace, day, day))

        assert [str(user) for user in response.data["users"]] == [
            str(member.id),
            str(colleague.id),
            str(lead.id),
            str(admin.id),
        ]


@pytest.mark.contract
class TestTeamViewAccess:
    @pytest.mark.django_db
    def test_members_guests_outsiders_and_anonymous_are_refused_by_default(
        self, member_client, guest_client, outsider_client, workspace, team_week
    ):
        url = team_url(workspace, team_week, team_week)

        for client in (member_client, guest_client, outsider_client):
            assert client.get(url).status_code == status.HTTP_403_FORBIDDEN
        assert APIClient().get(url).status_code in (401, 403)
        assert member_client.get(day_url(workspace, team_week)).status_code == 403

    @pytest.mark.django_db
    def test_a_lead_sees_only_their_team(self, lead_client, workspace, lead, member, colleague, team_week):
        make_team(workspace, "Platform", leads=[lead], members=[member])

        response = lead_client.get(team_url(workspace, team_week, team_week))

        assert response.status_code == 200
        assert ids(response.data["users"]) == ids([lead.id, member.id])
        assert response.data["days"][0]["counts"]["REMOTE"] == 0  # the colleague is outside the team

    @pytest.mark.django_db
    def test_a_lead_cannot_widen_the_view_with_filters(
        self, lead_client, workspace, admin, lead, member, colleague, team_week
    ):
        make_team(workspace, "Platform", leads=[lead], members=[member])
        other = make_team(workspace, "Design", leads=[colleague], members=[admin])

        by_user = lead_client.get(team_url(workspace, team_week, team_week, user=colleague.id))
        by_team = lead_client.get(team_url(workspace, team_week, team_week, team=other.id))

        assert by_user.status_code == 200 and by_user.data["users"] == []
        assert by_team.status_code == 200 and by_team.data["users"] == []

    @pytest.mark.django_db
    def test_a_member_who_leads_no_team_is_refused_even_if_someone_else_leads(
        self, member_client, workspace, lead, member, team_week
    ):
        make_team(workspace, "Platform", leads=[lead], members=[member])

        assert member_client.get(team_url(workspace, team_week, team_week)).status_code == 403

    @pytest.mark.django_db
    def test_policy_admins_only_refuses_leads(self, lead_client, workspace, lead, team_week):
        make_team(workspace, "Platform", leads=[lead])
        set_policy(workspace, team_view_access="ADMINS")

        assert lead_client.get(team_url(workspace, team_week, team_week)).status_code == 403

    @pytest.mark.django_db
    def test_policy_all_members_opens_the_view_to_everyone(
        self, member_client, guest_client, workspace, admin, member, colleague, lead, team_week
    ):
        set_policy(workspace, team_view_access="ALL_MEMBERS")

        response = member_client.get(team_url(workspace, team_week, team_week))

        assert response.status_code == 200
        assert len(response.data["users"]) == 4
        assert guest_client.get(team_url(workspace, team_week, team_week)).status_code == 403

    @pytest.mark.django_db
    def test_an_admin_of_another_workspace_gets_nothing(self, admin_client, other_workspace, team_week):
        assert admin_client.get(team_url(other_workspace, team_week, team_week)).status_code == 403


@pytest.mark.contract
class TestTeamFilters:
    @pytest.mark.django_db
    def test_filter_by_team(self, admin_client, workspace, lead, member, team_week):
        team = make_team(workspace, "Platform", leads=[lead], members=[member])

        response = admin_client.get(team_url(workspace, team_week, team_week, team=team.id))

        assert ids(response.data["users"]) == ids([lead.id, member.id])
        assert response.data["days"][0]["counts"]["REMOTE"] == 0

    @pytest.mark.django_db
    def test_filter_by_project_uses_project_membership(self, admin_client, workspace, admin, member, team_week):
        project = make_project(workspace, admin, "OPS", members=[member])
        inactive = make_user("inactive")
        join(workspace, inactive, MEMBER)
        left = ProjectMember.objects.create(
            project=project, member=inactive, workspace=workspace, role=MEMBER, is_active=False
        )

        response = admin_client.get(team_url(workspace, team_week, team_week, project=project.id))

        assert ids(response.data["users"]) == ids([admin.id, member.id])
        assert left.member_id not in response.data["users"]

    @pytest.mark.django_db
    def test_filter_by_person(self, admin_client, workspace, member, team_week):
        response = admin_client.get(team_url(workspace, team_week, team_week, user=member.id))

        assert ids(response.data["users"]) == ids([member.id])
        assert response.data["days"][0]["counts"]["ONSITE"] == 1

    @pytest.mark.django_db
    def test_filter_by_mode_keeps_only_people_with_that_mode_and_counts_only_it(
        self, admin_client, workspace, colleague, team_week
    ):
        response = admin_client.get(team_url(workspace, team_week, team_week + timedelta(days=6), mode="remote"))

        assert ids(response.data["users"]) == ids([colleague.id])
        assert response.data["totals"]["REMOTE"] == 1 and response.data["totals"]["ONSITE"] == 0
        assert response.data["days"][0]["counts"]["UNPLANNED"] == 0

    @pytest.mark.django_db
    def test_filter_by_unplanned_and_holiday(self, admin_client, workspace, admin, team_week):
        unplanned = admin_client.get(team_url(workspace, team_week, team_week, mode="UNPLANNED"))
        holiday = admin_client.get(team_url(workspace, team_week, team_week + timedelta(days=1), mode="HOLIDAY"))

        assert ids(unplanned.data["users"]) == ids([admin.id])
        assert holiday.data["totals"]["HOLIDAY"] == 4

    @pytest.mark.django_db
    def test_filters_combine(self, admin_client, workspace, lead, member, team_week):
        team = make_team(workspace, "Platform", leads=[lead], members=[member])

        response = admin_client.get(team_url(workspace, team_week, team_week, team=team.id, mode="ONSITE"))

        assert ids(response.data["users"]) == ids([member.id])

    @pytest.mark.django_db
    def test_unknown_or_foreign_team_and_project_are_not_found(
        self, admin_client, workspace, other_workspace, admin, team_week
    ):
        foreign_team = make_team(other_workspace, "Foreign")
        foreign_project = make_project(other_workspace, make_user("owner2"), "FOR")
        none = "00000000-0000-0000-0000-000000000000"

        assert admin_client.get(team_url(workspace, team_week, team_week, team=foreign_team.id)).status_code == 404
        assert admin_client.get(team_url(workspace, team_week, team_week, team=none)).status_code == 404
        assert (
            admin_client.get(team_url(workspace, team_week, team_week, project=foreign_project.id)).status_code == 404
        )

    @pytest.mark.django_db
    @pytest.mark.parametrize("extra", [{"mode": "HYBRID"}, {"team": "nope"}, {"project": "nope"}, {"user": "nope"}])
    def test_invalid_filters_are_rejected(self, admin_client, workspace, team_week, extra):
        assert admin_client.get(team_url(workspace, team_week, team_week, **extra)).status_code == 400

    @pytest.mark.django_db
    def test_range_is_required_and_capped(self, admin_client, workspace):
        day = next_monday()

        assert admin_client.get(cal(workspace, "team/")).status_code == 400
        assert admin_client.get(cal(workspace, f"team/?from={day}")).status_code == 400
        assert admin_client.get(team_url(workspace, day, day - timedelta(days=1))).status_code == 400
        assert admin_client.get(team_url(workspace, day, day + timedelta(days=62))).status_code == 400
        assert admin_client.get(team_url(workspace, day, "tomorrow")).status_code == 400
        ok = admin_client.get(team_url(workspace, day, day + timedelta(days=61)))
        assert ok.status_code == 200 and len(ok.data["days"]) == 62


@pytest.mark.contract
class TestTeamDayDetail:
    @pytest.mark.django_db
    def test_rows_show_the_plan_next_to_what_was_logged(
        self, admin_client, workspace, admin, member, colleague, lead, team_week
    ):
        monday = team_week
        project = make_project(workspace, admin, "OPS", members=[member])
        other_project = make_project(workspace, admin, "DOC", members=[member])
        morning = datetime.combine(monday, datetime.min.time(), tzinfo=dt_timezone.utc) + timedelta(hours=9)
        log(workspace, member, morning, 3600, project)
        log(workspace, member, morning + timedelta(hours=2), 7200, project)
        log(workspace, member, morning + timedelta(hours=5), 5400, other_project)
        log(workspace, member, morning + timedelta(hours=7), 600)  # no work item, no project

        response = admin_client.get(day_url(workspace, monday))

        assert response.status_code == 200
        assert response.data["date"] == monday
        rows = {str(row["user"]): row for row in response.data["rows"]}
        assert set(rows) == {str(admin.id), str(member.id), str(colleague.id), str(lead.id)}
        row = rows[str(member.id)]
        assert row["mode"] == "ONSITE" and row["kind"] == "ONSITE"
        assert (row["planned_start_time"], row["planned_end_time"]) == ("09:00", "17:00")
        assert row["planned_seconds"] == 8 * 3600
        assert row["logged_seconds"] == 3600 + 7200 + 5400 + 600
        assert row["top_project"]["identifier"] == "OPS" and row["top_project"]["seconds"] == 10800
        assert rows[str(colleague.id)]["logged_seconds"] == 0 and rows[str(colleague.id)]["top_project"] is None
        assert rows[str(lead.id)]["leave_type"] == "SICK"
        assert rows[str(admin.id)]["kind"] == "UNPLANNED"

    @pytest.mark.django_db
    def test_logged_time_is_cut_at_each_persons_own_midnight(self, admin_client, workspace, colleague, member):
        User.objects.filter(id=colleague.id).update(user_timezone="Asia/Tokyo")
        day = next_monday()
        previous = day - timedelta(days=1)
        # 16:30 UTC is 01:30 the next morning in Tokyo, but still the previous evening in UTC.
        instant = datetime.combine(previous, datetime.min.time(), tzinfo=dt_timezone.utc) + timedelta(
            hours=16, minutes=30
        )
        log(workspace, colleague, instant, 1800)
        log(workspace, member, instant, 1200)

        on_day = {str(row["user"]): row for row in admin_client.get(day_url(workspace, day)).data["rows"]}
        on_previous = {str(row["user"]): row for row in admin_client.get(day_url(workspace, previous)).data["rows"]}

        assert on_day[str(colleague.id)]["logged_seconds"] == 1800
        assert on_day[str(member.id)]["logged_seconds"] == 0
        assert on_previous[str(colleague.id)]["logged_seconds"] == 0
        assert on_previous[str(member.id)]["logged_seconds"] == 1200

    @pytest.mark.django_db
    def test_time_logged_in_other_workspaces_is_not_counted(self, admin_client, workspace, other_workspace, member):
        join(other_workspace, member, MEMBER)
        day = next_monday()
        log(
            other_workspace,
            member,
            datetime.combine(day, datetime.min.time(), tzinfo=dt_timezone.utc) + timedelta(hours=9),
            3600,
        )

        rows = {str(row["user"]): row for row in admin_client.get(day_url(workspace, day)).data["rows"]}

        assert rows[str(member.id)]["logged_seconds"] == 0

    @pytest.mark.django_db
    def test_filters_and_scope_apply_to_the_detail_too(
        self, admin_client, lead_client, workspace, lead, member, colleague, team_week
    ):
        make_team(workspace, "Platform", leads=[lead], members=[member])

        remote = admin_client.get(day_url(workspace, team_week, mode="REMOTE"))
        lead_view = lead_client.get(day_url(workspace, team_week))

        assert [str(row["user"]) for row in remote.data["rows"]] == [str(colleague.id)]
        assert ids(row["user"] for row in lead_view.data["rows"]) == ids([lead.id, member.id])

    @pytest.mark.django_db
    def test_a_holiday_is_named_and_rows_carry_its_kind(self, admin_client, workspace, team_week):
        tuesday = team_week + timedelta(days=1)

        response = admin_client.get(day_url(workspace, tuesday))

        assert response.data["holiday"] == "Founders Day"
        assert {row["kind"] for row in response.data["rows"]} == {"HOLIDAY"}

    @pytest.mark.django_db
    def test_access_and_validation(self, member_client, guest_client, admin_client, workspace, team_week):
        assert member_client.get(day_url(workspace, team_week)).status_code == 403
        assert guest_client.get(day_url(workspace, team_week)).status_code == 403
        assert admin_client.get(day_url(workspace, "2027-02-30")).status_code == 400
        assert admin_client.get(day_url(workspace, "1999-01-01")).status_code == 400
        assert admin_client.get(day_url(workspace, team_week, mode="NOPE")).status_code == 400
