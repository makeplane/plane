# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Workload read model for the Team Operations Dashboard.

Shape (per ``/tmp/plane-dashboard-api-contract.json``):

* ``rows``: one row per roster member with per-member state counts.
* ``distinct_totals``: workspace-wide distinct issue counts (never
  summed across members).
* ``unassigned``: counts for issues with no active IssueAssignee row.
* ``inactive``: counts for assignments to inactive former members
  (distinct issue union, not summed across members).
* ``wip_threshold``: optional, rule-based; never a capacity inference.
* ``wip_warning_reason``: explicit reason string, never productivity.

The roster includes zero-work active members (so the panel shows
"Member X has 0 issues in scope", not "rounded out").

Per-assignee full credit: an issue assigned to two members counts in
both rows. The distinct_totals are NOT the sum of rows; they are a
distinct issue count computed across the workspace.

This read model does NOT open its own transaction; the endpoint is
responsible for opening the REPEATABLE READ snapshot before the
read model runs (see :mod:`plane.analytics.dashboard.snapshot`).
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Sequence, Tuple

from django.db.models import Count, Exists, OuterRef, Q, QuerySet

from .contracts import DashboardContractError, DashboardScope
from .predicates import (
    _blocked_q,
    _due_soon_q,
    _open_q,
    _overdue_q,
    operational_queryset,
)
from .workload_breakdown import attach_workload_breakdowns


# WIP threshold defaults to 5 issues started per member (spec §6.5).
# It is a rule, not a productivity inference — the threshold is
# configurable and only used to surface a warning, never to compute
# capacity / "120% overloaded" / similar.
DEFAULT_WIP_THRESHOLD = 5


def workload_payload(
    scope: DashboardScope,
    *,
    page: int = 1,
    page_size: int = 25,
    wip_threshold: Optional[int] = None,
    preview: bool = False,
    breakdown_by: Optional[str] = None,
    breakdown_limit: int = 5,
) -> Dict[str, Any]:
    """Compose the workload section payload.

    Must run inside a dashboard_snapshot() transaction opened by the
    endpoint (so all sections share an MVCC snapshot). This function
    does NOT open one itself — that would be a nested transaction that
    cannot change isolation.

    Preview mode
    ------------
    When ``preview=True`` the endpoint treats ``page_size`` as the
    "top N risk-ordered members" cap and ignores ``page``. The full
    roster is computed, ordered by risk score (overdue + blocked +
    due_soon + started beyond WIP threshold), then sliced to
    ``page_size`` rows. This guarantees the preview shows the highest-
    risk team members, NOT the first N by name (coordinator finding
    msg_b9fc44af755f / msg_22648b31542f).
    """
    if page < 1:
        raise DashboardContractError("page must be >= 1")
    if not (1 <= page_size <= 100):
        raise DashboardContractError(f"page_size must be 1..100; got {page_size}")

    threshold = wip_threshold if wip_threshold is not None else DEFAULT_WIP_THRESHOLD
    return _build_workload(
        scope,
        page=page,
        page_size=page_size,
        threshold=threshold,
        preview=preview,
        breakdown_by=breakdown_by,
        breakdown_limit=breakdown_limit,
    )


def _build_workload(
    scope: DashboardScope, *, page: int, page_size: int, threshold: int,
    preview: bool = False,
    breakdown_by: Optional[str] = None,
    breakdown_limit: int = 5,
) -> Dict[str, Any]:
    """Build the workload payload. Caller must wrap this in a snapshot."""
    from plane.db.models import IssueAssignee, ProjectMember, User

    visible_projects = scope.visible_project_ids

    # Roster: distinct active workspace members who are members of at
    # least one visible project. A member in N projects → one row
    # (distinct member_id). Zero-work members are still listed.
    if not visible_projects:
        return _empty_workload(page=page, page_size=page_size)

    members_qs = (
        ProjectMember.objects.filter(
            project_id__in=visible_projects,
            is_active=True,
        )
        .values("member_id")
        .distinct()
        .order_by("member_id")
    )
    member_ids = list(members_qs.values_list("member_id", flat=True))

    # Inactive / former members who still hold readable IssueAssignee
    # rows (their ProjectMember was removed or set inactive, but they
    # still have assignments). They appear in the inactive bucket.
    active_member_ids = set(member_ids)
    inactive_member_ids = set(
        IssueAssignee.objects.filter(
            deleted_at__isnull=True,
            assignee_id__isnull=False,
            issue__in=operational_queryset(scope).values("id"),
        )
        .exclude(assignee_id__in=active_member_ids)
        .values_list("assignee_id", flat=True)
        .distinct()
    )

    # Load profiles for the UNION of active + inactive IDs (bounded
    # batch) so former members render correct display_name / avatar.
    # Coordinator finding msg_b9fc44af755f: the prior implementation
    # only fetched profiles for ACTIVE member IDs, so all inactive
    # rows had blank display_name and avatar_url.
    all_member_ids = list(active_member_ids | inactive_member_ids)
    member_profiles = {
        m["id"]: m
        for m in User.objects.filter(id__in=all_member_ids).values(
            "id", "email", "first_name", "last_name", "avatar",
        )
    }

    # Per-member aggregate FROM Issue, grouped by active IssueAssignee.
    # Each predicate filters Issue rows; the outer grouping is by
    # assignee. Full credit: an issue with two assignees appears in
    # both rows' counts.
    active_assignees = IssueAssignee.objects.filter(
        assignee_id__in=member_ids,
        deleted_at__isnull=True,
        issue__in=operational_queryset(scope).values("id"),
    ).values("assignee_id", "issue_id")

    aggregate = (
        operational_queryset(scope)
        .filter(
            id__in=active_assignees.values("issue_id"),
            issue_assignee__assignee_id__in=member_ids,
            issue_assignee__deleted_at__isnull=True,
        )
        .values("issue_assignee__assignee_id")
        .annotate(
            open_count=Count(
                "id", filter=_open_q(), distinct=True,
            ),
            started_count=Count(
                "id", filter=Q(state__group="started"), distinct=True,
            ),
            overdue_count=Count("id", filter=_overdue_q(scope.today), distinct=True),
            blocked_count=Count("id", filter=_blocked_q(scope), distinct=True),
            due_soon_count=Count("id", filter=_due_soon_q(scope.today), distinct=True),
            completed_in_period_count=_completed_in_period_aggregate(scope),
        )
    )
    by_member = {row["issue_assignee__assignee_id"]: row for row in aggregate}

    # Build roster rows in a stable order (active first, then name).
    rows: List[Dict[str, Any]] = []
    for mid in member_ids:
        profile = member_profiles.get(mid, {})
        agg = by_member.get(mid, {})
        display_name = (
            " ".join(filter(None, [profile.get("first_name", ""), profile.get("last_name", "")]))
            or profile.get("email", "")
        )
        rows.append(
            {
                "member_id": str(mid),
                "display_name": display_name,
                "avatar_url": profile.get("avatar"),
                # Active here means an active ProjectMember row, not the
                # user's account activation flag (User.is_active).
                "is_active": True,
                "open": int(agg.get("open_count", 0)),
                "started": int(agg.get("started_count", 0)),
                "overdue": int(agg.get("overdue_count", 0)),
                "blocked": int(agg.get("blocked_count", 0)),
                "due_soon": int(agg.get("due_soon_count", 0)),
                "completed_in_period": int(agg.get("completed_in_period_count", 0)),
            }
        )

    rows.extend(_inactive_rows(scope, inactive_member_ids, member_profiles))

    if preview:
        # PREVIEW MODE: full-roster risk sort BEFORE slicing.
        # Risk score = overdue*5 + blocked*4 + due_soon*2 +
        # max(started - wip_threshold, 0). Ties broken by
        # display_name so the order is deterministic.
        def _risk(r: Dict[str, Any]) -> Tuple[int, str]:
            wip_excess = max(r["started"] - threshold, 0)
            score = (
                r["overdue"] * 5
                + r["blocked"] * 4
                + r["due_soon"] * 2
                + wip_excess
            )
            return (-score, (r["display_name"] or "").lower())

        rows.sort(key=_risk)
        # Preview ignores page; slice to top page_size.
        page_rows = rows[:page_size]
        total_members = len(rows)
        has_more = total_members > page_size
    else:
        # Stable order: by display_name (with inactive rows appended at end).
        rows.sort(
            key=lambda r: (
                not r["is_active"],
                (r["display_name"] or "").lower(),
            )
        )
        total_members = len(rows)
        start = (page - 1) * page_size
        end = start + page_size
        page_rows = rows[start:end]
        has_more = end < total_members

    # WIP warnings: rule-based, never productivity. A warning is raised
    # for any active member whose started_count exceeds the threshold.
    wip_warning_member_ids = [
        r["member_id"] for r in page_rows
        if r["is_active"] and r["started"] > threshold
    ]

    distinct = _distinct_totals(scope)
    unassigned_row = _unassigned_row(scope)
    inactive_row = _inactive_summary(scope, inactive_member_ids)

    attach_workload_breakdowns(
        scope,
        page_rows,
        breakdown_by=breakdown_by,
        slice_limit=breakdown_limit,
    )

    return {
        "section_id": "workload",
        "status": "ok",
        "data": {
            "rows": page_rows,
            "total_members": total_members,
            "distinct_totals": distinct,
            "unassigned": unassigned_row,
            "inactive": inactive_row,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "has_more": has_more,
                "preview": preview,
            },
            "wip_threshold": threshold,
            "wip_warning_reason": (
                "rule_based_high_started_per_member"
                if wip_warning_member_ids else None
            ),
            "wip_warning_member_ids": wip_warning_member_ids,
            "scope_key": scope.scope_key,
        },
    }


def _inactive_rows(
    scope: DashboardScope,
    inactive_member_ids: set,
    member_profiles: Dict[Any, Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Per-inactive-member aggregate rows."""
    from plane.db.models import IssueAssignee, User

    if not inactive_member_ids:
        return []

    active_assignees = IssueAssignee.objects.filter(
        assignee_id__in=inactive_member_ids,
        deleted_at__isnull=True,
        issue__in=operational_queryset(scope).values("id"),
    ).values("assignee_id", "issue_id")

    aggregate = (
        operational_queryset(scope)
        .filter(
            id__in=active_assignees.values("issue_id"),
            issue_assignee__assignee_id__in=inactive_member_ids,
            issue_assignee__deleted_at__isnull=True,
        )
        .values("issue_assignee__assignee_id")
        .annotate(
            open_count=Count("id", filter=_open_q(), distinct=True),
            started_count=Count("id", filter=Q(state__group="started"), distinct=True),
            overdue_count=Count("id", filter=_overdue_q(scope.today), distinct=True),
            blocked_count=Count("id", filter=_blocked_q(scope), distinct=True),
            due_soon_count=Count("id", filter=_due_soon_q(scope.today), distinct=True),
            completed_in_period_count=_completed_in_period_aggregate(scope),
        )
    )
    by_member = {row["issue_assignee__assignee_id"]: row for row in aggregate}
    rows = []
    for mid in sorted(inactive_member_ids):
        agg = by_member.get(mid, {})
        profile = member_profiles.get(mid, {})
        display_name = (
            " ".join(filter(None, [profile.get("first_name", ""), profile.get("last_name", "")]))
            or profile.get("email", "")
        )
        rows.append(
            {
                "member_id": str(mid),
                "display_name": display_name,
                "avatar_url": profile.get("avatar"),
                "is_active": False,
                "open": int(agg.get("open_count", 0)),
                "started": int(agg.get("started_count", 0)),
                "overdue": int(agg.get("overdue_count", 0)),
                "blocked": int(agg.get("blocked_count", 0)),
                "due_soon": int(agg.get("due_soon_count", 0)),
                "completed_in_period": int(agg.get("completed_in_period_count", 0)),
            }
        )
    return rows


def _completed_in_period_aggregate(scope: DashboardScope):
    """Return the annotation kwarg for completed_in_period on Issue."""
    cond = Q(state__group="completed")
    if scope.period.start is not None:
        cond &= Q(completed_at__gte=scope.period.start)
    if scope.period.end is not None:
        cond &= Q(completed_at__lt=scope.period.end)
    return Count("id", filter=cond, distinct=True)


def _empty_workload(*, page: int, page_size: int) -> Dict[str, Any]:
    empty = {"total": 0, "open": 0, "started": 0, "overdue": 0, "blocked": 0, "due_soon": 0, "completed_in_period": 0}
    return {
        "section_id": "workload",
        "status": "ok",
        "data": {
            "rows": [],
            "total_members": 0,
            "distinct_totals": empty,
            "unassigned": empty,
            "inactive": {"member_count": 0, **empty},
            "pagination": {"page": page, "page_size": page_size, "has_more": False},
            "wip_threshold": DEFAULT_WIP_THRESHOLD,
            "wip_warning_reason": None,
            "wip_warning_member_ids": [],
            "scope_key": "",
        },
    }


def _distinct_totals(scope: DashboardScope) -> Dict[str, int]:
    qs = operational_queryset(scope)
    completed_period = Q(state__group="completed")
    if scope.period.start is not None:
        completed_period &= Q(completed_at__gte=scope.period.start)
    if scope.period.end is not None:
        completed_period &= Q(completed_at__lt=scope.period.end)
    return {
        "total": qs.values("id").distinct().count(),
        "open": qs.filter(_open_q()).values("id").distinct().count(),
        "started": qs.filter(state__group="started").values("id").distinct().count(),
        "overdue": qs.filter(_overdue_q(scope.today)).values("id").distinct().count(),
        "blocked": qs.filter(_blocked_q(scope)).values("id").distinct().count(),
        "due_soon": qs.filter(_due_soon_q(scope.today)).values("id").distinct().count(),
        "completed_in_period": qs.filter(completed_period).values("id").distinct().count(),
    }


def _unassigned_row(scope: DashboardScope) -> Dict[str, int]:
    """Counts for open issues with no active IssueAssignee row.

    ``completed_in_period`` is computed against the scope's period
    (completed work can be unassigned at the moment of completion).
    """
    from plane.db.models import IssueAssignee

    qs = operational_queryset(scope)
    has_assignee = IssueAssignee.objects.filter(
        issue=OuterRef("pk"), deleted_at__isnull=True
    )
    qs_no_assignee = qs.annotate(_has_assignee=Exists(has_assignee)).filter(_has_assignee=False)

    overdue_q = _overdue_q(scope.today)
    blocked_q = _blocked_q(scope)
    due_soon_q = _due_soon_q(scope.today)
    completed_period = Q(state__group="completed")
    if scope.period.start is not None:
        completed_period &= Q(completed_at__gte=scope.period.start)
    if scope.period.end is not None:
        completed_period &= Q(completed_at__lt=scope.period.end)

    return {
        "open": qs_no_assignee.filter(_open_q()).values("id").distinct().count(),
        "started": qs_no_assignee.filter(state__group="started").values("id").distinct().count(),
        "overdue": qs_no_assignee.filter(overdue_q).values("id").distinct().count(),
        "blocked": qs_no_assignee.filter(blocked_q).values("id").distinct().count(),
        "due_soon": qs_no_assignee.filter(due_soon_q).values("id").distinct().count(),
        "completed_in_period": qs_no_assignee.filter(completed_period).values("id").distinct().count(),
    }


def _inactive_summary(scope: DashboardScope, inactive_member_ids: set) -> Dict[str, Any]:
    """Counts of issues assigned to inactive former members.

    Per coordinator contract: distinct issue union — if an issue is
    assigned to BOTH an active and an inactive member, it counts here
    because at least one assignee is inactive (label semantics, not
    sum semantics). Counts include all state buckets AND
    completed_in_period.
    """
    from plane.db.models import IssueAssignee

    empty = {"open": 0, "started": 0, "overdue": 0, "blocked": 0, "due_soon": 0, "completed_in_period": 0}
    if not inactive_member_ids:
        return {"member_count": 0, **empty}

    inactive_link = IssueAssignee.objects.filter(
        issue=OuterRef("pk"),
        deleted_at__isnull=True,
        assignee_id__in=list(inactive_member_ids),
    )
    qs = operational_queryset(scope).annotate(
        _has_inactive=Exists(inactive_link),
    ).filter(_has_inactive=True)

    overdue_q = _overdue_q(scope.today)
    blocked_q = _blocked_q(scope)
    due_soon_q = _due_soon_q(scope.today)
    completed_period = Q(state__group="completed")
    if scope.period.start is not None:
        completed_period &= Q(completed_at__gte=scope.period.start)
    if scope.period.end is not None:
        completed_period &= Q(completed_at__lt=scope.period.end)

    return {
        "member_count": len(inactive_member_ids),
        "open": qs.filter(_open_q()).values("id").distinct().count(),
        "started": qs.filter(state__group="started").values("id").distinct().count(),
        "overdue": qs.filter(overdue_q).values("id").distinct().count(),
        "blocked": qs.filter(blocked_q).values("id").distinct().count(),
        "due_soon": qs.filter(due_soon_q).values("id").distinct().count(),
        "completed_in_period": qs.filter(completed_period).values("id").distinct().count(),
    }