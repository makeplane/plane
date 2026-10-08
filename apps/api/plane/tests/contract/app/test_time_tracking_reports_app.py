# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Filters, summary, report and timesheet: the numbers must agree with each other."""

from datetime import date, datetime, timedelta, timezone as dt_timezone

import pytest
from rest_framework import status

from plane.db.models import CycleIssue, IssueAssignee, IssueLabel, Label, ModuleIssue
from plane.db.models.cycle import Cycle
from plane.db.models.module import Module
from plane.tests.factories_time_tracking import TimeEntryFactory, build_world, client_for

MON = date(2026, 9, 28)  # a Monday


@pytest.fixture
def world(db):
    world = build_world()
    w = world
    bug = Label.objects.create(name="bug", project=w.web, workspace=w.workspace)
    ui = Label.objects.create(name="ui", project=w.web, workspace=w.workspace)
    IssueLabel.objects.create(issue=w.web_1, label=bug, project=w.web, workspace=w.workspace)
    IssueLabel.objects.create(issue=w.web_1, label=ui, project=w.web, workspace=w.workspace)
    # a soft-deleted link must be ignored everywhere
    IssueLabel.objects.create(
        issue=w.web_2,
        label=bug,
        project=w.web,
        workspace=w.workspace,
        deleted_at=datetime(2026, 9, 1, tzinfo=dt_timezone.utc),
    )
    IssueAssignee.objects.create(issue=w.web_1, assignee=w.ben, project=w.web, workspace=w.workspace)
    cycle = Cycle.objects.create(name="Sprint 1", project=w.web, workspace=w.workspace, owned_by=w.ana)
    CycleIssue.objects.create(issue=w.web_1, cycle=cycle, project=w.web, workspace=w.workspace)
    module = Module.objects.create(name="Auth", project=w.web, workspace=w.workspace)
    ModuleIssue.objects.create(issue=w.web_2, module=module, project=w.web, workspace=w.workspace)
    w.web_2.priority = "high"
    w.web_2.save()

    def entry(user, issue, day, seconds, billable=False, **kw):
        return TimeEntryFactory(
            project=issue.project if issue else w.web,
            user=user,
            issue=issue,
            spent_on=day,
            duration_seconds=seconds,
            is_billable=billable,
            **kw,
        )

    w.extra = {
        "labels": (bug, ui),
        "cycle": cycle,
        "module": module,
        "entries": [
            entry(w.ben, w.web_1, MON, 3600, billable=True, description="Login form"),
            entry(w.ben, w.web_2, MON + timedelta(days=1), 1800),
            entry(w.pia, w.web_1, MON + timedelta(days=1), 5400, billable=True),
            entry(w.pia, None, MON + timedelta(days=3), 900),
            entry(w.ana, w.sec_1, MON + timedelta(days=2), 7200),
            entry(w.ben, None, MON + timedelta(days=8), 600),  # the week after
        ],
        "running": TimeEntryFactory.running(project=w.web, user=w.pia, issue=w.web_2),
    }
    # keep the running timer inside the fixture week (it would otherwise be dated today)
    w.extra["running"].spent_on = MON + timedelta(days=4)
    w.extra["running"].save(disable_auto_set_user=True)
    return world


WEEK = {"date_from": str(MON), "date_to": str(MON + timedelta(days=6))}


def api(world, path):
    return f"/api/workspaces/{world.slug}/time-entries/{path}"


def list_total(client, world, **params):
    rows = client.get(api(world, ""), {"per_page": 200, "include_running": "false", **params}).data["results"]
    return sum(r["duration_seconds"] for r in rows), {r["id"] for r in rows}


@pytest.mark.contract
class TestFilters:
    @pytest.mark.parametrize(
        "params,expected",
        [
            (WEEK, 3600 + 1800 + 5400 + 900),
            ({"user_ids": "{ben}"}, 3600 + 1800 + 600),
            ({"logged_by_ids": "{pia}"}, 5400 + 900),
            ({"issue_ids": "{web_1}"}, 3600 + 5400),
            ({"has_issue": "false"}, 900 + 600),
            ({"has_issue": "true"}, 3600 + 1800 + 5400),
            ({"label_ids": "{bug},{ui}"}, 3600 + 5400),  # no duplicates for two matching labels
            ({"state_groups": "backlog"}, 3600 + 1800 + 5400),
            ({"cycle_ids": "{cycle}"}, 3600 + 5400),
            ({"module_ids": "{module}"}, 1800),
            ({"priorities": "high"}, 1800),
            ({"assignee_ids": "{ben}"}, 3600 + 5400),
            ({"is_billable": "true"}, 3600 + 5400),
            ({"source": "manual"}, 3600 + 1800 + 5400 + 900 + 600),
            ({"min_duration": "1800", "max_duration": "3600"}, 3600 + 1800),
            ({"search": "login"}, 3600 + 5400),  # description and work item title
            ({"search": "WEB-{web_2_seq}"}, 1800),
            ({**WEEK, "user_ids": "{pia}", "is_billable": "false"}, 900),
        ],
    )
    def test_each_filter(self, world, params, expected):
        ids = {
            "ben": world.ben.id,
            "pia": world.pia.id,
            "web_1": world.web_1.id,
            "bug": world.extra["labels"][0].id,
            "ui": world.extra["labels"][1].id,
            "cycle": world.extra["cycle"].id,
            "module": world.extra["module"].id,
            "web_2_seq": world.web_2.sequence_id,
        }
        params = {k: v.format(**ids) for k, v in params.items()}
        total, _ = list_total(client_for(world.ben), world, **params)
        assert total == expected

    def test_needs_review(self, world):
        flagged = TimeEntryFactory(project=world.web, user=world.ben, auto_stopped=True)
        _, ids = list_total(client_for(world.ben), world, needs_review="true")
        assert ids == {str(flagged.id)}

    def test_invalid_filter_is_rejected(self, world):
        response = client_for(world.ben).get(api(world, ""), {"user_ids": "not-a-uuid"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["code"] == "INVALID_FILTER"

    def test_invalid_order_by(self, world):
        response = client_for(world.ben).get(api(world, ""), {"order_by": "password"})
        assert response.data["code"] == "INVALID_FILTER"


@pytest.mark.contract
class TestSummary:
    def test_numbers_and_previous_period(self, world):
        # something in the previous week
        TimeEntryFactory(project=world.web, user=world.ben, spent_on=MON - timedelta(days=2), duration_seconds=1200)
        data = client_for(world.ana).get(api(world, "summary/"), WEEK).data
        assert data["total_seconds"] == 3600 + 1800 + 5400 + 900 + 7200
        assert data["billable_seconds"] == 3600 + 5400
        assert data["non_billable_seconds"] == 1800 + 900 + 7200
        assert data["entry_count"] == 5 and data["user_count"] == 3 and data["project_count"] == 2
        assert data["issue_count"] == 3 and data["no_issue_seconds"] == 900
        assert data["active_days"] == 4
        # (ben, mon) (ben, tue) (pia, tue) (pia, thu) (ana, wed)
        assert data["avg_seconds_per_user_day"] == data["total_seconds"] // 5
        assert data["running_count"] == 1  # excluded from the totals, counted here
        assert data["previous"] == {
            "date_from": str(MON - timedelta(days=7)),
            "date_to": str(MON - timedelta(days=1)),
            "total_seconds": 1200,
            "billable_seconds": 0,
        }

    def test_no_previous_without_both_dates(self, world):
        assert client_for(world.ben).get(api(world, "summary/")).data["previous"] is None


DIMENSIONS = ["user", "project", "issue", "state", "state_group", "cycle", "priority", "billable", "source", "date"]
MULTI = ["label", "module", "assignee"]


@pytest.mark.contract
class TestReport:
    @pytest.mark.parametrize("group_by", DIMENSIONS)
    def test_group_totals_equal_the_list_total(self, world, group_by):
        client = client_for(world.ana)
        list_sum, _ = list_total(client, world)
        data = client.get(api(world, "report/"), {"group_by": group_by}).data
        assert data["multi_valued"] is False
        assert data["total_seconds"] == list_sum
        assert sum(g["total_seconds"] for g in data["groups"]) == list_sum

    @pytest.mark.parametrize("group_by", MULTI)
    def test_multi_valued_dimensions_keep_the_true_total(self, world, group_by):
        client = client_for(world.ana)
        list_sum, _ = list_total(client, world)
        data = client.get(api(world, "report/"), {"group_by": group_by}).data
        assert data["multi_valued"] is True and data["total_seconds"] == list_sum

    def test_label_buckets(self, world):
        data = client_for(world.ben).get(api(world, "report/"), {"group_by": "label"}).data
        groups = {g["label"]: g["total_seconds"] for g in data["groups"]}
        # web_1 has bug + ui (counted in both); web_2's bug link is soft-deleted → "No label"
        assert groups == {"bug": 9000, "ui": 9000, "No label": 1800 + 900 + 600}

    def test_empty_buckets_and_labels(self, world):
        data = client_for(world.ben).get(api(world, "report/"), {"group_by": "issue"}).data
        labels = {g["label"] for g in data["groups"]}
        assert f"WEB-{world.web_1.sequence_id} Fix login" in labels and "No work item" in labels

    def test_sub_groups(self, world):
        data = (
            client_for(world.ana)
            .get(api(world, "report/"), {"group_by": "project", "sub_group_by": "user", **WEEK})
            .data
        )
        web = next(g for g in data["groups"] if g["label"] == "Website")
        assert {s["label"]: s["total_seconds"] for s in web["sub_groups"]} == {"Ben": 5400, "Pia": 6300}
        assert data["groups"][0]["total_seconds"] >= data["groups"][-1]["total_seconds"]  # sorted desc

    def test_daily_buckets_are_filled(self, world):
        data = client_for(world.ben).get(api(world, "report/"), {"group_by": "date", **WEEK}).data
        assert [g["key"] for g in data["groups"]] == [str(MON + timedelta(days=i)) for i in range(7)]
        assert data["groups"][2]["total_seconds"] == 0  # Wednesday: only SEC time, invisible to Ben

    @pytest.mark.parametrize("week_start,first_bucket", [(1, MON), (0, MON - timedelta(days=1))])
    def test_weekly_buckets(self, world, week_start, first_bucket):
        params = {"group_by": "date", "interval": "week", "week_start": week_start}
        params.update(date_from=str(MON), date_to=str(MON + timedelta(days=13)))
        data = client_for(world.ana).get(api(world, "report/"), params).data
        assert data["groups"][0]["key"] == str(first_bucket)
        assert sum(g["total_seconds"] for g in data["groups"]) == 3600 + 1800 + 5400 + 900 + 7200 + 600

    def test_monthly_buckets(self, world):
        params = {"group_by": "date", "interval": "month", "date_from": "2026-09-01", "date_to": "2026-10-31"}
        data = client_for(world.ana).get(api(world, "report/"), params).data
        assert [g["key"] for g in data["groups"]] == ["2026-09-01", "2026-10-01"]
        assert data["groups"][1]["total_seconds"] == 900 + 600  # Oct 1 and Oct 6

    def test_invalid_dimension(self, world):
        response = client_for(world.ben).get(api(world, "report/"), {"group_by": "password"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        response = client_for(world.ben).get(api(world, "report/"), {"group_by": "user", "sub_group_by": "user"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.contract
class TestTimesheet:
    def test_week_grid(self, world):
        data = client_for(world.ben).get(api(world, "timesheet/"), {"week_start_date": str(MON)}).data
        assert data["days"][0] == str(MON) and len(data["days"]) == 7
        assert data["total_seconds"] == 3600 + 1800
        assert [r["issue_id"] for r in data["rows"]] == [str(world.web_1.id), str(world.web_2.id)]
        cell = data["rows"][0]["cells"][str(MON)]
        assert cell["total_seconds"] == 3600 and cell["entries"][0]["can_edit"] is True
        assert data["day_totals"][str(MON + timedelta(days=1))] == 1800

    def test_project_time_rows_come_first(self, world):
        TimeEntryFactory(project=world.web, user=world.ben, spent_on=MON, duration_seconds=60)
        data = client_for(world.ben).get(api(world, "timesheet/"), {"week_start_date": str(MON)}).data
        assert data["rows"][0]["issue_id"] is None

    def test_another_persons_timesheet(self, world):
        params = {"week_start_date": str(MON), "user_id": str(world.pia.id)}
        data = client_for(world.ben).get(api(world, "timesheet/"), params).data
        assert data["total_seconds"] == 5400 + 900
        assert all(e["can_edit"] is False for r in data["rows"] for c in r["cells"].values() for e in c["entries"])
        data = client_for(world.ana).get(api(world, "timesheet/"), params).data
        assert all(e["can_edit"] is True for r in data["rows"] for c in r["cells"].values() for e in c["entries"])

    def test_running_entry(self, world):
        running = world.extra["running"]
        params = {"week_start_date": str(MON), "user_id": str(world.pia.id)}
        data = client_for(world.pia).get(api(world, "timesheet/"), params).data
        assert data["running_entry_id"] == str(running.id)
        entries = [e for r in data["rows"] for c in r["cells"].values() for e in c["entries"] if e["is_running"]]
        assert entries[0]["duration_seconds"] is None and entries[0]["started_at"].endswith("Z")

    def test_week_start_date_is_required(self, world):
        response = client_for(world.ben).get(api(world, "timesheet/"))
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.contract
def test_start_end_times_in_the_owners_zone_feed_spent_on(world):
    """An entry logged at 23:30 Lisbon time counts towards that Lisbon day in the timesheet."""
    world.ben.user_timezone = "Europe/Lisbon"
    world.ben.save()
    start = datetime(2026, 9, 29, 22, 30, tzinfo=dt_timezone.utc)  # 23:30 in Lisbon
    response = client_for(world.ben).post(
        api(world, ""),
        {
            "project_id": str(world.web.id),
            "started_at": start.isoformat(),
            "ended_at": (start + timedelta(minutes=20)).isoformat(),
        },
        format="json",
    )
    assert response.data["spent_on"] == "2026-09-29"
