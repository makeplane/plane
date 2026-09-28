# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Open-work grouping for the Operations Dashboard overview.

Teams that share one project often slice work by label instead of cycle/module.
This read model aggregates **open** issues (current snapshot) into buckets for
``project``, ``module``, ``cycle``, or ``label``. Multi-valued relations use
full credit: an issue with two labels appears in both label rows.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from django.db.models import Count, Exists, OuterRef, Q

from .contracts import DashboardContractError, DashboardScope
from .predicates import _blocked_q, _open_q, _overdue_q, operational_queryset

VALID_WORK_ITEMS_GROUP_BY = frozenset({"project", "module", "cycle", "label"})

DEFAULT_GROUP_LIMIT = 10
MAX_GROUP_LIMIT = 50


def work_items_group_payload(
    scope: DashboardScope,
    *,
    group_by: str,
    limit: int = DEFAULT_GROUP_LIMIT,
) -> Dict[str, Any]:
    if group_by not in VALID_WORK_ITEMS_GROUP_BY:
        raise DashboardContractError(
            f"group_by must be one of {sorted(VALID_WORK_ITEMS_GROUP_BY)}; got {group_by!r}"
        )
    if not (1 <= limit <= MAX_GROUP_LIMIT):
        raise DashboardContractError(f"limit must be between 1 and {MAX_GROUP_LIMIT}")

    base = operational_queryset(scope).filter(_open_q())
    builders = {
        "project": _group_by_project,
        "module": _group_by_module,
        "cycle": _group_by_cycle,
        "label": _group_by_label,
    }
    rows, unbucketed = builders[group_by](scope, base, limit=limit)
    return {
        "group_by": group_by,
        "rows": rows,
        "shown": len(rows),
        "includes_unbucketed": unbucketed is not None,
        "unbucketed": unbucketed,
    }


def _annotate_counts(scope: DashboardScope, qs, *, group_fields: List[str]) -> Any:
    from django.db.models import Q as DQ

    started_q = DQ(state__group="started")
    return (
        qs.values(*group_fields)
        .annotate(
            open_count=Count("id", distinct=True),
            started_count=Count("id", filter=started_q, distinct=True),
            overdue_count=Count("id", filter=_overdue_q(scope.today), distinct=True),
            blocked_count=Count("id", filter=_blocked_q(scope), distinct=True),
        )
        .order_by("-overdue_count", "-blocked_count", "-open_count")
    )


def _row_from_agg(
    *,
    group_id: Optional[str],
    name: str,
    row: Dict[str, Any],
) -> Dict[str, Any]:
    return {
        "group_id": group_id,
        "name": name,
        "open": int(row["open_count"]),
        "started": int(row["started_count"]),
        "overdue": int(row["overdue_count"]),
        "blocked": int(row["blocked_count"]),
    }


def _group_by_project(
    scope: DashboardScope, base, *, limit: int
) -> tuple[List[Dict[str, Any]], Optional[Dict[str, Any]]]:
    rows_raw = list(
        _annotate_counts(scope, base, group_fields=["project_id", "project__name"])[:limit]
    )
    rows = [
        _row_from_agg(
            group_id=str(r["project_id"]),
            name=r["project__name"] or "Untitled project",
            row=r,
        )
        for r in rows_raw
    ]
    return rows, None


def _group_by_module(
    scope: DashboardScope, base, *, limit: int
) -> tuple[List[Dict[str, Any]], Optional[Dict[str, Any]]]:
    linked = base.filter(
        issue_module__deleted_at__isnull=True,
        issue_module__module__archived_at__isnull=True,
    )
    rows_raw = list(
        _annotate_counts(
            scope,
            linked,
            group_fields=["issue_module__module_id", "issue_module__module__name"],
        )[:limit]
    )
    rows = [
        _row_from_agg(
            group_id=str(r["issue_module__module_id"]),
            name=r["issue_module__module__name"] or "Module",
            row=r,
        )
        for r in rows_raw
    ]
    unbucketed = _unbucketed_row(scope, base, _has_module_link, empty_name="No module")
    return rows, unbucketed


def _group_by_cycle(
    scope: DashboardScope, base, *, limit: int
) -> tuple[List[Dict[str, Any]], Optional[Dict[str, Any]]]:
    linked = base.filter(
        issue_cycle__deleted_at__isnull=True,
    )
    rows_raw = list(
        _annotate_counts(
            scope,
            linked,
            group_fields=["issue_cycle__cycle_id", "issue_cycle__cycle__name"],
        )[:limit]
    )
    rows = [
        _row_from_agg(
            group_id=str(r["issue_cycle__cycle_id"]),
            name=r["issue_cycle__cycle__name"] or "Cycle",
            row=r,
        )
        for r in rows_raw
    ]
    unbucketed = _unbucketed_row(scope, base, _has_cycle_link, empty_name="No cycle")
    return rows, unbucketed


def _group_by_label(
    scope: DashboardScope, base, *, limit: int
) -> tuple[List[Dict[str, Any]], Optional[Dict[str, Any]]]:
    from plane.db.models import IssueLabel

    linked = base.filter(label_issue__deleted_at__isnull=True)
    rows_raw = list(
        _annotate_counts(
            scope,
            linked,
            group_fields=["label_issue__label_id", "label_issue__label__name"],
        )[:limit]
    )
    rows = [
        _row_from_agg(
            group_id=str(r["label_issue__label_id"]),
            name=r["label_issue__label__name"] or "Label",
            row=r,
        )
        for r in rows_raw
    ]
    unbucketed = _unbucketed_row(
        scope,
        base,
        lambda: Exists(
            IssueLabel.objects.filter(
                issue_id=OuterRef("pk"),
                deleted_at__isnull=True,
            )
        ),
        empty_name="No label",
    )
    return rows, unbucketed


def _has_module_link():
    from plane.db.models import ModuleIssue

    return Exists(
        ModuleIssue.objects.filter(
            issue_id=OuterRef("pk"),
            deleted_at__isnull=True,
            module__archived_at__isnull=True,
        )
    )


def _has_cycle_link():
    from plane.db.models import CycleIssue

    return Exists(
        CycleIssue.objects.filter(
            issue_id=OuterRef("pk"),
            deleted_at__isnull=True,
        )
    )


def _unbucketed_row(
    scope: DashboardScope, base, link_exists, *, empty_name: str = "No bucket"
) -> Optional[Dict[str, Any]]:
    exists_expr = link_exists() if callable(link_exists) else link_exists
    qs = base.annotate(_has_link=exists_expr).filter(_has_link=False)
    count = qs.values("id").distinct().count()
    if count == 0:
        return None
    overdue = qs.filter(_overdue_q(scope.today)).values("id").distinct().count()
    blocked = qs.filter(_blocked_q(scope)).values("id").distinct().count()
    started = qs.filter(state__group="started").values("id").distinct().count()
    return {
        "group_id": None,
        "name": empty_name,
        "open": count,
        "started": started,
        "overdue": overdue,
        "blocked": blocked,
    }
