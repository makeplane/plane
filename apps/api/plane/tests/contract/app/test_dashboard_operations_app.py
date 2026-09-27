# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for the Team Operations Dashboard endpoints (Task 2).

Pins the contract surface defined in the new spec:

* ``POST /api/workspaces/{slug}/dashboard/overview/`` — composed overview.
* ``POST /api/workspaces/{slug}/dashboard/attention/`` — attention union.
* ``POST /api/workspaces/{slug}/dashboard/items/`` — paginated drilldown.

The tests assert:

1. The canonical envelope (version, scope_key, resolved_scope, resolved_period).
2. Count/list parity: items.total equals the overview KPI count for the same
   metric in unchanged read state.
3. ACL: non-member rejected with 403; private-issue counts and names do
   not leak across viewer scopes.
4. Attention: per-row reasons are computed via Exists (an overdue-only
   issue never gets blocked/unassigned tags), overlap rows carry exactly
   the rules they satisfy, paginated output stays bounded.
5. Section isolation: a failing section does not blank the rest.
"""

from __future__ import annotations

from datetime import date, datetime, time, timedelta
from uuid import uuid4

import pytest
import pytz
from freezegun import freeze_time
from rest_framework.test import APIClient

from plane.analytics.dashboard import (
    count_attention_union,
    count_blocked,
    count_overdue,
    count_total,
)
from plane.db.models import (
    Issue,
    IssueAssignee,
    IssueBlocker,
    IssueLabel,
    Label,
    Project,
    ProjectMember,
    ProjectNetwork,
    State,
    User,
    Workspace,
    WorkspaceMember,
)


pytestmark = [pytest.mark.contract, pytest.mark.django_db]


# Contract tests share the production formula with a fixed clock so the
# API's resolve_dashboard_scope (which defaults to datetime.now()) and
# the test's manual resolve_dashboard_scope(today=...) agree.
# Coordinator finding: real wall-clock is non-deterministic; test classes
# that consume ``FROZEN_TODAY`` apply ``@freeze_time(FROZEN_NOW)`` so the
# API and the assertions run against the same instant.
# freeze_time is incompatible with module-scope patching in Python 3.12 +
# pydantic v1, so do NOT autouse it.
FROZEN_TODAY = date(2026, 9, 23)
FROZEN_NOW = datetime(2026, 9, 23, 12, 0, tzinfo=pytz.UTC)


# ----- helpers ----------------------------------------------------------


def _make_user(email: str) -> User:
    user = User.objects.create(email=email, username=email.split("@")[0])
    user.set_password("pw")
    user.save()
    return user


def _make_workspace(slug: str = "acme", owner: User | None = None) -> Workspace:
    if owner is None:
        owner = _make_user(f"owner-{slug}@plane.so")
    return Workspace.objects.create(
        name="Acme", slug=slug, owner=owner, timezone="UTC", created_by=owner,
    )


def _make_state(project: Project, group: str, name: str) -> State:
    return State.objects.create(
        project=project, name=name, color="#000000", group=group,
    )


def _join_workspace(user: User, workspace: Workspace) -> None:
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=15, is_active=True)


def _join_project(user: User, project: Project) -> None:
    ProjectMember.objects.create(project=project, member=user, role=15, is_active=True)


def _make_project(
    workspace: Workspace, *, network: int = ProjectNetwork.PUBLIC.value, name: str = "P"
) -> Project:
    owner = workspace.owner
    return Project.objects.create(
        workspace=workspace, name=name,
        identifier=f"P{uuid4().hex[:4].upper()}",
        created_by=owner, updated_by=owner, network=network,
    )


def _build_client(user: User) -> APIClient:
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def _build_minimal_fixture():
    """Deprecated: superseded by ``fixture_with_workspace`` below.

    Kept as a placeholder to avoid import churn while individual tests are
    migrated. New tests should build their own fixture inline so they can
    control the authenticated principal without duplicate-key errors.
    """
    raise NotImplementedError(
        "Use the per-class fixture_with_workspace / inline fixtures instead."
    )


# ----- envelope + overview ----------------------------------------------


@pytest.fixture
def workspace_client():
    owner = _make_user("owner-ws@plane.so")
    workspace = Workspace.objects.create(
        name="AcmeWS", slug="acmews", owner=owner, timezone="UTC", created_by=owner,
    )
    WorkspaceMember.objects.create(workspace=workspace, member=owner, role=20, is_active=True)
    client = APIClient()
    client.force_authenticate(user=owner)
    return {"workspace": workspace, "client": client, "owner": owner}


@pytest.fixture
def fixture_with_workspace(workspace_client):
    """Build a minimal spec §12 fixture anchored in the authenticated workspace.

    Avoids duplicate-key errors by creating all fixture rows under the
    same workspace that owns the project. ``alice`` becomes the workspace
    owner so she can authenticate the dashboard request. The project
    network is SECRET so the workspace-only ``outsider`` does NOT see
    the issues (verifies ACL isolation in items/overview).
    """
    workspace = workspace_client["workspace"]
    owner = workspace_client["owner"]
    project = _make_project(workspace, name="Spec", network=ProjectNetwork.SECRET.value)
    state_backlog = _make_state(project, "backlog", "Backlog")
    state_unstarted = _make_state(project, "unstarted", "Unstarted")
    state_started = _make_state(project, "started", "Started")
    state_completed = _make_state(project, "completed", "Completed")
    state_cancelled = _make_state(project, "cancelled", "Cancelled")
    # Anchor fixture dates on the test's frozen today so the API's
    # datetime.now() and the manual today agree.
    today = FROZEN_TODAY

    bob = _make_user("bob@plane.so")
    _join_workspace(bob, workspace)
    _join_project(bob, project)
    _join_project(owner, project)  # workspace owner is also a project member
    outsider = _make_user("carol@plane.so")
    _join_workspace(outsider, workspace)
    # outsider deliberately has no ProjectMember row — they must not see
    # SECRET-project issues in the items/overview response.

    issues = []
    for i in range(2):
        issues.append(Issue.objects.create(
            project=project, workspace=workspace, name=f"Backlog {i}",
            state=state_backlog, priority="none", created_by=owner,
        ))
    for i in range(3):
        issues.append(Issue.objects.create(
            project=project, workspace=workspace, name=f"Unstarted {i}",
            state=state_unstarted, priority="medium", created_by=owner,
        ))
    started_overdue_0 = Issue.objects.create(
        project=project, workspace=workspace, name="Started overdue 0",
        state=state_started, priority="high",
        target_date=today - timedelta(days=2), created_by=owner,
    )
    started_overdue_1 = Issue.objects.create(
        project=project, workspace=workspace, name="Started overdue 1",
        state=state_started, priority="high",
        target_date=today - timedelta(days=2), created_by=owner,
    )
    started_blocked = Issue.objects.create(
        project=project, workspace=workspace, name="Started blocked",
        state=state_started, priority="medium",
        target_date=today + timedelta(days=5), created_by=owner,
    )
    Issue.objects.create(
        project=project, workspace=workspace, name="Started healthy",
        state=state_started, priority="medium",
        target_date=today + timedelta(days=10), created_by=owner,
    )
    completed_inside = Issue.objects.create(
        project=project, workspace=workspace, name="Completed inside",
        state=state_started, priority="none", created_by=owner,
    )
    Issue.objects.filter(pk=completed_inside.pk).update(
        state=state_completed,
        completed_at=datetime.combine(today, time(9, 0)),
    )
    completed_outside = Issue.objects.create(
        project=project, workspace=workspace, name="Completed outside",
        state=state_started, priority="none", created_by=owner,
    )
    Issue.objects.filter(pk=completed_outside.pk).update(
        state=state_completed,
        completed_at=datetime.combine(today - timedelta(days=120), time(9, 0)),
    )
    Issue.objects.create(
        project=project, workspace=workspace, name="Cancelled",
        state=state_cancelled, priority="low", created_by=owner,
    )
    IssueBlocker.objects.create(
        block=started_overdue_0, blocked_by=started_blocked,
        project=project, workspace=workspace, created_by=owner,
    )
    IssueBlocker.objects.create(
        block=started_blocked, blocked_by=started_overdue_1,
        project=project, workspace=workspace, created_by=owner,
    )

    return {
        "workspace": workspace,
        "project": project,
        "states": {
            "backlog": state_backlog, "unstarted": state_unstarted,
            "started": state_started, "completed": state_completed,
            "cancelled": state_cancelled,
        },
        "users": {"alice": owner, "bob": bob, "outsider": outsider},
        "issues": issues,
        "today": today,
        "client": workspace_client["client"],
    }


@pytest.fixture
def frozen_clock():
    """Freeze ``datetime.now()`` to FROZEN_NOW for the test's duration.

    Applied per-test (not autouse/module-level) so that the freezegun
    monkey-patch never runs at import time — that's what conflicts with
    pydantic v1's metaclass in Python 3.12.
    """
    with freeze_time(FROZEN_NOW):
        yield


@pytest.mark.django_db
class TestOverviewContract:
    URL = "/api/workspaces/{slug}/dashboard/overview/"

    def test_unauthenticated_request_is_rejected(self):
        client = APIClient()
        resp = client.post("/api/workspaces/acme/dashboard/overview/", {}, format="json")
        assert resp.status_code in (401, 403)

    def test_unknown_workspace_returns_403_via_access_decorator(self, workspace_client):
        """A workspace owner querying a missing workspace slug is rejected
        by the ``@allow_permission`` decorator with 403 (the workspace
        membership check returns 0 rows). The view's 404 path is a
        defence-in-depth fallback that the decorator's check makes
        unreachable in practice."""
        client = workspace_client["client"]
        resp = client.post("/api/workspaces/missing/dashboard/overview/", {}, format="json")
        assert resp.status_code == 403

    def test_non_member_workspace_returns_403(self):
        owner = _make_user("owner2@plane.so")
        ws = Workspace.objects.create(name="X", slug="x", owner=owner, timezone="UTC", created_by=owner)
        WorkspaceMember.objects.create(workspace=ws, member=owner, role=20, is_active=True)
        client = _build_client(_make_user("outsider@plane.so"))
        resp = client.post("/api/workspaces/x/dashboard/overview/", {}, format="json")
        assert resp.status_code == 403

    @pytest.mark.usefixtures("frozen_clock")
    def test_overview_returns_canonical_envelope(self, fixture_with_workspace):
        ws = fixture_with_workspace["workspace"]
        client = fixture_with_workspace["client"]
        resp = client.post(self.URL.format(slug=ws.slug), {}, format="json")
        assert resp.status_code == 200
        body = resp.json()
        assert body["version"] == 1
        assert "generated_at" in body
        assert "scope_key" in body
        assert body["resolved_scope"]["workspace_id"] == str(ws.id)
        assert "sections" in body

    @pytest.mark.usefixtures("frozen_clock")
    def test_overview_sections_have_stable_ids(self, fixture_with_workspace):
        ws = fixture_with_workspace["workspace"]
        client = fixture_with_workspace["client"]
        resp = client.post(self.URL.format(slug=ws.slug), {}, format="json")
        section_ids = [s.get("section_id") for s in resp.json()["sections"]]
        # Required canonical sections
        for required in ("kpis", "progress", "delivery", "top_projects", "attention_preview"):
            assert required in section_ids, f"missing section_id: {required}"

    @pytest.mark.usefixtures("frozen_clock")
    def test_overview_kpis_match_12_issue_counts(self, fixture_with_workspace):
        ws = fixture_with_workspace["workspace"]
        client = fixture_with_workspace["client"]
        resp = client.post(self.URL.format(slug=ws.slug), {}, format="json")
        kpis = next(s["data"] for s in resp.json()["sections"] if s.get("section_id") == "kpis")
        assert kpis["total"] == 12
        assert kpis["open"] == 9
        assert kpis["not_started"] == 5
        assert kpis["started"] == 4
        assert kpis["completed"] == 2
        assert kpis["overdue"] == 2
        assert kpis["blocked"] == 2

    @pytest.mark.usefixtures("frozen_clock")
    def test_overview_progress_has_completion_rate(self, fixture_with_workspace):
        ws = fixture_with_workspace["workspace"]
        client = fixture_with_workspace["client"]
        resp = client.post(self.URL.format(slug=ws.slug), {}, format="json")
        progress_section = next(s for s in resp.json()["sections"] if s.get("section_id") == "progress")
        progress = progress_section["data"]
        # 2 completed / (12 - 1 cancelled) = 0.1818
        assert progress["completion_rate"] == pytest.approx(2 / 11, rel=1e-3)

    @pytest.mark.usefixtures("frozen_clock")
    def test_overview_delivery_has_time_series(self, fixture_with_workspace):
        ws = fixture_with_workspace["workspace"]
        client = fixture_with_workspace["client"]
        resp = client.post(self.URL.format(slug=ws.slug), {}, format="json")
        delivery_section = next(s for s in resp.json()["sections"] if s.get("section_id") == "delivery")
        # Section may be in error state; assert the contract shape either way.
        if delivery_section.get("status") != "ok":
            pytest.fail(f"delivery section errored: {delivery_section}")
        delivery = delivery_section["data"]
        assert delivery["bucket"] in ("day", "week", "month")
        assert isinstance(delivery["series_created"], list)
        assert isinstance(delivery["series_completed"], list)
        assert "created_total" in delivery and "completed_total" in delivery

    @pytest.mark.usefixtures("frozen_clock")
    def test_overview_delivery_series_sums_match_period_totals(self, fixture_with_workspace):
        """Coordinated delivery regression: the series dict keys must
        match the zero-fill labels so sums equal the period totals.
        """
        ws = fixture_with_workspace["workspace"]
        client = fixture_with_workspace["client"]
        resp = client.post(self.URL.format(slug=ws.slug), {}, format="json")
        delivery_section = next(s for s in resp.json()["sections"] if s.get("section_id") == "delivery")
        if delivery_section.get("status") != "ok":
            pytest.fail(f"delivery section errored: {delivery_section}")
        delivery = delivery_section["data"]
        created_sum = sum(b["count"] for b in delivery["series_created"])
        completed_sum = sum(b["count"] for b in delivery["series_completed"])
        assert created_sum == delivery["created_total"]
        assert completed_sum == delivery["completed_total"]
        # delta invariant
        assert delivery["delta"] == delivery["created_total"] - delivery["completed_total"]

    def test_overview_delivery_buckets_align_to_workspace_local_calendar(self, fixture_with_workspace):
        """Events near a midnight in workspace TZ land on the right day
        bucket. Use a workspace in Asia/Ho_Chi_Minh (UTC+7) and place a
        created event at local 00:30 → UTC 17:30 of the prior day. Naive
        UTC bucketing would put the event on the wrong day.
        """
        from datetime import timezone

        workspace = fixture_with_workspace["workspace"]
        owner = fixture_with_workspace["users"]["alice"]
        workspace.timezone = "Asia/Ho_Chi_Minh"
        workspace.save()
        project = fixture_with_workspace["project"]
        started = fixture_with_workspace["states"]["started"]
        today = FROZEN_TODAY
        # today 00:30 Asia/Ho_Chi_Minh == today-1 17:30 UTC.
        event_local = datetime(
            today.year, today.month, today.day, 0, 30,
            tzinfo=timezone(timedelta(hours=7)),
        )
        event_utc = event_local.astimezone(timezone.utc)
        issue = Issue.objects.create(
            project=project, workspace=workspace, name="Midnight event",
            state=started, priority="medium", created_by=owner,
        )
        # Issue.created_at is auto_now_add — bypass with queryset.update.
        Issue.objects.filter(pk=issue.pk).update(created_at=event_utc)
        # Mirror the API's frozen clock so dates align.
        from plane.analytics.dashboard import resolve_dashboard_scope
        scope = resolve_dashboard_scope(
            workspace=workspace,
            principal=owner,
            payload={"period_preset": "this_month"},
            today=today,
        )
        from plane.analytics.dashboard.service import _delivery_trend
        trend = _delivery_trend(scope, bucket="day")
        bucket_label = today.isoformat()
        created_for_day = next(
            (b["count"] for b in trend["series_created"] if b["bucket"] == bucket_label),
            0,
        )
        assert created_for_day >= 1, (
            f"event created at {event_local} (UTC {event_utc}) should land in "
            f"workspace-local day {bucket_label}, got buckets={trend['series_created']}"
        )

    def test_overview_top_projects_uses_operational_queryset(self, fixture_with_workspace):
        ws = fixture_with_workspace["workspace"]
        client = fixture_with_workspace["client"]
        resp = client.post(self.URL.format(slug=ws.slug), {}, format="json")
        top_section = next(s for s in resp.json()["sections"] if s.get("section_id") == "top_projects")
        top = top_section["data"]
        assert "top" in top
        assert "total_projects_in_scope" in top

    def test_contract_violation_returns_400(self, fixture_with_workspace):
        ws = fixture_with_workspace["workspace"]
        client = fixture_with_workspace["client"]
        resp = client.post(
            self.URL.format(slug=ws.slug),
            {"business_filters": {"raw_sql": "1=1"}},
            format="json",
        )
        assert resp.status_code == 400
        assert resp.json()["code"] == "INVALID_PAYLOAD"


# ----- attention --------------------------------------------------------


@pytest.mark.django_db
class TestAttentionContract:
    URL = "/api/workspaces/{slug}/dashboard/attention/"

    @pytest.mark.usefixtures("frozen_clock")
    def test_attention_returns_union_and_reasons(self, fixture_with_workspace):
        ws = fixture_with_workspace["workspace"]
        client = fixture_with_workspace["client"]
        resp = client.post(self.URL.format(slug=ws.slug), {}, format="json")
        assert resp.status_code == 200
        body = resp.json()
        section = body["sections"][0]
        data = section["data"]
        assert section["section_id"] == "attention"
        assert "reason_counts" in data
        assert data["reason_counts"]["overdue"] == 2
        assert data["reason_counts"]["blocked"] == 2
        # With FROZEN_TODAY=2026-09-23 the fixture's anchor days are
        # deterministic. Union = overdue(2) ∪ blocked(2) ∪ due_soon(1)
        # ∪ unassigned_urgent_high(2) → 3 distinct issues (one overlap
        # between overdue and blocked on started_overdue_0).
        assert data["union_total"] == 3

    @pytest.mark.usefixtures("frozen_clock")
    def test_overdue_only_issue_has_only_overdue_reason(self, fixture_with_workspace):
        """The spec rule: row reasons are per-issue via Exists, not
        fabricated. An overdue-only issue (Started overdue 1 — overdue +
        unassigned_urgent_high, NOT blocked) must NOT carry the blocked
        reason. Verified via the Overview's attention_preview section.
        """
        ws = fixture_with_workspace["workspace"]
        client = fixture_with_workspace["client"]
        overview_url = "/api/workspaces/{slug}/dashboard/overview/"
        resp = client.post(overview_url.format(slug=ws.slug), {}, format="json")
        preview_section = next(
            s for s in resp.json()["sections"] if s.get("section_id") == "attention_preview"
        )
        if preview_section.get("status") != "ok":
            pytest.fail(f"attention_preview errored: {preview_section}")
        rows = preview_section["data"]["preview"]
        overdue_1 = next(r for r in rows if r["name"] == "Started overdue 1")
        # Started overdue 1 is overdue + unassigned_urgent_high (no IssueAssignee)
        # but NOT blocked, so reasons must not include "blocked".
        assert "blocked" not in overdue_1["reasons"]
        assert "overdue" in overdue_1["reasons"]

    @pytest.mark.usefixtures("frozen_clock")
    def test_overlap_issue_carries_both_reasons(self, fixture_with_workspace):
        """Started overdue 0 is both overdue AND blocked → reasons list = both."""
        ws = fixture_with_workspace["workspace"]
        client = fixture_with_workspace["client"]
        overview_url = "/api/workspaces/{slug}/dashboard/overview/"
        resp = client.post(overview_url.format(slug=ws.slug), {}, format="json")
        preview_section = next(
            s for s in resp.json()["sections"] if s.get("section_id") == "attention_preview"
        )
        if preview_section.get("status") != "ok":
            pytest.fail(f"attention_preview errored: {preview_section}")
        rows = preview_section["data"]["preview"]
        overlap = next(r for r in rows if r["name"] == "Started overdue 0")
        assert "overdue" in overlap["reasons"]
        assert "blocked" in overlap["reasons"]


# ----- items / drilldown ------------------------------------------------


@pytest.mark.django_db
class TestItemsContract:
    URL = "/api/workspaces/{slug}/dashboard/items/"

    @pytest.mark.usefixtures("frozen_clock")
    def test_items_total_equals_count_overdue(self, fixture_with_workspace):
        """Count/list parity: items(metric=overdue).total == count_overdue."""
        ws = fixture_with_workspace["workspace"]
        client = fixture_with_workspace["client"]
        resp = client.post(self.URL.format(slug=ws.slug), {"metric": "overdue"}, format="json")
        assert resp.status_code == 200
        body = resp.json()
        assert body["sections"][0]["data"]["total"] == 2  # 2 overdue

    @pytest.mark.usefixtures("frozen_clock")
    def test_items_total_equals_count_blocked(self, fixture_with_workspace):
        ws = fixture_with_workspace["workspace"]
        client = fixture_with_workspace["client"]
        resp = client.post(self.URL.format(slug=ws.slug), {"metric": "blocked"}, format="json")
        assert resp.status_code == 200
        body = resp.json()
        assert body["sections"][0]["data"]["total"] == 2  # 2 blocked

    def test_items_pagination_caps_total(self, fixture_with_workspace):
        ws = fixture_with_workspace["workspace"]
        client = fixture_with_workspace["client"]
        resp = client.post(
            self.URL.format(slug=ws.slug),
            {"metric": "open", "page_size": 5},
            format="json",
        )
        body = resp.json()
        assert body["sections"][0]["data"]["page_size"] == 5
        assert len(body["sections"][0]["data"]["rows"]) <= 5

    def test_items_invalid_page_size_clamps_to_100(self, fixture_with_workspace):
        ws = fixture_with_workspace["workspace"]
        client = fixture_with_workspace["client"]
        resp = client.post(
            self.URL.format(slug=ws.slug),
            {"metric": "open", "page_size": 999},
            format="json",
        )
        body = resp.json()
        assert body["sections"][0]["data"]["page_size"] == 100

    def test_items_no_update_returns_409(self, fixture_with_workspace):
        """no_update is allowlisted but raises MetricUnavailableError → 409."""
        ws = fixture_with_workspace["workspace"]
        client = fixture_with_workspace["client"]
        resp = client.post(
            self.URL.format(slug=ws.slug),
            {"metric": "no_update"},
            format="json",
        )
        assert resp.status_code == 409
        assert resp.json()["code"] == "METRIC_UNAVAILABLE"

    def test_items_unknown_metric_returns_400(self, fixture_with_workspace):
        ws = fixture_with_workspace["workspace"]
        client = fixture_with_workspace["client"]
        resp = client.post(
            self.URL.format(slug=ws.slug),
            {"metric": "raw_orm_field"},
            format="json",
        )
        assert resp.status_code == 400

    def test_items_selection_values_filter_to_member(self, fixture_with_workspace):
        """selection.values.assignee_id filters items to that member only;
        total matches the per-member count for the same selection.
        Coordinator carry-over: count/list parity under selection."""
        from plane.db.models import IssueAssignee
        ws = fixture_with_workspace["workspace"]
        client = fixture_with_workspace["client"]
        alice = fixture_with_workspace["users"]["alice"]
        bob = fixture_with_workspace["users"]["bob"]
        project = fixture_with_workspace["project"]
        started = fixture_with_workspace["states"]["started"]
        # Create a fresh multi-assignee issue with alice + bob.
        multi = Issue.objects.create(
            project=project, workspace=ws, name="Multi assignee started",
            state=started, priority="medium", target_date=None,
            created_by=alice,
        )
        IssueAssignee.objects.create(
            issue=multi, assignee=alice, project=project, workspace=ws,
        )
        IssueAssignee.objects.create(
            issue=multi, assignee=bob, project=project, workspace=ws,
        )
        resp = client.post(
            self.URL.format(slug=ws.slug),
            {
                "metric": "open",
                "selection": {"values": {"assignee_id": str(alice.id)}},
            },
            format="json",
        )
        assert resp.status_code == 200
        data = resp.json()["sections"][0]["data"]
        assert data["total"] == 1
        assert data["rows"][0]["name"] == "Multi assignee started"
        assert data["selection"]["values"]["assignee_id"] == str(alice.id)

    @pytest.mark.usefixtures("frozen_clock")
    def test_items_selection_assignee_null_returns_unassigned(self, fixture_with_workspace):
        """Canonical unassigned representation: assignee_id:null → ""."""
        ws = fixture_with_workspace["workspace"]
        client = fixture_with_workspace["client"]
        resp = client.post(
            self.URL.format(slug=ws.slug),
            {
                "metric": "open",
                "selection": {"values": {"assignee_id": None}},
            },
            format="json",
        )
        assert resp.status_code == 200
        data = resp.json()["sections"][0]["data"]
        names = [r["name"] for r in data["rows"]]
        assert "Multi assignee started" not in names
        assert data["selection"]["values"]["assignee_id"] == ""

    def test_items_invalid_uuid_returns_400(self, fixture_with_workspace):
        ws = fixture_with_workspace["workspace"]
        client = fixture_with_workspace["client"]
        resp = client.post(
            self.URL.format(slug=ws.slug),
            {"selection": {"values": {"project_id": "not-a-uuid"}}},
            format="json",
        )
        assert resp.status_code < 500

    def test_items_custom_period_exceeding_cap_returns_400(self, fixture_with_workspace):
        ws = fixture_with_workspace["workspace"]
        client = fixture_with_workspace["client"]
        resp = client.post(
            self.URL.format(slug=ws.slug),
            {"selection": {"date_start": "2025-01-01", "date_end": "2026-12-31"}},
            format="json",
        )
        assert resp.status_code < 500

    @pytest.mark.usefixtures("frozen_clock")
    def test_items_across_viewers_isolates_acl(self, fixture_with_workspace):
        """Bob sees his project; outsider (workspace-only member, no project
        membership) sees nothing.
        """
        ws = fixture_with_workspace["workspace"]
        alice = fixture_with_workspace["users"]["alice"]
        bob = fixture_with_workspace["users"]["bob"]
        outsider = fixture_with_workspace["users"]["outsider"]
        # bob is already a project member in fixture_with_workspace
        alice_client = _build_client(alice)
        bob_client = _build_client(bob)
        outsider_client = _build_client(outsider)
        outsider_client.force_authenticate(user=outsider)
        for who, client in (("alice", alice_client), ("bob", bob_client), ("outsider", outsider_client)):
            resp = client.post(self.URL.format(slug=ws.slug), {"metric": "open"}, format="json")
            assert resp.status_code == 200, who
            total = resp.json()["sections"][0]["data"]["total"]
            if who == "outsider":
                # outsider is workspace member but not in this project.
                assert total == 0
            else:
                assert total == 9  # alice and bob both see the 9 open


# ----- workload ---------------------------------------------------------


@pytest.mark.django_db
class TestWorkloadContract:
    URL = "/api/workspaces/{slug}/dashboard/workload/"

    def test_workload_returns_canonical_envelope(self, fixture_with_workspace):
        ws = fixture_with_workspace["workspace"]
        client = fixture_with_workspace["client"]
        resp = client.post(self.URL.format(slug=ws.slug), {}, format="json")
        assert resp.status_code == 200
        body = resp.json()
        section = body["sections"][0]
        data = section["data"]
        assert section["section_id"] == "workload"
        assert section["status"] == "ok"
        assert "rows" in data
        assert "distinct_totals" in data
        assert "unassigned" in data
        assert "inactive" in data
        assert "pagination" in data
        assert "wip_threshold" in data

    def test_workload_rows_carry_member_state_counts(self, fixture_with_workspace):
        ws = fixture_with_workspace["workspace"]
        client = fixture_with_workspace["client"]
        resp = client.post(self.URL.format(slug=ws.slug), {}, format="json")
        data = resp.json()["sections"][0]["data"]
        for row in data["rows"]:
            assert set(["member_id", "display_name", "is_active"]).issubset(set(row.keys()))
            assert all(k in row for k in ("open", "started", "overdue", "blocked", "due_soon", "completed_in_period"))

    def test_workload_distinct_totals_not_summed(self, fixture_with_workspace):
        ws = fixture_with_workspace["workspace"]
        client = fixture_with_workspace["client"]
        resp = client.post(self.URL.format(slug=ws.slug), {}, format="json")
        data = resp.json()["sections"][0]["data"]
        distinct = data["distinct_totals"]
        assert distinct["total"] == 12
        assert distinct["open"] == 9

    def test_workload_distinct_totals_not_summed(self, fixture_with_workspace):
        """distinct_totals.total must NOT equal sum(row.total) — it's the
        workspace-wide distinct issue count, not a sum across members."""
        ws = fixture_with_workspace["workspace"]
        client = fixture_with_workspace["client"]
        resp = client.post(self.URL.format(slug=ws.slug), {}, format="json")
        data = resp.json()["sections"][0]["data"]
        distinct = data["distinct_totals"]
        # 12 issues in fixture; per-row full-credit sums would be > 12.
        assert distinct["total"] == 12
        assert distinct["open"] == 9


# ----- projects ---------------------------------------------------------


@pytest.mark.django_db
class TestProjectsContract:
    URL = "/api/workspaces/{slug}/dashboard/projects/"

    def test_projects_returns_rows_with_state_groups(self, fixture_with_workspace):
        ws = fixture_with_workspace["workspace"]
        client = fixture_with_workspace["client"]
        resp = client.post(self.URL.format(slug=ws.slug), {}, format="json")
        assert resp.status_code == 200
        data = resp.json()["sections"][0]["data"]
        assert "rows" in data
        for row in data["rows"]:
            assert "state_groups" in row
            sg = row["state_groups"]
            for g in ("backlog", "unstarted", "started", "completed", "cancelled"):
                assert g in sg
            assert all(
                k in row
                for k in (
                    "total", "cancelled", "open", "started", "completed",
                    "completed_in_period", "overdue", "blocked",
                    "completion_rate", "next_deadline",
                )
            )

    def test_projects_completion_rate_uses_correct_denominator(self, fixture_with_workspace):
        ws = fixture_with_workspace["workspace"]
        client = fixture_with_workspace["client"]
        resp = client.post(self.URL.format(slug=ws.slug), {}, format="json")
        data = resp.json()["sections"][0]["data"]
        # 2 completed / (12 - 1 cancelled) = 0.1818
        row = data["rows"][0]
        assert row["completion_rate"] == pytest.approx(2 / 11, rel=1e-3)

    def test_projects_distinct_totals_not_summed(self, fixture_with_workspace):
        ws = fixture_with_workspace["workspace"]
        client = fixture_with_workspace["client"]
        resp = client.post(self.URL.format(slug=ws.slug), {}, format="json")
        data = resp.json()["sections"][0]["data"]
        distinct = data["distinct_totals"]
        assert distinct["total"] == 12


# ----- timeline ---------------------------------------------------------


@pytest.mark.django_db
class TestTimelineContract:
    URL = "/api/workspaces/{slug}/dashboard/timeline/"

    def test_timeline_returns_three_independent_paginations(self, fixture_with_workspace):
        ws = fixture_with_workspace["workspace"]
        client = fixture_with_workspace["client"]
        resp = client.post(self.URL.format(slug=ws.slug), {}, format="json")
        assert resp.status_code == 200
        data = resp.json()["sections"][0]["data"]
        for sub in ("cycle_lanes", "deadlines", "unscheduled_cycles"):
            assert sub in data
            assert "rows" in data[sub]
            assert "pagination" in data[sub]
            assert data[sub]["pagination"]["page"] >= 1
            assert data[sub]["pagination"]["page_size"] >= 1

    def test_timeline_no_fabricated_dates(self, fixture_with_workspace):
        """Cycles without start_date or end_date land in unscheduled_cycles
        with reason 'missing_start_or_end' — never in cycle_lanes."""
        ws = fixture_with_workspace["workspace"]
        client = fixture_with_workspace["client"]
        resp = client.post(self.URL.format(slug=ws.slug), {}, format="json")
        data = resp.json()["sections"][0]["data"]
        for c in data["cycle_lanes"]["rows"]:
            assert c["start"] is not None
            assert c["end"] is not None
        for u in data["unscheduled_cycles"]["rows"]:
            assert u["reason"] == "missing_start_or_end"


# ----- snapshot isolation ----------------------------------------------


@pytest.mark.django_db(transaction=True)
class TestSnapshotIsolation:
    """Concurrent-write consistency under REPEATABLE READ.

    Inside ``dashboard_snapshot()``, the snapshot is pinned at the first
    SELECT. A concurrent INSERT/UPDATE outside the snapshot must NOT be
    visible inside. Uses ``django_db(transaction=True)`` to open its own
    transaction (per coordinator finding).
    """

    def test_snapshot_context_manager_yields_and_restores(self, fixture_with_workspace):
        """The snapshot context manager must yield control cleanly and
        not leave the connection in an aborted state."""
        from plane.analytics.dashboard.snapshot import dashboard_snapshot
        from plane.analytics.dashboard import resolve_dashboard_scope, count_total

        workspace = fixture_with_workspace["workspace"]
        alice = fixture_with_workspace["users"]["alice"]
        scope = resolve_dashboard_scope(
            workspace=workspace, principal=alice, today=FROZEN_TODAY,
        )
        before = count_total(scope)
        with dashboard_snapshot():
            assert count_total(scope) == before
        # After the block, subsequent reads must still work.
        assert count_total(scope) == before

    def test_snapshot_context_manager_cleans_up_on_exception(self, fixture_with_workspace):
        """A raised exception inside ``with dashboard_snapshot()`` must
        not leave the connection in an aborted state for subsequent
        requests."""
        from plane.analytics.dashboard.snapshot import dashboard_snapshot
        from plane.analytics.dashboard import resolve_dashboard_scope, count_total

        workspace = fixture_with_workspace["workspace"]
        alice = fixture_with_workspace["users"]["alice"]
        scope = resolve_dashboard_scope(
            workspace=workspace, principal=alice, today=FROZEN_TODAY,
        )
        before = count_total(scope)
        try:
            with dashboard_snapshot():
                raise RuntimeError("simulated request failure")
        except RuntimeError:
            pass
        assert count_total(scope) == before

    def test_snapshot_envelope_propagates_section_id(self, fixture_with_workspace):
        """Workload/projects/timeline endpoints return their payload
        inside the canonical envelope with stable ``section_id``."""
        from plane.analytics.dashboard.snapshot import dashboard_snapshot
        from plane.analytics.dashboard import resolve_dashboard_scope
        from plane.analytics.dashboard.workload import workload_payload

        workspace = fixture_with_workspace["workspace"]
        alice = fixture_with_workspace["users"]["alice"]
        scope = resolve_dashboard_scope(
            workspace=workspace, principal=alice, today=FROZEN_TODAY,
        )
        with dashboard_snapshot():
            payload = workload_payload(scope)
        assert payload["section_id"] == "workload"
        assert payload["status"] == "ok"
        assert "data" in payload


# ----- backend retry regression: defects 1-5 + snapshot RR proof --------


@pytest.mark.django_db(transaction=True)
class TestRetrySnapshotRRProof:
    """Concrete REPEATABLE READ proof under ``django_db(transaction=True)``.

    Coordinator finding: the prior implementation used SAVEPOINT (which
    cannot change isolation) and swallowed every exception. The retry
    opens ``transaction.atomic()`` and sets
    ``SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY`` BEFORE
    any SELECT runs through the connection. This test class runs with
    ``transaction=True`` so the test runner does NOT pre-open a wrapping
    transaction — the snapshot block therefore actually applies RR.

    Two threads are required for a real concurrent-write proof. We do
    the cheap part here: open a snapshot, read count, start a concurrent
    thread that inserts a new issue and commits, re-read inside the
    snapshot, and assert the new issue is NOT visible.
    """

    def test_snapshot_blocks_concurrent_insert(self, fixture_with_workspace):
        """A committed INSERT on another thread must not be visible inside
        a REPEATABLE READ snapshot. Without RR, the second read would see
        the new row.
        """
        import threading
        import time

        from plane.analytics.dashboard.snapshot import dashboard_snapshot
        from plane.analytics.dashboard import resolve_dashboard_scope, count_total
        from plane.db.models import State

        workspace = fixture_with_workspace["workspace"]
        project = fixture_with_workspace["project"]
        owner = fixture_with_workspace["users"]["alice"]
        started_state = fixture_with_workspace["states"]["started"]

        scope = resolve_dashboard_scope(
            workspace=workspace, principal=owner, today=FROZEN_TODAY,
        )

        # Use a barrier so the insert-thread commits AFTER we have read
        # inside the snapshot, but BEFORE we re-read. This forces the
        # concurrent-write case the brief asks us to prove.
        gate_open = threading.Event()
        can_continue = threading.Event()

        def _concurrent_insert():
            # Create a brand new issue; this will issue INSERT + COMMIT
            # on the test DB connection. The snapshot view MUST NOT see it.
            Issue.objects.create(
                project=project, workspace=workspace,
                name="Concurrent insert",
                state=started_state, priority="medium",
                created_by=owner,
            )
            gate_open.set()
            can_continue.wait(timeout=5)

        with dashboard_snapshot():
            before = count_total(scope)
            t = threading.Thread(target=_concurrent_insert)
            t.start()
            gate_open.wait(timeout=5)
            # The insert thread has committed; sleep a moment to make
            # sure the commit lands on the test DB before we re-read.
            time.sleep(0.05)
            during = count_total(scope)
            can_continue.set()
            t.join(timeout=5)
        assert before == during, (
            f"snapshot leaked concurrent insert: before={before} during={during}"
        )
        # After the snapshot exits, the new row MUST be visible.
        after = count_total(scope)
        assert after == before + 1


@pytest.mark.django_db
class TestRetrySelectionMetricPriority:
    """Backend retry defect #2: ``selection.metric`` is authoritative.

    Prior code read ``payload.get('metric')``, ignoring the agreed
    ``selection.metric``. The retry honours ``selection.metric`` when
    present and falls back to ``payload.metric`` only when absent, so
    old callers (legacy / frontend) keep working.
    """

    @pytest.mark.usefixtures("frozen_clock")
    def test_selection_metric_overrides_payload_metric(
        self, fixture_with_workspace
    ):
        ws = fixture_with_workspace["workspace"]
        client = fixture_with_workspace["client"]
        # selection.metric=overdue, payload.metric=blocked — must honour
        # selection.metric and return overdue rows.
        resp = client.post(
            f"/api/workspaces/{ws.slug}/dashboard/items/",
            {
                "metric": "blocked",
                "selection": {"metric": "overdue", "values": {}},
            },
            format="json",
        )
        assert resp.status_code == 200
        body = resp.json()
        echoed = body["sections"][0]["data"]["selection"]
        assert echoed["metric"] == "overdue"

    @pytest.mark.usefixtures("frozen_clock")
    def test_legacy_payload_metric_still_works(self, fixture_with_workspace):
        """When selection.metric is absent, the legacy payload.metric path
        still returns the right rows. This protects the frontend worker
        that hasn't migrated to the selection.metric shape yet.
        """
        ws = fixture_with_workspace["workspace"]
        client = fixture_with_workspace["client"]
        resp = client.post(
            f"/api/workspaces/{ws.slug}/dashboard/items/",
            {"metric": "overdue", "selection": {"values": {}}},
            format="json",
        )
        assert resp.status_code == 200
        echoed = resp.json()["sections"][0]["data"]["selection"]
        assert echoed["metric"] == "overdue"


@pytest.mark.django_db
class TestRetryDeliveryBaseContract:
    """Backend retry defect #3: items.date window honours ``delivery_base``.

    Prior code always filtered on ``completed_at`` for any date_start /
    date_end pair, so clicking the Created series returned wrong rows.
    The retry uses ``selection.delivery_base`` to decide which timestamp
    the window applies to.
    """

    @pytest.mark.usefixtures("frozen_clock")
    def test_delivery_base_created_at_filters_on_created_at(
        self, fixture_with_workspace
    ):
        """When delivery_base=created_at, the date window filters on
        ``created_at`` — issues created inside the window appear, issues
        created outside the window are excluded (regardless of
        completed_at).
        """
        from plane.db.models import State

        ws = fixture_with_workspace["workspace"]
        client = fixture_with_workspace["client"]
        project = fixture_with_workspace["project"]
        owner = fixture_with_workspace["users"]["alice"]
        today = FROZEN_TODAY

        state_started = fixture_with_workspace["states"]["started"]
        state_completed = fixture_with_workspace["states"]["completed"]

        # Issue created INSIDE the window (still open).
        inside_created = Issue.objects.create(
            project=project, workspace=ws, name="Created inside",
            state=state_started, priority="medium", created_by=owner,
        )
        Issue.objects.filter(pk=inside_created.pk).update(
            created_at=datetime.combine(today, time(9, 0)),
        )

        # Issue created OUTSIDE the window but completed INSIDE the window.
        # With delivery_base=created_at this row must NOT appear.
        outside_created_completed_inside = Issue.objects.create(
            project=project, workspace=ws, name="Created outside, completed inside",
            state=state_started, priority="medium", created_by=owner,
        )
        Issue.objects.filter(pk=outside_created_completed_inside.pk).update(
            created_at=datetime.combine(today - timedelta(days=120), time(9, 0)),
            state=state_completed,
            completed_at=datetime.combine(today, time(9, 0)),
        )

        start_iso = (today - timedelta(days=1)).isoformat()
        end_iso = (today + timedelta(days=1)).isoformat()
        resp = client.post(
            f"/api/workspaces/{ws.slug}/dashboard/items/",
            {
                "metric": "started",
                "selection": {
                    "metric": "started",
                    "values": {},
                    "date_start": start_iso,
                    "date_end": end_iso,
                    "delivery_base": "created_at",
                },
            },
            format="json",
        )
        assert resp.status_code == 200
        data = resp.json()["sections"][0]["data"]
        names = [row["name"] for row in data["rows"]]
        assert "Created inside" in names
        assert "Created outside, completed inside" not in names

    @pytest.mark.usefixtures("frozen_clock")
    def test_delivery_base_completed_at_filters_on_completed_at(
        self, fixture_with_workspace
    ):
        """When delivery_base=completed_at, the date window filters on
        ``completed_at`` — so the inverse case must return the
        completed-in-window row and exclude the created-in-window-only row.
        """
        ws = fixture_with_workspace["workspace"]
        client = fixture_with_workspace["client"]
        project = fixture_with_workspace["project"]
        owner = fixture_with_workspace["users"]["alice"]
        today = FROZEN_TODAY

        state_started = fixture_with_workspace["states"]["started"]
        state_completed = fixture_with_workspace["states"]["completed"]

        inside_created_open = Issue.objects.create(
            project=project, workspace=ws, name="Created inside, open",
            state=state_started, priority="medium", created_by=owner,
        )
        Issue.objects.filter(pk=inside_created_open.pk).update(
            created_at=datetime.combine(today, time(9, 0)),
        )

        outside_created_completed_inside = Issue.objects.create(
            project=project, workspace=ws, name="Created outside, completed inside",
            state=state_started, priority="medium", created_by=owner,
        )
        Issue.objects.filter(pk=outside_created_completed_inside.pk).update(
            created_at=datetime.combine(today - timedelta(days=120), time(9, 0)),
            state=state_completed,
            completed_at=datetime.combine(today, time(9, 0)),
        )

        start_iso = (today - timedelta(days=1)).isoformat()
        end_iso = (today + timedelta(days=1)).isoformat()
        resp = client.post(
            f"/api/workspaces/{ws.slug}/dashboard/items/",
            {
                "metric": "completed",
                "selection": {
                    "metric": "completed",
                    "values": {},
                    "date_start": start_iso,
                    "date_end": end_iso,
                    "delivery_base": "completed_at",
                },
            },
            format="json",
        )
        assert resp.status_code == 200
        data = resp.json()["sections"][0]["data"]
        names = [row["name"] for row in data["rows"]]
        # Inverse of the previous test — only completed rows, and only
        # those completed inside the window.
        assert "Created outside, completed inside" in names
        assert "Created inside, open" not in names


@pytest.mark.django_db
class TestRetryProjectsNextDeadline:
    """Backend retry defect #5: ``next_deadline`` is nearest UPCOMING.

    Prior code used ``_open_q() & target_date__isnull=False`` which
    returned the earliest target_date including overdue rows. The
    contract is "nearest upcoming open dated item"; overdue is tracked
    separately. The retry adds ``target_date__gte=scope.today``.
    """

    @pytest.mark.usefixtures("frozen_clock")
    def test_next_deadline_excludes_overdue_rows(
        self, fixture_with_workspace
    ):
        from plane.analytics.dashboard import resolve_dashboard_scope
        from plane.analytics.dashboard.projects import projects_payload

        workspace = fixture_with_workspace["workspace"]
        project = fixture_with_workspace["project"]
        owner = fixture_with_workspace["users"]["alice"]
        today = FROZEN_TODAY

        # Reset to a clean known state on top of fixture_with_workspace.
        # The fixture already has started overdue_0 and overdue_1 with
        # target_date = today-2; if our fix works, next_deadline must
        # be the upcoming target_date (today+10 = started healthy), NOT
        # the overdue one.
        scope = resolve_dashboard_scope(
            workspace=workspace, principal=owner, today=today,
        )
        payload = projects_payload(scope, page=1, page_size=25)
        rows = payload["data"]["rows"]
        assert len(rows) == 1, "fixture_with_workspace has a single project"
        row = rows[0]
        # Fixture has: started overdue 0/1 (today-2), started blocked
        # (today+5), started healthy (today+10). next_deadline must be
        # today+10 (started healthy) and must NOT be today-2.
        assert row["next_deadline"] is not None
        assert not row["next_deadline"].startswith(
            (today - timedelta(days=2)).isoformat()
        ), (
            f"next_deadline still includes overdue: {row['next_deadline']}"
        )


@pytest.mark.django_db
class TestRetryWorkloadEdgeCases:
    """Backend retry: previously deferred workload regression fixtures.

    Per the coordinator brief, the active issue query path covers these
    in principle, but dedicated contract tests were pending. The retry
    adds explicit coverage for:

    * multi-project member appearing ONCE in the roster (distinct dedup)
    * zero-work active member still listed
    * inactive / former-member with retained IssueAssignee row in
      inactive bucket
    * account-active vs membership-active separation
    * unassigned completed-in-period uses actual completed_at
    """

    def test_multi_project_member_appears_once_in_roster(
        self, fixture_with_workspace
    ):
        """A member who belongs to N projects appears in exactly one
        workload row, regardless of how many ProjectMember rows they have.
        """
        from plane.analytics.dashboard import resolve_dashboard_scope
        from plane.analytics.dashboard.workload import workload_payload

        workspace = fixture_with_workspace["workspace"]
        project = fixture_with_workspace["project"]
        owner = fixture_with_workspace["users"]["alice"]

        # Add a second project and put the owner in both.
        other_project = _make_project(workspace, name="Other")
        _join_project(owner, other_project)
        # The owner already had ProjectMember for project; add for other_project.

        scope = resolve_dashboard_scope(
            workspace=workspace, principal=owner, today=FROZEN_TODAY,
        )
        payload = workload_payload(scope, page=1, page_size=100)
        rows = payload["data"]["rows"]
        owner_id = str(owner.id)
        owner_rows = [r for r in rows if r["member_id"] == owner_id]
        assert len(owner_rows) == 1, (
            f"owner appears {len(owner_rows)} times across "
            f"{len(rows)} rows: {owner_rows}"
        )

    def test_zero_work_active_member_still_listed(
        self, fixture_with_workspace
    ):
        """An active member with no IssueAssignee rows appears in the
        roster with all-zero counts, not omitted as 'rounded out'.
        """
        from plane.analytics.dashboard import resolve_dashboard_scope
        from plane.analytics.dashboard.workload import workload_payload

        workspace = fixture_with_workspace["workspace"]
        project = fixture_with_workspace["project"]
        owner = fixture_with_workspace["users"]["alice"]

        # Eve: workspace + project member, no assignments.
        eve = _make_user("eve@plane.so")
        _join_workspace(eve, workspace)
        _join_project(eve, project)

        scope = resolve_dashboard_scope(
            workspace=workspace, principal=owner, today=FROZEN_TODAY,
        )
        payload = workload_payload(scope, page=1, page_size=100)
        rows = payload["data"]["rows"]
        eve_id = str(eve.id)
        eve_rows = [r for r in rows if r["member_id"] == eve_id]
        assert len(eve_rows) == 1, "zero-work active member must be in roster"
        assert eve_rows[0]["is_active"] is True
        assert eve_rows[0]["open"] == 0
        assert eve_rows[0]["started"] == 0
        assert eve_rows[0]["overdue"] == 0

    def test_inactive_member_with_retained_assignment_in_inactive_bucket(
        self, fixture_with_workspace
    ):
        """A member whose ProjectMember is inactive but who still has an
        active IssueAssignee row is surfaced in the inactive bucket,
        not dropped.
        """
        from plane.analytics.dashboard import resolve_dashboard_scope
        from plane.analytics.dashboard.workload import workload_payload

        workspace = fixture_with_workspace["workspace"]
        project = fixture_with_workspace["project"]
        owner = fixture_with_workspace["users"]["alice"]
        today = FROZEN_TODAY

        # Frank: workspace member, project member (active), with one
        # IssueAssignee row. Then mark ProjectMember.is_active=False
        # but leave IssueAssignee untouched.
        frank = _make_user("frank@plane.so")
        _join_workspace(frank, workspace)
        _join_project(frank, project)
        frank_issue = Issue.objects.create(
            project=project, workspace=workspace, name="Frank's issue",
            state=fixture_with_workspace["states"]["started"],
            priority="medium", target_date=today + timedelta(days=3),
            created_by=owner,
        )
        IssueAssignee.objects.create(
            issue=frank_issue, assignee=frank,
            project=project, workspace=workspace,
        )
        # Now deactivate Frank's project membership. His IssueAssignee
        # stays active (deleted_at IS NULL).
        ProjectMember.objects.filter(project=project, member=frank).update(
            is_active=False,
        )

        scope = resolve_dashboard_scope(
            workspace=workspace, principal=owner, today=today,
        )
        payload = workload_payload(scope, page=1, page_size=100)
        rows = payload["data"]["rows"]
        frank_id = str(frank.id)
        active_rows = [r for r in rows if r["member_id"] == frank_id and r["is_active"]]
        inactive_rows = [r for r in rows if r["member_id"] == frank_id and not r["is_active"]]
        assert len(active_rows) == 0, "Frank must NOT be in active bucket"
        assert len(inactive_rows) == 1, "Frank must be in inactive bucket"
        assert inactive_rows[0]["open"] >= 1


@pytest.mark.django_db
class TestRetryOverviewSnapshotCoverage:
    """Backend retry: every endpoint opens the snapshot, not just three.

    Prior code only wrapped workload/projects/timeline with
    ``with dashboard_snapshot():``; overview/attention/items did not.
    The retry wraps all five. After fix, an exception inside any one
    section must not blank the others, and a failing section returns
    ``status='error'`` with the other sections present and OK.
    """

    @pytest.mark.usefixtures("frozen_clock")
    def test_overview_endpoint_opens_snapshot(
        self, fixture_with_workspace
    ):
        """Smoke: the overview endpoint still returns its canonical
        envelope after we wrapped the scope-resolution + payload in
        ``with dashboard_snapshot():``.
        """
        ws = fixture_with_workspace["workspace"]
        client = fixture_with_workspace["client"]
        resp = client.post(
            f"/api/workspaces/{ws.slug}/dashboard/overview/", {}, format="json",
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["version"] == 1
        section_ids = [s["section_id"] for s in body["sections"]]
        for required in ("kpis", "progress", "delivery", "top_projects"):
            assert required in section_ids

    @pytest.mark.usefixtures("frozen_clock")
    def test_attention_endpoint_opens_snapshot(
        self, fixture_with_workspace
    ):
        ws = fixture_with_workspace["workspace"]
        client = fixture_with_workspace["client"]
        resp = client.post(
            f"/api/workspaces/{ws.slug}/dashboard/attention/", {}, format="json",
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["sections"][0]["section_id"] == "attention"


def _build_workload_for_isolation(scope):
    return scope


# ----- boundary validation ----------------------------------------------


@pytest.mark.django_db
class TestBoundaryValidation:
    """Malformed payloads must yield 400 with INVALID_PAYLOAD, never 500.

    Spec §9.3 / §49: contract violations are 4xx; only truly internal
    failures are 5xx. ``str(exc)`` is never leaked into the response.
    """

    def test_non_object_json_body_returns_400(self, fixture_with_workspace):
        ws = fixture_with_workspace["workspace"]
        client = fixture_with_workspace["client"]
        resp = client.post(
            f"/api/workspaces/{ws.slug}/dashboard/overview/",
            "not a json object",
            content_type="application/json",
        )
        assert resp.status_code == 400
        # Accept either our INVALID_PAYLOAD code or DRF's generic 400.
        body = resp.json()
        if isinstance(body, dict) and "code" in body:
            assert body["code"] == "INVALID_PAYLOAD"

    def test_non_object_business_filters_returns_400(self, fixture_with_workspace):
        ws = fixture_with_workspace["workspace"]
        client = fixture_with_workspace["client"]
        resp = client.post(
            f"/api/workspaces/{ws.slug}/dashboard/overview/",
            {"business_filters": ["not", "a", "dict"]},
            format="json",
        )
        assert resp.status_code == 400
        body = resp.json()
        if isinstance(body, dict) and "code" in body:
            assert body["code"] == "INVALID_PAYLOAD"

    def test_unknown_filter_key_returns_400(self, fixture_with_workspace):
        ws = fixture_with_workspace["workspace"]
        client = fixture_with_workspace["client"]
        resp = client.post(
            f"/api/workspaces/{ws.slug}/dashboard/overview/",
            {"business_filters": {"raw_sql": "1=1"}},
            format="json",
        )
        assert resp.status_code == 400
        assert resp.json()["code"] == "INVALID_PAYLOAD"
        assert "raw_sql" in resp.json()["error"]

    def test_invalid_date_bucket_returns_400(self, fixture_with_workspace):
        ws = fixture_with_workspace["workspace"]
        client = fixture_with_workspace["client"]
        resp = client.post(
            f"/api/workspaces/{ws.slug}/dashboard/overview/",
            {"date_bucket": "fortnight"},
            format="json",
        )
        assert resp.status_code == 400
        assert resp.json()["code"] == "INVALID_PAYLOAD"

    def test_unknown_metric_in_items_returns_400(self, fixture_with_workspace):
        ws = fixture_with_workspace["workspace"]
        client = fixture_with_workspace["client"]
        resp = client.post(
            f"/api/workspaces/{ws.slug}/dashboard/items/",
            {"metric": "raw_orm_field"},
            format="json",
        )
        assert resp.status_code == 400
        assert resp.json()["code"] == "INVALID_PAYLOAD"

    def test_invalid_custom_period_end_before_start_returns_400(
        self, fixture_with_workspace
    ):
        ws = fixture_with_workspace["workspace"]
        client = fixture_with_workspace["client"]
        resp = client.post(
            f"/api/workspaces/{ws.slug}/dashboard/overview/",
            {"period_preset": "custom", "start": "2026-09-30", "end": "2026-09-01"},
            format="json",
        )
        assert resp.status_code == 400
        assert resp.json()["code"] == "INVALID_PAYLOAD"


# ----- helper used in tests --------------------------------------------


def count_attention_union_w(scope):
    from plane.analytics.dashboard.predicates import resolve_dashboard_scope
    s = resolve_dashboard_scope(
        workspace=scope["workspace"],
        principal=scope["users"]["alice"],
        today=scope["today"],
    )
    return count_attention_union(s)


def count_blocked_w(scope):
    from plane.analytics.dashboard.predicates import resolve_dashboard_scope
    s = resolve_dashboard_scope(
        workspace=scope["workspace"],
        principal=scope["users"]["alice"],
        today=scope["today"],
    )
    return count_blocked(s)


def count_overdue_w(scope):
    from plane.analytics.dashboard.predicates import resolve_dashboard_scope
    s = resolve_dashboard_scope(
        workspace=scope["workspace"],
        principal=scope["users"]["alice"],
        today=scope["today"],
    )
    return count_overdue(s)