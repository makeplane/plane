# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Timeline read model for the Team Operations Dashboard.

Three independently paginated sections:

* ``cycle_lanes``: project cycles overlapping the scope period.
* ``deadlines``: upcoming open issues with target_date in the next 7
  days, scoped to workspace timezone.
* ``unscheduled_cycles``: cycles with missing start/end dates (never
  fabricated coordinates).

Cycles use their actual schedule dates — no ideal-burndown
fabrication, no invented history.
"""

from __future__ import annotations

from datetime import timedelta
from typing import Any, Dict

from django.db.models import Count, Q

from .contracts import DashboardContractError, DashboardScope
from .predicates import _open_q, _overdue_q, operational_queryset


def timeline_payload(
    scope: DashboardScope,
    *,
    cycles_page: int = 1,
    deadlines_page: int = 1,
    unscheduled_page: int = 1,
    page_size: int = 25,
) -> Dict[str, Any]:
    """Compose the timeline section payload under the dashboard snapshot.

    Each of the three sub-lists (``cycles``, ``deadlines``,
    ``unscheduled``) is independently paginated so the UI can show one
    list at a time without an ambiguous shared pager.
    """
    for name, page in (
        ("cycles_page", cycles_page),
        ("deadlines_page", deadlines_page),
        ("unscheduled_page", unscheduled_page),
    ):
        if page < 1:
            raise DashboardContractError(f"{name} must be >= 1")
    if not (1 <= page_size <= 100):
        raise DashboardContractError(f"page_size must be 1..100; got {page_size}")

    return _build_timeline(
        scope,
        cycles_page=cycles_page,
        deadlines_page=deadlines_page,
        unscheduled_page=unscheduled_page,
        page_size=page_size,
    )


def _build_timeline(
    scope: DashboardScope,
    *,
    cycles_page: int,
    deadlines_page: int,
    unscheduled_page: int,
    page_size: int,
) -> Dict[str, Any]:
    from plane.db.models import Cycle, Issue

    cycles_qs = _cycles_queryset(scope)
    unscheduled_qs = _unscheduled_cycles_queryset(scope)
    deadlines_qs = _deadlines_queryset(scope)

    # Independent pagination for each list.
    total_cycles_in_scope = cycles_qs.count() + unscheduled_qs.count()

    cycles_total = cycles_qs.count()
    cs, ce = _page_slice(cycles_page, page_size)
    cycles_rows = list(
        cycles_qs.order_by("start_date", "name")[cs:ce].values(
            "id", "name", "start_date", "end_date", "project_id", "project__name"
        )
    )

    unscheduled_total = unscheduled_qs.count()
    us, ue = _page_slice(unscheduled_page, page_size)
    unscheduled_rows = list(
        unscheduled_qs.order_by("name")[us:ue].values(
            "id", "name", "project_id", "project__name"
        )
    )

    deadlines_total = deadlines_qs.count()
    ds, de = _page_slice(deadlines_page, page_size)
    deadlines_rows = list(
        deadlines_qs.order_by("target_date", "sequence_id")[ds:de].values(
            "id",
            "name",
            "sequence_id",
            "target_date",
            "priority",
            "project_id",
            "project__name",
        )
    )

    deadline_payload = []
    from plane.db.models import IssueAssignee
    for r in deadlines_rows:
        owners = list(
            IssueAssignee.objects.filter(
                issue_id=r["id"], deleted_at__isnull=True,
            ).values_list("assignee_id", flat=True)
        )
        target = r["target_date"]
        days_until = (target - scope.today).days if target else None
        deadline_payload.append(
            {
                "issue_id": str(r["id"]),
                "sequence_id": r["sequence_id"],
                "name": r["name"],
                "project_id": str(r["project_id"]),
                "project_name": r["project__name"],
                "target_date": target.isoformat() if target else None,
                "days_until_due": days_until,
                "priority": r["priority"],
                "owner_ids": [str(o) for o in owners],
            }
        )

    cycle_payload = []
    for r in cycles_rows:
        overdue_count = _cycle_overdue_issue_count(scope, r["id"])
        progress = _cycle_progress_fraction(scope, r["id"])
        cycle_payload.append(
            {
                "cycle_id": str(r["id"]),
                "cycle_name": r["name"],
                "project_id": str(r["project_id"]),
                "project_name": r["project__name"],
                "start": r["start_date"].date().isoformat() if r["start_date"] else None,
                "end": r["end_date"].date().isoformat() if r["end_date"] else None,
                "status": _cycle_status(r, scope.today),
                "progress": round(progress, 4) if progress is not None else None,
                "overdue_badge": int(overdue_count),
                "issue_count": _cycle_issue_count(scope, r["id"]),
            }
        )

    unscheduled_payload = [
        {
            "cycle_id": str(r["id"]),
            "cycle_name": r["name"],
            "project_id": str(r["project_id"]),
            "reason": "missing_start_or_end",
        }
        for r in unscheduled_rows
    ]

    return {
        "section_id": "timeline",
        "status": "ok",
        "data": {
            "cycle_lanes": {
                "rows": cycle_payload,
                "total": cycles_total,
                "pagination": {
                    "page": cycles_page,
                    "page_size": page_size,
                    "has_more": ce < cycles_total,
                },
            },
            "deadlines": {
                "rows": deadline_payload,
                "total": deadlines_total,
                "pagination": {
                    "page": deadlines_page,
                    "page_size": page_size,
                    "has_more": de < deadlines_total,
                },
            },
            "unscheduled_cycles": {
                "rows": unscheduled_payload,
                "total": unscheduled_total,
                "pagination": {
                    "page": unscheduled_page,
                    "page_size": page_size,
                    "has_more": ue < unscheduled_total,
                },
            },
            "total_cycles_in_scope": total_cycles_in_scope,
            "scope_key": scope.scope_key,
        },
    }


def _page_slice(page: int, page_size: int):
    start = (page - 1) * page_size
    end = start + page_size
    return start, end


def _cycles_queryset(scope: DashboardScope):
    """Cycles that overlap the scope period AND have both dates.

    Cycles without start_date or end_date are routed to the
    unscheduled section instead.
    """
    from plane.db.models import Cycle
    qs = Cycle.objects.filter(
        project_id__in=scope.visible_project_ids,
        project__deleted_at__isnull=True,
        start_date__isnull=False,
        end_date__isnull=False,
    )
    if scope.period.start is not None and scope.period.end is not None:
        qs = qs.filter(start_date__lt=scope.period.end, end_date__gt=scope.period.start)
    return qs


def _unscheduled_cycles_queryset(scope: DashboardScope):
    from plane.db.models import Cycle
    return Cycle.objects.filter(
        project_id__in=scope.visible_project_ids,
        project__deleted_at__isnull=True,
    ).filter(Q(start_date__isnull=True) | Q(end_date__isnull=True))


def _deadlines_queryset(scope: DashboardScope):
    """Open issues with target_date in [today, today+7)."""
    qs = operational_queryset(scope).filter(_open_q())
    qs = qs.filter(
        target_date__gte=scope.today,
        target_date__lt=scope.today + timedelta(days=7),
    )
    return qs


def _cycle_status(cycle_row: Dict[str, Any], today) -> str:
    """Pure schedule status, no invented history."""
    start = cycle_row["start_date"]
    end = cycle_row["end_date"]
    if not start or not end:
        return "upcoming"
    if start.date() > today:
        return "upcoming"
    if end.date() < today:
        return "completed"
    return "active"


def _cycle_progress_fraction(scope: DashboardScope, cycle_id: str) -> float | None:
    from plane.db.models import CycleIssue

    counts = CycleIssue.objects.filter(
        cycle_id=cycle_id,
        issue__in=operational_queryset(scope).values("id"),
        deleted_at__isnull=True,
    ).aggregate(
        total=Count("issue", distinct=True),
        done=Count(
            "issue",
            filter=Q(issue__state__group="completed"),
            distinct=True,
        ),
    )
    total = counts["total"] or 0
    done = counts["done"] or 0
    return (done / total) if total > 0 else None


def _cycle_issue_count(scope: DashboardScope, cycle_id: str) -> int:
    from plane.db.models import CycleIssue

    return CycleIssue.objects.filter(
        cycle_id=cycle_id,
        issue__in=operational_queryset(scope).values("id"),
        deleted_at__isnull=True,
    ).values("issue").distinct().count()


def _cycle_overdue_issue_count(scope: DashboardScope, cycle_id: str) -> int:
    from plane.db.models import CycleIssue

    return CycleIssue.objects.filter(
        cycle_id=cycle_id,
        issue__in=operational_queryset(scope)
        .filter(_overdue_q(scope.today))
        .values("id"),
        deleted_at__isnull=True,
    ).values("issue").distinct().count()