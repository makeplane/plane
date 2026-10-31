# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# ruff: noqa: F401, F811
"""Team Ops management dashboard."""

from datetime import datetime, timedelta, timezone as dt_timezone

import pytest
from rest_framework.test import APIClient

from plane.team_ops.models import CalendarEntry, TimeEntry, WorkReport
from plane.tests.contract.app.team_ops_support import (
    _no_broker,
    admin,
    admin_client,
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


def dash(workspace, start, end, **filters):
    query = "&".join(f"{k}={v}" for k, v in {"from": start, "to": end, **filters}.items())
    return url(workspace, f"dashboard/?{query}")


@pytest.fixture
def busy_day(workspace, admin, member, colleague):
    """A past weekday where the plan, the logged time and the reports all have something to say."""
    day = today() - timedelta(days=2)
    while day.isoweekday() > 5:
        day -= timedelta(days=1)
    project = make_project(workspace, admin, "OPS", members=[member])
    CalendarEntry.objects.create(
        workspace=workspace,
        user=member,
        work_date=day,
        work_mode="ONSITE",
        source="MANUAL",
        planned_start_time="09:00",
        planned_end_time="17:00",
    )
    CalendarEntry.objects.create(
        workspace=workspace, user=colleague, work_date=day, work_mode="REMOTE", source="MANUAL"
    )
    started = datetime.combine(day, datetime.min.time(), tzinfo=dt_timezone.utc) + timedelta(hours=9)
    TimeEntry.objects.create(
        workspace=workspace,
        project=project,
        user=member,
        started_at=started,
        ended_at=started + timedelta(hours=6),
        duration_seconds=6 * 3600,
    )
    WorkReport.objects.create(
        workspace=workspace,
        user=member,
        kind="DAILY",
        period_start=day,
        status="SUBMITTED",
        submitted_at=datetime.now(dt_timezone.utc),
    )
    return day


@pytest.mark.contract
class TestDashboard:
    @pytest.mark.django_db
    def test_it_combines_plan_time_and_reports(self, admin_client, workspace, member, busy_day):
        response = admin_client.get(dash(workspace, busy_day, busy_day))

        assert response.status_code == 200
        data = response.data
        assert data["people_count"] == 4
        assert data["plan"]["counts"]["ONSITE"] == 1 and data["plan"]["counts"]["REMOTE"] == 1
        assert data["plan"]["planned_seconds"] == 8 * 3600
        assert data["time"]["logged_seconds"] == 6 * 3600 and data["time"]["planned_seconds"] == 8 * 3600
        assert data["reports"] == {"SUBMITTED": 1, "DRAFT": 0, "MISSING": 3}
        assert data["projects"][0]["identifier"] == "OPS" and data["projects"][0]["seconds"] == 6 * 3600
        row = next(r for r in data["people"] if r["user"] == member.id)
        assert row["logged_seconds"] == 6 * 3600 and row["missing_reports"] == 0 and row["plan_counts"]["ONSITE"] == 1

    @pytest.mark.django_db
    def test_today_shows_who_is_where_now(self, admin_client, workspace, member, busy_day):
        CalendarEntry.objects.create(
            workspace=workspace, user=member, work_date=today(), work_mode="LEAVE", leave_type="SICK", source="MANUAL"
        )

        data = admin_client.get(dash(workspace, busy_day, busy_day)).data

        assert data["today"]["date"] == today().isoformat()
        assert data["today"]["counts"]["LEAVE"] == 1 and member.id in data["today"]["users"]["LEAVE"]

    @pytest.mark.django_db
    def test_scope_follows_the_team_view_rules(
        self, lead_client, member_client, guest_client, outsider_client, workspace, lead, member, busy_day
    ):
        make_team(workspace, "Platform", leads=[lead], members=[member])

        assert lead_client.get(dash(workspace, busy_day, busy_day)).data["people_count"] == 2
        for client in (member_client, guest_client, outsider_client):
            assert client.get(dash(workspace, busy_day, busy_day)).status_code == 403
        assert APIClient().get(dash(workspace, busy_day, busy_day)).status_code in (401, 403)

    @pytest.mark.django_db
    def test_filters_range_and_other_workspaces(self, admin_client, workspace, other_workspace, member, busy_day):
        assert admin_client.get(dash(workspace, busy_day, busy_day, user=member.id)).data["people_count"] == 1
        assert admin_client.get(url(workspace, "dashboard/")).status_code == 400
        assert admin_client.get(dash(workspace, busy_day, busy_day + timedelta(days=62))).status_code == 400
        assert admin_client.get(dash(other_workspace, busy_day, busy_day)).status_code == 403
