# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Unit tests for usage-monitor aggregation utilities.

These functions turn IssueWorkLog rows into active/standard/department metrics.
The base queryset passed in mirrors what the endpoint builds: it excludes bots,
deactivated users, and worklogs whose parent workspace/project was soft-deleted.
"""

from datetime import date, timedelta

import pytest
from django.utils import timezone

from plane.db.models import IssueWorkLog, Project, Workspace
from plane.license.utils.usage_metrics import (
    STANDARD_DAILY_MINUTES,
    active_users_series,
    bucket_key,
    department_aggregates,
    project_totals,
    standard_users_pie,
    standard_users_series,
    total_active_users,
    user_day_totals,
    user_workspace_day_totals,
)
from plane.tests.factories import (
    IssueFactory,
    IssueWorkLogFactory,
    ProjectFactory,
    UserFactory,
    WorkspaceFactory,
)


def base_qs():
    """Same base filters the endpoint applies before calling the utils."""
    return IssueWorkLog.objects.filter(
        logged_by__is_bot=False,
        logged_by__is_active=True,
        workspace__deleted_at__isnull=True,
        project__deleted_at__isnull=True,
    )


@pytest.mark.unit
@pytest.mark.django_db
class TestUserDayTotals:
    def test_same_day_two_worklogs_summed(self):
        user = UserFactory()
        issue = IssueFactory()
        day = date(2026, 5, 1)
        IssueWorkLogFactory(issue=issue, logged_by=user, duration_minutes=300, logged_at=day)
        IssueWorkLogFactory(issue=issue, logged_by=user, duration_minutes=200, logged_at=day)

        rows = user_day_totals(base_qs())
        assert len(rows) == 1
        assert rows[0]["user_id"] == user.id
        assert rows[0]["day"] == day
        assert rows[0]["total_minutes"] == 500

    def test_zero_minute_only_day_excluded(self):
        user = UserFactory()
        issue = IssueFactory()
        IssueWorkLogFactory(issue=issue, logged_by=user, duration_minutes=0, logged_at=date(2026, 5, 2))

        rows = user_day_totals(base_qs())
        assert rows == []

    def test_bot_and_deactivated_excluded(self):
        active = UserFactory()
        bot = UserFactory(is_bot=True)
        deactivated = UserFactory(is_active=False)
        issue = IssueFactory()
        day = date(2026, 5, 3)
        IssueWorkLogFactory(issue=issue, logged_by=active, duration_minutes=60, logged_at=day)
        IssueWorkLogFactory(issue=issue, logged_by=bot, duration_minutes=60, logged_at=day)
        IssueWorkLogFactory(issue=issue, logged_by=deactivated, duration_minutes=60, logged_at=day)

        rows = user_day_totals(base_qs())
        assert {r["user_id"] for r in rows} == {active.id}

    def test_soft_deleted_parent_workspace_excluded(self):
        user = UserFactory()
        ws = WorkspaceFactory()
        project = ProjectFactory(workspace=ws)
        issue = IssueFactory(project=project)
        IssueWorkLogFactory(issue=issue, logged_by=user, duration_minutes=60, logged_at=date(2026, 5, 4))
        # Soft-delete the workspace WITHOUT running the Celery cascade.
        Workspace.objects.filter(id=ws.id).update(deleted_at=timezone.now())

        rows = user_day_totals(base_qs())
        assert rows == []

    def test_empty_input_returns_empty(self):
        assert user_day_totals(base_qs()) == []


@pytest.mark.unit
@pytest.mark.django_db
class TestActiveUsersSeries:
    def test_three_users_one_day(self):
        issue = IssueFactory()
        day = date(2026, 5, 5)
        for _ in range(3):
            IssueWorkLogFactory(issue=issue, logged_by=UserFactory(), duration_minutes=60, logged_at=day)

        rows = user_day_totals(base_qs())
        series = active_users_series(rows, "day")
        assert series == [{"period": "2026-05-05", "active_users": 3}]
        assert total_active_users(rows) == 3

    def test_user_counted_once_across_two_worklogs_same_day(self):
        user = UserFactory()
        issue = IssueFactory()
        day = date(2026, 5, 6)
        IssueWorkLogFactory(issue=issue, logged_by=user, duration_minutes=60, logged_at=day)
        IssueWorkLogFactory(issue=issue, logged_by=user, duration_minutes=60, logged_at=day)

        series = active_users_series(user_day_totals(base_qs()), "day")
        assert series == [{"period": "2026-05-06", "active_users": 1}]

    def test_monthly_and_yearly_buckets(self):
        user = UserFactory()
        issue = IssueFactory()
        IssueWorkLogFactory(issue=issue, logged_by=user, duration_minutes=60, logged_at=date(2026, 1, 10))
        IssueWorkLogFactory(issue=issue, logged_by=user, duration_minutes=60, logged_at=date(2026, 1, 20))
        IssueWorkLogFactory(issue=issue, logged_by=user, duration_minutes=60, logged_at=date(2026, 2, 5))

        rows = user_day_totals(base_qs())
        monthly = active_users_series(rows, "month")
        assert monthly == [
            {"period": "2026-01", "active_users": 1},
            {"period": "2026-02", "active_users": 1},
        ]
        yearly = active_users_series(rows, "year")
        assert yearly == [{"period": "2026", "active_users": 1}]


@pytest.mark.unit
@pytest.mark.django_db
class TestStandardMetrics:
    def test_standard_threshold_boundary(self):
        u479 = UserFactory()
        u480 = UserFactory()
        usplit = UserFactory()
        issue = IssueFactory()
        day = date(2026, 5, 7)
        IssueWorkLogFactory(issue=issue, logged_by=u479, duration_minutes=479, logged_at=day)
        IssueWorkLogFactory(issue=issue, logged_by=u480, duration_minutes=480, logged_at=day)
        IssueWorkLogFactory(issue=issue, logged_by=usplit, duration_minutes=300, logged_at=day)
        IssueWorkLogFactory(issue=issue, logged_by=usplit, duration_minutes=200, logged_at=day)

        rows = user_day_totals(base_qs())
        pie = standard_users_pie(rows)
        assert pie["standard_users"] == 2  # u480 + usplit(500)
        assert pie["non_standard_users"] == 1  # u479
        assert pie["total_active_users"] == 3

    def test_series_non_overlapping(self):
        issue = IssueFactory()
        day = date(2026, 5, 8)
        # 5 active user-days; 2 standard
        for mins in (480, 600):
            IssueWorkLogFactory(issue=issue, logged_by=UserFactory(), duration_minutes=mins, logged_at=day)
        for mins in (60, 120, 200):
            IssueWorkLogFactory(issue=issue, logged_by=UserFactory(), duration_minutes=mins, logged_at=day)

        series = standard_users_series(user_day_totals(base_qs()), "day")
        assert series == [
            {"period": "2026-05-08", "standard_user_days": 2, "non_standard_user_days": 3}
        ]

    def test_pie_standard_on_one_of_three_days(self):
        user = UserFactory()
        issue = IssueFactory()
        IssueWorkLogFactory(issue=issue, logged_by=user, duration_minutes=480, logged_at=date(2026, 5, 9))
        IssueWorkLogFactory(issue=issue, logged_by=user, duration_minutes=60, logged_at=date(2026, 5, 10))
        IssueWorkLogFactory(issue=issue, logged_by=user, duration_minutes=60, logged_at=date(2026, 5, 11))

        pie = standard_users_pie(user_day_totals(base_qs()))
        assert pie == {"standard_users": 1, "non_standard_users": 0, "total_active_users": 1}

    def test_active_but_never_standard_is_non_standard(self):
        user = UserFactory()
        issue = IssueFactory()
        IssueWorkLogFactory(issue=issue, logged_by=user, duration_minutes=60, logged_at=date(2026, 5, 12))

        pie = standard_users_pie(user_day_totals(base_qs()))
        assert pie == {"standard_users": 0, "non_standard_users": 1, "total_active_users": 1}


@pytest.mark.unit
@pytest.mark.django_db
class TestDepartmentAggregates:
    def test_per_workspace_metrics_and_multi_workspace_user(self):
        user = UserFactory()
        ws_a = WorkspaceFactory()
        ws_b = WorkspaceFactory()
        proj_a = ProjectFactory(workspace=ws_a)
        proj_b = ProjectFactory(workspace=ws_b)
        issue_a = IssueFactory(project=proj_a)
        issue_b = IssueFactory(project=proj_b)
        # user standard in A, non-standard in B
        IssueWorkLogFactory(issue=issue_a, logged_by=user, duration_minutes=500, logged_at=date(2026, 5, 13))
        IssueWorkLogFactory(issue=issue_b, logged_by=user, duration_minutes=120, logged_at=date(2026, 5, 13))

        qs = base_qs()
        ws_rows = user_workspace_day_totals(qs)
        proj_rows = project_totals(qs)
        workspaces = {
            str(w["id"]): {"name": w["name"], "slug": w["slug"]}
            for w in Workspace.objects.filter(id__in=[ws_a.id, ws_b.id]).values("id", "name", "slug")
        }
        depts = department_aggregates(ws_rows, proj_rows, workspaces)
        by_id = {d["workspace_id"]: d for d in depts}

        assert by_id[str(ws_a.id)]["active_users"] == 1
        assert by_id[str(ws_a.id)]["standard_users"] == 1
        assert by_id[str(ws_a.id)]["total_logged_minutes"] == 500
        assert by_id[str(ws_a.id)]["projects_with_logged_time"] == 1
        assert by_id[str(ws_b.id)]["standard_users"] == 0
        assert by_id[str(ws_b.id)]["total_logged_minutes"] == 120
        # Multi-workspace user counts once instance-wide
        assert total_active_users(user_day_totals(qs)) == 1

    def test_projects_with_logged_time_excludes_soft_deleted_project(self):
        user = UserFactory()
        ws = WorkspaceFactory()
        live = ProjectFactory(workspace=ws, name="Live Project")
        deleted = ProjectFactory(workspace=ws, name="Deleted Project")
        issue_live = IssueFactory(project=live)
        issue_deleted = IssueFactory(project=deleted)
        IssueWorkLogFactory(issue=issue_live, logged_by=user, duration_minutes=60, logged_at=date(2026, 5, 14))
        IssueWorkLogFactory(issue=issue_deleted, logged_by=user, duration_minutes=60, logged_at=date(2026, 5, 14))
        Project.objects.filter(id=deleted.id).update(deleted_at=timezone.now())

        qs = base_qs()
        ws_rows = user_workspace_day_totals(qs)
        proj_rows = project_totals(qs)
        workspaces = {
            str(w["id"]): {"name": w["name"], "slug": w["slug"]}
            for w in Workspace.objects.filter(id=ws.id).values("id", "name", "slug")
        }
        depts = department_aggregates(ws_rows, proj_rows, workspaces)
        assert depts[0]["projects_with_logged_time"] == 1
        assert depts[0]["total_logged_minutes"] == 60

    def test_empty_input_returns_empty(self):
        assert department_aggregates([], [], {}) == []


@pytest.mark.unit
@pytest.mark.django_db
class TestWorkspaceFilterAndProjectTotals:
    def test_project_totals_resolves_name_and_workspace(self):
        user = UserFactory()
        ws = WorkspaceFactory()
        project = ProjectFactory(workspace=ws)
        issue = IssueFactory(project=project)
        IssueWorkLogFactory(issue=issue, logged_by=user, duration_minutes=90, logged_at=date(2026, 5, 15))
        IssueWorkLogFactory(issue=issue, logged_by=user, duration_minutes=30, logged_at=date(2026, 5, 16))

        rows = project_totals(base_qs())
        assert len(rows) == 1
        assert rows[0]["project_id"] == str(project.id)
        assert rows[0]["project_name"] == project.name
        assert rows[0]["workspace_id"] == str(ws.id)
        assert rows[0]["total_minutes"] == 120

    def test_workspace_filter_excludes_other_workspace(self):
        user = UserFactory()
        ws_a = WorkspaceFactory()
        ws_b = WorkspaceFactory()
        issue_a = IssueFactory(project=ProjectFactory(workspace=ws_a))
        issue_b = IssueFactory(project=ProjectFactory(workspace=ws_b))
        IssueWorkLogFactory(issue=issue_a, logged_by=user, duration_minutes=60, logged_at=date(2026, 5, 17))
        IssueWorkLogFactory(issue=issue_b, logged_by=user, duration_minutes=60, logged_at=date(2026, 5, 17))

        rows = user_day_totals(base_qs().filter(workspace_id=ws_a.id))
        assert total_active_users(rows) == 1
        # Only ws_a worklog present
        proj_rows = project_totals(base_qs().filter(workspace_id=ws_a.id))
        assert {r["workspace_id"] for r in proj_rows} == {str(ws_a.id)}


@pytest.mark.unit
def test_bucket_key():
    d = date(2026, 3, 9)
    assert bucket_key(d, "day") == "2026-03-09"
    assert bucket_key(d, "month") == "2026-03"
    assert bucket_key(d, "year") == "2026"


@pytest.mark.unit
def test_standard_threshold_constant():
    assert STANDARD_DAILY_MINUTES == 480
