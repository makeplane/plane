# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Projects read model for the Team Operations Dashboard.

Shape (per ``/tmp/plane-dashboard-api-contract.json``):

* ``rows``: one row per visible project with five state_group counts,
  total, cancelled, open/started/completed/completed_in_period/overdue/
  blocked, completion_rate, next_deadline.
* ``distinct_totals``: workspace-wide distinct issue counts (NOT the
  sum of project rows).
* ``pagination``: page / page_size / has_more.
"""

from __future__ import annotations

from typing import Any, Dict, List

from django.db.models import Count, Q, QuerySet

from .contracts import DashboardContractError, DashboardScope
from .predicates import (
    _blocked_q,
    _open_q,
    _overdue_q,
    operational_queryset,
)


def projects_payload(
    scope: DashboardScope,
    *,
    page: int = 1,
    page_size: int = 25,
) -> Dict[str, Any]:
    if page < 1:
        raise DashboardContractError("page must be >= 1")
    if not (1 <= page_size <= 100):
        raise DashboardContractError(f"page_size must be 1..100; got {page_size}")

    return _build_projects(scope, page=page, page_size=page_size)


def _build_projects(
    scope: DashboardScope, *, page: int, page_size: int
) -> Dict[str, Any]:
    if not scope.visible_project_ids:
        empty = {
            "total": 0,
            "open": 0,
            "started": 0,
            "completed": 0,
            "completed_in_period": 0,
            "overdue": 0,
            "blocked": 0,
            "completion_rate": None,
        }
        return {
            "section_id": "projects",
            "status": "ok",
            "data": {
                "rows": [],
                "total_count": 0,
                "distinct_totals": empty,
                "pagination": {"page": page, "page_size": page_size, "has_more": False},
                "scope_key": scope.scope_key,
            },
        }

    base = operational_queryset(scope)
    overdue_q = _overdue_q(scope.today)
    blocked_q = _blocked_q(scope)
    completed_period_q = Q(state__group="completed")
    if scope.period.start is not None:
        completed_period_q &= Q(completed_at__gte=scope.period.start)
    if scope.period.end is not None:
        completed_period_q &= Q(completed_at__lt=scope.period.end)

    # next_deadline = nearest UPCOMING open dated item.
    # _open_q() alone would include overdue rows; the contract is
    # "nearest upcoming", so we restrict to target_date >= scope.today.
    upcoming_open_q = (
        Q(state__group__in=["backlog", "unstarted", "started"])
        & Q(target_date__isnull=False, target_date__gte=scope.today)
    )

    rows_qs = (
        base.values(
            "project_id", "project__name",
        )
        .annotate(
            backlog=Count("id", filter=Q(state__group="backlog"), distinct=True),
            unstarted=Count("id", filter=Q(state__group="unstarted"), distinct=True),
            started=Count("id", filter=Q(state__group="started"), distinct=True),
            completed=Count("id", filter=Q(state__group="completed"), distinct=True),
            cancelled=Count("id", filter=Q(state__group="cancelled"), distinct=True),
            open_total=Count("id", filter=_open_q(), distinct=True),
            overdue=Count("id", filter=overdue_q, distinct=True),
            blocked=Count("id", filter=blocked_q, distinct=True),
            completed_in_period=Count("id", filter=completed_period_q, distinct=True),
            total=Count("id", distinct=True),
            next_deadline_target=__import__("django.db.models", fromlist=["Min"]).Min(
                "target_date", filter=upcoming_open_q
            ),
        )
    )

    total_count = rows_qs.count()
    start = (page - 1) * page_size
    end = start + page_size

    raw_rows = list(rows_qs.order_by("-overdue", "-blocked", "-open_total", "project__name")[start:end])

    rows = []
    for r in raw_rows:
        total = int(r["total"] or 0)
        cancelled = int(r["cancelled"] or 0)
        denom = total - cancelled
        completion_rate = (r["completed"] / denom) if denom > 0 else None
        next_deadline = r["next_deadline_target"].isoformat() if r["next_deadline_target"] else None
        rows.append(
            {
                "project_id": str(r["project_id"]),
                "name": r["project__name"],
                "state_groups": {
                    "backlog": int(r["backlog"]),
                    "unstarted": int(r["unstarted"]),
                    "started": int(r["started"]),
                    "completed": int(r["completed"]),
                    "cancelled": int(r["cancelled"]),
                },
                "total": total,
                "cancelled": cancelled,
                "open": int(r["open_total"]),
                "started": int(r["started"]),
                "completed": int(r["completed"]),
                "completed_in_period": int(r["completed_in_period"]),
                "overdue": int(r["overdue"]),
                "blocked": int(r["blocked"]),
                "completion_rate": round(completion_rate, 4) if completion_rate is not None else None,
                "next_deadline": next_deadline,
            }
        )

    # Distinct workspace totals (NOT summed across project rows).
    distinct = {
        "total": base.values("id").distinct().count(),
        "open": base.filter(_open_q()).values("id").distinct().count(),
        "started": base.filter(state__group="started").values("id").distinct().count(),
        "overdue": base.filter(overdue_q).values("id").distinct().count(),
        "blocked": base.filter(blocked_q).values("id").distinct().count(),
        "completed_in_period": base.filter(completed_period_q).values("id").distinct().count(),
        "completion_rate": _overall_completion_rate(scope),
    }

    return {
        "section_id": "projects",
        "status": "ok",
        "data": {
            "rows": rows,
            "total_count": total_count,
            "distinct_totals": distinct,
            "pagination": {"page": page, "page_size": page_size, "has_more": end < total_count},
            "scope_key": scope.scope_key,
        },
    }


def _overall_completion_rate(scope: DashboardScope) -> float | None:
    qs = operational_queryset(scope)
    total = qs.values("id").distinct().count()
    cancelled = qs.filter(state__group="cancelled").values("id").distinct().count()
    completed = qs.filter(state__group="completed").values("id").distinct().count()
    denom = total - cancelled
    return round(completed / denom, 4) if denom > 0 else None