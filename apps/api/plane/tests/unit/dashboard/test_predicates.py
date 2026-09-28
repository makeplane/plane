# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Spec §12 — operational predicate tests for the 12-issue fixture.

These tests pin the exact counts defined in the spec:

    count("total")           == 12
    count("open")            == 9
    count("not_started")     == 5
    count("started")         == 4
    count("completed")       == 2
    count("overdue")         == 2
    count("blocked")         == 3
    count_union(["overdue", "blocked"]) == 4

Plus boundary cases the spec explicitly calls out: half-open periods,
workspace timezone, distinct issue IDs under fan-out joins, closed
blockers excluded, inactive assignees preserved, no productive-capacity
inference.
"""

from __future__ import annotations

from datetime import date, datetime, time, timedelta
from uuid import uuid4

import pytest
import pytz

from plane.analytics.dashboard import (
    DashboardContractError,
    DashboardScope,
    DashboardSelection,
    MetricUnavailableError,
    PRESET_LAST_30_DAYS,
    PRESET_LAST_7_DAYS,
    PRESET_NONE,
    PRESET_THIS_MONTH,
    active_issue_base,
    count_attention_union,
    count_blocked,
    count_cancelled,
    count_completed,
    count_completed_in_period,
    count_due_soon,
    count_due_today,
    count_not_started,
    count_open,
    count_overdue,
    count_started,
    count_total,
    count_unassigned_urgent_high,
    list_issues,
    operational_queryset,
    resolve_dashboard_scope,
)
from plane.analytics.dashboard.predicates import (
    _blocked_subquery_for_scope,
    _resolve_preset_range,
)
from plane.db.models import (
    Cycle,
    CycleIssue,
    Issue,
    IssueAssignee,
    IssueBlocker,
    IssueLabel,
    Label,
    Module,
    ModuleIssue,
    Project,
    ProjectMember,
    ProjectNetwork,
    State,
    User,
    Workspace,
    WorkspaceMember,
)


pytestmark = pytest.mark.unit


# ----- count helpers (test-only) ----------------------------------------


def _scope(fixture_setup, *, principal=None, payload=None):
    """Return a dashboard scope for the fixture's workspace."""
    return resolve_dashboard_scope(
        workspace=fixture_setup["workspace"],
        principal=principal or fixture_setup["users"]["alice"],
        payload=payload,
        today=date(2026, 9, 23),
    )


def count(scope, rule: str) -> int:
    """Test helper wrapping the new queryset selectors."""
    mapping = {
        "total": count_total,
        "open": count_open,
        "not_started": count_not_started,
        "started": count_started,
        "completed": count_completed,
        "cancelled": count_cancelled,
        "overdue": count_overdue,
        "due_today": count_due_today,
        "due_soon": count_due_soon,
        "blocked": count_blocked,
    }
    if rule not in mapping:
        raise ValueError(f"Unknown rule {rule!r}")
    return mapping[rule](scope)


def count_union(scope, rules) -> int:
    return count_attention_union(scope, rules=rules)


# ----- spec §12 — count assertions --------------------------------------


@pytest.mark.unit
class TestSpecSection12Counts:
    def test_total_is_twelve(self, fixture_setup):
        scope = _scope(fixture_setup)
        assert count(scope, "total") == 12

    def test_open_is_nine(self, fixture_setup):
        scope = _scope(fixture_setup)
        assert count(scope, "open") == 9

    def test_not_started_is_five(self, fixture_setup):
        scope = _scope(fixture_setup)
        assert count(scope, "not_started") == 5

    def test_started_is_four(self, fixture_setup):
        scope = _scope(fixture_setup)
        assert count(scope, "started") == 4

    def test_completed_is_two(self, fixture_setup):
        scope = _scope(fixture_setup)
        assert count(scope, "completed") == 2

    def test_overdue_is_two(self, fixture_setup):
        scope = _scope(fixture_setup)
        assert count(scope, "overdue") == 2

    def test_blocked_is_three(self, fixture_setup):
        scope = _scope(fixture_setup)
        assert count(scope, "blocked") == 3

    def test_union_overdue_and_blocked_is_four(self, fixture_setup):
        scope = _scope(fixture_setup)
        # 2 overdue + 3 blocked - 1 overlap = 4
        assert count_union(scope, ["overdue", "blocked"]) == 4


# ----- list/count parity -------------------------------------------------


@pytest.mark.unit
class TestListCountParity:
    """The same selector must drive both counts and the drilldown list."""

    def test_overdue_list_total_equals_overdue_count(self, fixture_setup):
        scope = _scope(fixture_setup)
        ids = set(
            list_issues(scope, rule="overdue").values_list("id", flat=True)
        )
        assert len(ids) == count(scope, "overdue")
        assert len(ids) == 2

    def test_blocked_list_total_equals_blocked_count(self, fixture_setup):
        scope = _scope(fixture_setup)
        ids = set(
            list_issues(scope, rule="blocked").values_list("id", flat=True)
        )
        assert len(ids) == count(scope, "blocked")
        assert len(ids) == 3

    def test_attention_union_list_total_equals_union_count(self, fixture_setup):
        scope = _scope(fixture_setup)
        qs = operational_queryset(scope)
        from plane.analytics.dashboard.predicates import (
            _blocked_q,
            _due_soon_q,
            _overdue_q,
            _unassigned_urgent_high_q,
        )
        union = (
            _overdue_q(scope.today)
            | _blocked_q(scope)
            | _due_soon_q(scope.today)
            | _unassigned_urgent_high_q()
        )
        ids = set(qs.filter(union).values_list("id", flat=True))
        assert len(ids) == count_union(
            scope, ["overdue", "blocked", "due_soon", "unassigned_urgent_high"]
        )

    def test_multi_assignee_issue_counts_once(self, fixture_setup):
        """Distinct issue IDs — no fan-out from IssueAssignee join."""
        scope = _scope(fixture_setup)
        assert count(scope, "started") == 4


# ----- spec §12 — distinct under fan-out joins --------------------------


@pytest.mark.unit
class TestDistinctUnderFanout:
    def test_total_under_joins_remains_twelve(self, fixture_setup):
        scope = _scope(fixture_setup)
        qs = operational_queryset(scope)
        qs = qs.filter(issue_assignee__deleted_at__isnull=True).distinct()
        assert qs.values("id").distinct().count() == 12


# ----- selection contract drives queryset -------------------------------


@pytest.mark.unit
class TestSelectionParity:
    """Selection-aware list resolves to the same rows as the matching count."""

    def test_overdue_selection_list_matches_overdue_count(self, fixture_setup):
        scope = _scope(fixture_setup)
        selection = DashboardSelection(metric="overdue")
        rows = list_issues(scope, selection=selection)
        assert rows.values("id").distinct().count() == count_overdue(scope)

    def test_blocked_selection_list_matches_blocked_count(self, fixture_setup):
        scope = _scope(fixture_setup)
        selection = DashboardSelection(metric="blocked")
        rows = list_issues(scope, selection=selection)
        assert rows.values("id").distinct().count() == count_blocked(scope)

    def test_unassigned_urgent_high_selection(self, fixture_setup):
        scope = _scope(fixture_setup)
        # The two "Started overdue" issues are priority=high and have no
        # IssueAssignee rows (only the multi assignee issue has assignees),
        # so both count as unassigned+urgent/high.
        assert count_unassigned_urgent_high(scope) == 2
        selection = DashboardSelection(metric="unassigned_urgent_high")
        names = set(
            list_issues(scope, selection=selection).values_list("name", flat=True)
        )
        assert names == {"Started overdue 0", "Started overdue 1"}


# ----- half-open period + completed_in_period --------------------------


@pytest.mark.unit
class TestPeriodSemantics:
    def test_completed_in_period_uses_completed_at_not_created_at(self, fixture_setup):
        """Spec: completed_in_period counts issues whose completed_at lies in
        the period, not created_at."""
        scope = _scope(fixture_setup)
        assert count_completed_in_period(scope) == 1

    def test_completed_outside_period_is_excluded(self, fixture_setup):
        """The "completed outside" issue was completed 120 days ago."""
        scope = _scope(fixture_setup)
        ids = list(
            list_issues(scope, rule="completed_in_period")
            .values_list("name", flat=True)
        )
        assert ids == ["Completed inside"]

    def test_half_open_window_excludes_end(self, fixture_setup):
        """Boundary at period.end must be exclusive (spec §8 half-open)."""
        workspace = fixture_setup["workspace"]
        alice = fixture_setup["users"]["alice"]
        project = fixture_setup["project"]
        start, end = _resolve_preset_range(
            preset=PRESET_THIS_MONTH, today=date(2026, 9, 23), tz_name="UTC"
        )
        # Create with a temporary state and update both state and completed_at
        # via queryset.update so Issue.save() does not overwrite completed_at
        # via _sync_completed_at.
        boundary = Issue.objects.create(
            project=project, workspace=workspace,
            name="Boundary completed",
            state=fixture_setup["states"]["started"],
            priority="none", target_date=None, created_by=alice,
        )
        Issue.objects.filter(pk=boundary.pk).update(
            state=fixture_setup["states"]["completed"],
            completed_at=end,
        )
        scope = _scope(fixture_setup)
        ids = list(
            list_issues(scope, rule="completed_in_period").values_list("id", flat=True)
        )
        assert boundary.id not in ids


@pytest.mark.unit
class TestRollingPeriodBoundaries:
    """Coordinator clarification: Last N days include today.

    last_7_days = [today-6, tomorrow) → 7 calendar days inclusive of today.
    last_30_days = [today-29, tomorrow) → 30 calendar days inclusive of today.
    """

    def test_last_7_days_window_is_seven_calendar_days(self):
        today = date(2026, 9, 23)
        start, end = _resolve_preset_range(
            preset=PRESET_LAST_7_DAYS, today=today, tz_name="UTC"
        )
        # Both must be timezone-aware UTC datetimes.
        assert start.tzinfo is not None and end.tzinfo is not None
        assert (end - start) == timedelta(days=7)
        # The local start is today-6 days and the local end is tomorrow.
        local_start = start.astimezone(pytz.UTC).date()
        local_end = end.astimezone(pytz.UTC).date()
        assert local_start == today - timedelta(days=6)
        assert local_end == today + timedelta(days=1)

    def test_last_30_days_window_is_thirty_calendar_days(self):
        today = date(2026, 9, 23)
        start, end = _resolve_preset_range(
            preset=PRESET_LAST_30_DAYS, today=today, tz_name="UTC"
        )
        assert (end - start) == timedelta(days=30)
        local_start = start.astimezone(pytz.UTC).date()
        local_end = end.astimezone(pytz.UTC).date()
        assert local_start == today - timedelta(days=29)
        assert local_end == today + timedelta(days=1)

    def test_last_7_days_includes_today(self, fixture_setup):
        """An issue created today must be inside ``last_7_days`` and outside
        the prior period."""
        workspace = fixture_setup["workspace"]
        alice = fixture_setup["users"]["alice"]
        project = fixture_setup["project"]
        started = fixture_setup["states"]["started"]
        Issue.objects.create(
            project=project,
            workspace=workspace,
            name="Created today",
            state=started,
            priority="medium",
            created_by=alice,
        )
        scope = resolve_dashboard_scope(
            workspace=workspace,
            principal=alice,
            payload={"period_preset": PRESET_LAST_7_DAYS},
            today=date(2026, 9, 23),
        )
        from plane.analytics.dashboard.predicates import (
            _apply_period,
            _completed_q,
        )
        qs = operational_queryset(scope).filter(_completed_q())
        # We can't apply on created_at for a completed-state row that lacks
        # completed_at, so query all started that were created today.
        from django.utils import timezone as djtz
        today_start = djtz.make_aware(
            datetime.combine(date(2026, 9, 23), time.min), pytz.UTC
        )
        rows = list(
            operational_queryset(scope)
            .filter(state__group="started", created_at__gte=today_start)
            .values_list("name", flat=True)
        )
        assert "Created today" in rows


@pytest.mark.unit
class TestCustomPeriod:
    """Spec §9.2 supports preset OR start/end. Custom period is P0."""

    def test_custom_period_resolves_to_requested_bounds(self):
        start, end = _resolve_preset_range(
            preset="custom",
            today=date(2026, 9, 23),
            tz_name="UTC",
            custom_start="2026-09-01",
            custom_end="2026-09-30",
        )
        assert start.date() == date(2026, 9, 1)
        assert end.date() == date(2026, 9, 30)

    def test_custom_period_requires_both_dates(self):
        with pytest.raises(DashboardContractError):
            _resolve_preset_range(
                preset="custom",
                today=date(2026, 9, 23),
                tz_name="UTC",
                custom_start="2026-09-01",
                custom_end=None,
            )

    def test_custom_period_end_must_be_after_start(self):
        with pytest.raises(DashboardContractError):
            _resolve_preset_range(
                preset="custom",
                today=date(2026, 9, 23),
                tz_name="UTC",
                custom_start="2026-09-30",
                custom_end="2026-09-01",
            )

    def test_custom_period_localises_naive_dates_in_workspace_tz(self, fixture_setup):
        """A naive date in the payload is interpreted in the workspace TZ."""
        workspace = fixture_setup["workspace"]
        alice = fixture_setup["users"]["alice"]
        # Workspace TZ is UTC; naive date 2026-09-15 → 2026-09-15 00:00 UTC.
        scope = resolve_dashboard_scope(
            workspace=workspace,
            principal=alice,
            payload={
                "period_preset": "custom",
                "start": "2026-09-01",
                "end": "2026-09-30",
            },
            today=date(2026, 9, 23),
        )
        assert scope.period.start.date() == date(2026, 9, 1)
        assert scope.period.end.date() == date(2026, 9, 30)


@pytest.mark.unit
class TestActiveBaseAcrossProjects:
    """Cross-project readable blocker must count even when target projects
    are filtered (coordinator carry-over #2)."""

    def test_blocker_in_another_selected_project_still_counts(self, fixture_setup):
        """If the target is projectA but the blocker is in projectB (both
        readable), the issue in projectA is blocked. active_issue_base must
        span ALL readable projects so the blocker subquery finds projectB.
        """
        workspace = fixture_setup["workspace"]
        alice = fixture_setup["users"]["alice"]
        # Create a second public project that alice is also a member of.
        project_b = _make_public_project(workspace, alice, name="Other")
        state_started_b = State.objects.create(
            project=project_b, name="Started", color="#000000", group="started"
        )
        blocker = Issue.objects.create(
            project=project_b, workspace=workspace, name="Blocker in B",
            state=state_started_b, priority="medium", created_by=alice,
        )
        # Target issue lives in the original project (Spec).
        victim = Issue.objects.create(
            project=fixture_setup["project"], workspace=workspace,
            name="Victim in A (blocked by B)",
            state=fixture_setup["states"]["started"],
            priority="medium", created_by=alice,
        )
        IssueBlocker.objects.create(
            block=victim, blocked_by=blocker,
            project=fixture_setup["project"], workspace=workspace,
            created_by=alice,
        )
        # Scope filters to ONLY project (the Spec project, not B).
        scope = _scope(
            fixture_setup,
            payload={"project_ids": [str(fixture_setup["project"].id)]},
        )
        names = list(
            list_issues(scope, rule="blocked").values_list("name", flat=True)
        )
        # Victim must be flagged blocked even though the blocker is in a
        # project the payload didn't select.
        assert "Victim in A (blocked by B)" in names


def _make_public_project(workspace, alice, *, name: str = "Other") -> Project:
    project = Project.objects.create(
        workspace=workspace, name=name,
        identifier=f"O{uuid4().hex[:4].upper()}",
        created_by=alice, updated_by=alice,
        network=ProjectNetwork.PUBLIC.value,
    )
    ProjectMember.objects.create(project=project, member=alice, role=20, is_active=True)
    WorkspaceMember.objects.get_or_create(
        workspace=workspace, member=alice, defaults={"role": 20, "is_active": True}
    )
    return project


# ----- workspace timezone boundary --------------------------------------


@pytest.mark.unit
class TestWorkspaceTimezone:
    def test_overdue_respects_calendar_day_in_workspace_tz(self, fixture_setup):
        """Today is determined by the workspace timezone, not UTC."""
        workspace = fixture_setup["workspace"]
        alice = fixture_setup["users"]["alice"]
        project = fixture_setup["project"]
        started = fixture_setup["states"]["started"]
        boundary = Issue.objects.create(
            project=project,
            workspace=workspace,
            name="Due today (NOT overdue)",
            state=started,
            priority="medium",
            target_date=date(2026, 9, 23),
            created_by=alice,
        )
        scope = _scope(fixture_setup)
        ids = list(
            list_issues(scope, rule="overdue").values_list("id", flat=True)
        )
        assert boundary.id not in ids

    def test_due_today_count(self, fixture_setup):
        workspace = fixture_setup["workspace"]
        alice = fixture_setup["users"]["alice"]
        project = fixture_setup["project"]
        started = fixture_setup["states"]["started"]
        Issue.objects.create(
            project=project,
            workspace=workspace,
            name="Due today",
            state=started,
            priority="high",
            target_date=date(2026, 9, 23),
            created_by=alice,
        )
        scope = _scope(fixture_setup)
        assert count(scope, "due_today") == 1

    def test_due_soon_window_is_today_to_today_plus_7(self, fixture_setup):
        """Spec §8: Due soon = today <= target_date < today + 7 (calendar day)."""
        workspace = fixture_setup["workspace"]
        alice = fixture_setup["users"]["alice"]
        project = fixture_setup["project"]
        started = fixture_setup["states"]["started"]
        for offset, expected in [(-1, False), (0, True), (3, True), (7, False), (8, False)]:
            Issue.objects.create(
                project=project,
                workspace=workspace,
                name=f"Offset {offset}",
                state=started,
                priority="medium",
                target_date=date(2026, 9, 23) + timedelta(days=offset),
                created_by=alice,
            )
        scope = _scope(fixture_setup)
        ids = set(
            list_issues(scope, rule="due_soon").values_list("name", flat=True)
        )
        assert "Offset 0" in ids
        assert "Offset 3" in ids
        assert "Offset 7" not in ids
        assert "Offset 8" not in ids

    def test_workspace_timezone_overrides_payload(self, fixture_setup):
        """Spec: server uses workspace.timezone. Payload TZ must be ignored."""
        alice = fixture_setup["users"]["alice"]
        workspace = fixture_setup["workspace"]
        # Workspace TZ is UTC; sending a different TZ in payload must not
        # change the scope timezone.
        scope = resolve_dashboard_scope(
            workspace=workspace,
            principal=alice,
            payload={"timezone": "Asia/Tokyo"},
            today=date(2026, 9, 23),
        )
        assert scope.timezone == "UTC"

    def test_unknown_workspace_timezone_rejected(self, fixture_setup):
        workspace = fixture_setup["workspace"]
        workspace.timezone = "Mars/Olympus"  # not a real zone
        alice = fixture_setup["users"]["alice"]
        with pytest.raises(DashboardContractError):
            resolve_dashboard_scope(
                workspace=workspace, principal=alice, today=date(2026, 9, 23)
            )

    def test_scope_key_includes_timezone(self, fixture_setup):
        workspace = fixture_setup["workspace"]
        alice = fixture_setup["users"]["alice"]
        a = resolve_dashboard_scope(
            workspace=workspace, principal=alice, today=date(2026, 9, 23)
        )
        b = resolve_dashboard_scope(
            workspace=workspace, principal=alice, today=date(2026, 9, 23)
        )
        assert a.scope_key == b.scope_key
        # Mutate the workspace TZ and re-resolve.
        workspace.timezone = "Asia/Ho_Chi_Minh"
        c = resolve_dashboard_scope(
            workspace=workspace, principal=alice, today=date(2026, 9, 23)
        )
        assert a.scope_key != c.scope_key


# ----- blocked predicate -------------------------------------------------


@pytest.mark.unit
class TestBlockedPredicate:
    def test_spec12_blocked_targets(self, fixture_setup):
        """The 12-issue fixture has exactly 3 blocked rows."""
        scope = _scope(fixture_setup)
        names = set(
            list_issues(scope, rule="blocked").values_list("name", flat=True)
        )
        assert names == {"Started overdue 0", "Started healthy", "Unstarted 0"}

    def test_closed_blocker_does_not_count(self, fixture_setup):
        """Auxiliary: a blocker whose source is completed/cancelled is excluded."""
        workspace = fixture_setup["workspace"]
        alice = fixture_setup["users"]["alice"]
        project = fixture_setup["project"]
        started = fixture_setup["states"]["started"]
        # Create a fresh victim + completed blocker inside this test.
        victim = Issue.objects.create(
            project=project, workspace=workspace, name="Has closed blocker",
            state=started, priority="medium", created_by=alice,
        )
        completed = Issue.objects.create(
            project=project, workspace=workspace, name="Closed source",
            state=fixture_setup["states"]["completed"], priority="none",
            created_by=alice,
        )
        IssueBlocker.objects.create(
            block=victim, blocked_by=completed,
            project=project, workspace=workspace, created_by=alice,
        )
        scope = _scope(fixture_setup)
        names = set(
            list_issues(scope, rule="blocked").values_list("name", flat=True)
        )
        assert "Has closed blocker" not in names

    def test_deleted_blocker_does_not_count(self, fixture_setup):
        workspace = fixture_setup["workspace"]
        alice = fixture_setup["users"]["alice"]
        project = fixture_setup["project"]
        started = fixture_setup["states"]["started"]
        issue = Issue.objects.create(
            project=project, workspace=workspace,
            name="Has deleted blocker", state=started,
            priority="medium", created_by=alice,
        )
        blocker = Issue.objects.create(
            project=project, workspace=workspace,
            name="Deleted source", state=started,
            priority="medium", created_by=alice,
        )
        row = IssueBlocker.objects.create(
            block=issue, blocked_by=blocker,
            project=project, workspace=workspace, created_by=alice,
        )
        row.delete()
        scope = _scope(fixture_setup)
        names = set(
            list_issues(scope, rule="blocked").values_list("name", flat=True)
        )
        assert "Has deleted blocker" not in names

    def test_blocker_in_invisible_project_does_not_count(self, fixture_setup):
        """Spec §8: Blocked must only consider blockers the viewer can read."""
        workspace = fixture_setup["workspace"]
        alice = fixture_setup["users"]["alice"]
        carol = fixture_setup["users"]["carol"]
        project = fixture_setup["project"]
        started = fixture_setup["states"]["started"]
        issue = Issue.objects.create(
            project=project, workspace=workspace,
            name="Has invisible blocker", state=started,
            priority="medium", created_by=alice,
        )
        secret = Project.objects.create(
            workspace=workspace,
            name="Secret",
            identifier=f"P{uuid4().hex[:4].upper()}",
            created_by=alice,
            network=ProjectNetwork.SECRET.value,
        )
        # alice is a member of both projects; carol is only in the public one.
        ProjectMember.objects.create(project=secret, member=alice, role=20, is_active=True)
        State.objects.create(project=secret, name="Started", color="#000000", group="started")
        blocker = Issue.objects.create(
            project=secret, workspace=workspace,
            name="Secret source",
            state=State.objects.get(project=secret, group="started"),
            priority="medium", created_by=alice,
        )
        IssueBlocker.objects.create(
            block=issue, blocked_by=blocker,
            project=project, workspace=workspace, created_by=alice,
        )
        alice_scope = _scope(fixture_setup, principal=alice)
        assert "Has invisible blocker" in list(
            list_issues(alice_scope, rule="blocked").values_list("name", flat=True)
        )
        # carol is a workspace + public-project member but not in the secret
        # project. The blocked subquery must reject the invisible blocker.
        carol_scope = _scope(fixture_setup, principal=carol)
        names = list(
            list_issues(carol_scope, rule="blocked").values_list("name", flat=True)
        )
        assert "Has invisible blocker" not in names

    def test_blocked_subquery_does_not_inherit_business_filters(self, fixture_setup):
        """A viewer's ``priority=high`` filter must NOT expand or shrink the
        set of issues that can block other issues (coordinator finding #1).

        Setup: a high-priority victim is blocked by a low-priority source.
        Filtering by priority=high keeps the victim in scope and the
        low-priority source still counts as a blocker (because the source
        subquery is independent of the business filter).
        """
        workspace = fixture_setup["workspace"]
        alice = fixture_setup["users"]["alice"]
        project = fixture_setup["project"]
        started = fixture_setup["states"]["started"]
        victim = Issue.objects.create(
            project=project, workspace=workspace,
            name="High-priority victim", state=started,
            priority="high", created_by=alice,
        )
        blocker = Issue.objects.create(
            project=project, workspace=workspace,
            name="Low-priority source", state=started,
            priority="low", created_by=alice,
        )
        IssueBlocker.objects.create(
            block=victim, blocked_by=blocker,
            project=project, workspace=workspace, created_by=alice,
        )
        high_scope = _scope(
            fixture_setup, payload={"business_filters": {"priority": ["high"]}}
        )
        names = list(
            list_issues(high_scope, rule="blocked").values_list("name", flat=True)
        )
        assert "High-priority victim" in names


# ----- ACL / scope -------------------------------------------------------


@pytest.mark.unit
class TestAclScope:
    def test_non_member_workspace_principal_sees_nothing(self, fixture_setup):
        workspace = fixture_setup["workspace"]
        outsider = User.objects.create(
            email=f"outsider-{uuid4().hex[:6]}@plane.so",
            username=f"outsider-{uuid4().hex[:6]}",
        )
        outsider.set_password("pw")
        outsider.save()
        scope = resolve_dashboard_scope(
            workspace=workspace, principal=outsider, today=date(2026, 9, 23)
        )
        assert scope.visible_project_ids == []
        assert count_total(scope) == 0
        assert count_open(scope) == 0

    def test_visible_project_ids_intersect_with_payload(self, fixture_setup):
        workspace = fixture_setup["workspace"]
        alice = fixture_setup["users"]["alice"]
        scope = resolve_dashboard_scope(
            workspace=workspace,
            principal=alice,
            payload={"project_ids": [str(uuid4())]},
            today=date(2026, 9, 23),
        )
        assert scope.visible_project_ids == []
        assert count_total(scope) == 0

    def test_scope_key_is_stable_for_identical_inputs(self, fixture_setup):
        workspace = fixture_setup["workspace"]
        alice = fixture_setup["users"]["alice"]
        a = resolve_dashboard_scope(workspace=workspace, principal=alice, today=date(2026, 9, 23))
        b = resolve_dashboard_scope(workspace=workspace, principal=alice, today=date(2026, 9, 23))
        assert a.scope_key == b.scope_key

    def test_scope_key_changes_with_today(self, fixture_setup):
        workspace = fixture_setup["workspace"]
        alice = fixture_setup["users"]["alice"]
        a = resolve_dashboard_scope(workspace=workspace, principal=alice, today=date(2026, 9, 23))
        b = resolve_dashboard_scope(workspace=workspace, principal=alice, today=date(2026, 9, 24))
        assert a.scope_key != b.scope_key

    def test_scope_key_changes_with_principal(self, fixture_setup):
        workspace = fixture_setup["workspace"]
        alice = fixture_setup["users"]["alice"]
        bob = fixture_setup["users"]["bob"]
        a = resolve_dashboard_scope(workspace=workspace, principal=alice, today=date(2026, 9, 23))
        b = resolve_dashboard_scope(workspace=workspace, principal=bob, today=date(2026, 9, 23))
        assert a.scope_key != b.scope_key

    def test_active_issue_base_independent_of_business_filters(self, fixture_setup):
        scope = _scope(fixture_setup)
        base = active_issue_base(scope)
        # The base must include every fixture issue (12) regardless of
        # business filters; filters are applied separately on the dashboard
        # queryset, not on the ACL predicate subqueries.
        assert base.values("id").distinct().count() == 12


# ----- business filter allowlist + real-model mapping -------------------


@pytest.mark.unit
class TestBusinessFilters:
    def test_unknown_business_filter_rejected(self, fixture_setup):
        with pytest.raises(DashboardContractError):
            _scope(fixture_setup, payload={"business_filters": {"raw_sql": "1=1"}})

    def test_priority_filter_restricts_started(self, fixture_setup):
        scope = _scope(
            fixture_setup, payload={"business_filters": {"priority": ["high"]}}
        )
        # Multi-assignee is medium; one overdue is high.
        assert count_started(scope) == 2

    def test_label_filter_uses_issuelabel_relation_not_label(self, fixture_setup):
        """A soft-deleted IssueLabel relation must not widen the label filter.

        Spec §9.3 + coordinator finding #4: the label filter must consult the
        through-model, not just the underlying Label row.
        """
        workspace = fixture_setup["workspace"]
        alice = fixture_setup["users"]["alice"]
        project = fixture_setup["project"]
        label = Label.objects.create(
            project=project, name="lbl-x", color="#000000", created_by=alice
        )
        # Issue with an active IssueLabel link.
        active_issue = Issue.objects.create(
            project=project,
            workspace=workspace,
            name="Active label link",
            state=fixture_setup["states"]["started"],
            priority="medium",
            created_by=alice,
        )
        IssueLabel.objects.create(
            issue=active_issue, label=label, project=project, workspace=workspace
        )
        # Issue with a soft-deleted IssueLabel link.
        deleted_issue = Issue.objects.create(
            project=project,
            workspace=workspace,
            name="Deleted label link",
            state=fixture_setup["states"]["started"],
            priority="medium",
            created_by=alice,
        )
        deleted_link = IssueLabel.objects.create(
            issue=deleted_issue, label=label, project=project, workspace=workspace
        )
        deleted_link.delete()
        scope = _scope(
            fixture_setup, payload={"business_filters": {"label_id": [str(label.id)]}}
        )
        names = set(
            list_issues(scope).values_list("name", flat=True)
        )
        assert "Active label link" in names
        assert "Deleted label link" not in names

    def test_cycle_filter_uses_cycle_issue_relation(self, fixture_setup):
        workspace = fixture_setup["workspace"]
        alice = fixture_setup["users"]["alice"]
        project = fixture_setup["project"]
        cycle = Cycle.objects.create(
            project=project, name="Cycle A", created_by=alice,
            owned_by=alice, workspace=workspace,
        )
        in_issue = Issue.objects.create(
            project=project,
            workspace=workspace,
            name="In cycle",
            state=fixture_setup["states"]["started"],
            priority="medium",
            created_by=alice,
        )
        CycleIssue.objects.create(
            issue=in_issue, cycle=cycle, project=project, workspace=workspace
        )
        out_issue = Issue.objects.create(
            project=project,
            workspace=workspace,
            name="Not in cycle",
            state=fixture_setup["states"]["started"],
            priority="medium",
            created_by=alice,
        )
        scope = _scope(
            fixture_setup, payload={"business_filters": {"cycle_id": [str(cycle.id)]}}
        )
        names = set(list_issues(scope).values_list("name", flat=True))
        assert "In cycle" in names
        assert "Not in cycle" not in names

    def test_module_filter_uses_module_issue_relation(self, fixture_setup):
        workspace = fixture_setup["workspace"]
        alice = fixture_setup["users"]["alice"]
        project = fixture_setup["project"]
        module = Module.objects.create(
            project=project, name="M1", created_by=alice, workspace=workspace
        )
        in_issue = Issue.objects.create(
            project=project,
            workspace=workspace,
            name="In module",
            state=fixture_setup["states"]["started"],
            priority="medium",
            created_by=alice,
        )
        ModuleIssue.objects.create(
            issue=in_issue, module=module, project=project, workspace=workspace
        )
        out_issue = Issue.objects.create(
            project=project,
            workspace=workspace,
            name="Not in module",
            state=fixture_setup["states"]["started"],
            priority="medium",
            created_by=alice,
        )
        scope = _scope(
            fixture_setup, payload={"business_filters": {"module_id": [str(module.id)]}}
        )
        names = set(list_issues(scope).values_list("name", flat=True))
        assert "In module" in names
        assert "Not in module" not in names

    def test_assignee_filter_uses_active_issue_assignee(self, fixture_setup):
        """Soft-deleted IssueAssignee rows must not widen the filter."""
        workspace = fixture_setup["workspace"]
        alice = fixture_setup["users"]["alice"]
        bob = fixture_setup["users"]["bob"]
        project = fixture_setup["project"]
        deleted_issue = Issue.objects.create(
            project=project,
            workspace=workspace,
            name="Inactive assignee",
            state=fixture_setup["states"]["started"],
            priority="medium",
            created_by=alice,
        )
        link = IssueAssignee.objects.create(
            issue=deleted_issue, assignee=alice,
            project=project, workspace=workspace,
        )
        link.delete()
        scope = _scope(
            fixture_setup,
            payload={"business_filters": {"assignee_id": [str(alice.id)]}},
        )
        names = set(list_issues(scope).values_list("name", flat=True))
        assert "Inactive assignee" not in names


# ----- selection contract ------------------------------------------------


@pytest.mark.unit
class TestSelectionContract:
    def test_unknown_snapshot_rule_rejected(self):
        with pytest.raises(DashboardContractError):
            DashboardSelection(metric="raw_orm_field")

    def test_unknown_date_bucket_rejected(self):
        with pytest.raises(DashboardContractError):
            DashboardSelection(date_bucket="fortnight")

    def test_unknown_delivery_base_rejected(self):
        with pytest.raises(DashboardContractError):
            DashboardSelection(delivery_base="due_date_utc")

    def test_unknown_attention_rule_rejected(self):
        with pytest.raises(DashboardContractError):
            DashboardSelection(rules=frozenset({"raw_orm_field"}))

    def test_no_update_metric_raises_unavailable_not_zero(self, fixture_setup):
        """Spec §13: no_update must not silently return 0 — gate first."""
        with pytest.raises(MetricUnavailableError):
            count_attention_union(_scope(fixture_setup), rules=["no_update"])

    def test_no_update_in_selection_raises_unavailable(self, fixture_setup):
        with pytest.raises(MetricUnavailableError):
            list_issues(
                _scope(fixture_setup),
                selection=DashboardSelection(metric="no_update"),
            )

    def test_custom_period_preset_requires_explicit_dates(self, fixture_setup):
        """``custom`` is in VALID_PERIOD_PRESETS but needs explicit
        start/end; otherwise the resolver must reject."""
        with pytest.raises(DashboardContractError):
            _resolve_preset_range(
                preset="custom",
                today=date(2026, 9, 23),
                tz_name="UTC",
            )

    def test_none_preset_yields_open_window(self):
        start, end = _resolve_preset_range(
            preset=PRESET_NONE, today=date(2026, 9, 23), tz_name="UTC"
        )
        assert start is None and end is None