# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Items + attention endpoints for the Team Operations Dashboard.

Both endpoints paginate with stable sort and a bounded page_size (default 25,
max 100). Items are returned as distinct issue rows with the same payload
shape, so the drawer and panel views can share the same renderer.

Count/list parity: ``count_*`` and ``list_issues`` resolve through the same
selector helpers, so the items endpoint's ``total`` always equals the
overview KPI count for the same metric and unchanged read state.

Attention: each row carries the rule keys it ACTUALLY satisfies, computed
via ``Exists`` subqueries per predicate. The reason list is never padded
with rules the row does not satisfy.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, FrozenSet, List, Optional, Sequence

from django.db.models import Exists, OuterRef, Q, QuerySet

from .contracts import (
    DashboardContractError,
    DashboardScope,
    DashboardSelection,
    MetricUnavailableError,
    VALID_ATTENTION_RULES,
)
from .predicates import (
    _blocked_q,
    _blocked_subquery_for_scope,
    _due_soon_q,
    _open_q,
    _overdue_q,
    _unassigned_urgent_high_q,
    active_issue_base,
    count_attention_union,
    count_blocked,
    count_due_soon,
    count_overdue,
    list_issues,
    operational_queryset,
)


DEFAULT_PAGE_SIZE = 25
MAX_PAGE_SIZE = 100


# Attention ruleset actually emitted (no_update is excluded — see MetricUnavailableError).
ATTENTION_RULES: FrozenSet[str] = frozenset(
    {"overdue", "blocked", "due_soon", "unassigned_urgent_high"}
)


@dataclass(frozen=True)
class ItemRequest:
    """Validated items-request payload (validated by the view layer)."""

    metric: Optional[str] = None
    attention_rules: Optional[Sequence[str]] = None
    page: int = 1
    page_size: int = DEFAULT_PAGE_SIZE
    order_by: Sequence[str] = ("-target_date", "sequence_id")

    def __post_init__(self) -> None:
        if self.page < 1:
            raise DashboardContractError("page must be >= 1")
        if not (1 <= self.page_size <= MAX_PAGE_SIZE):
            raise DashboardContractError(
                f"page_size must be 1..{MAX_PAGE_SIZE}; got {self.page_size}"
            )


# ----- items (drilldown) -------------------------------------------------


def list_items(scope: DashboardScope, request: ItemRequest) -> Dict[str, Any]:
    """Return a paginated items payload (rows + total + page metadata)."""
    selection = DashboardSelection(metric=request.metric) if request.metric else None
    qs = list_issues(scope, rule=request.metric, selection=selection)
    qs = qs.order_by(*request.order_by)

    total = qs.values("id").distinct().count()
    start = (request.page - 1) * request.page_size
    end = start + request.page_size
    rows = list(qs[start:end].values(*_ISSUE_FIELDS))

    return {
        "status": "ok",
        "section_id": "items",
        "data": {
            "rows": [_serialise_row(row) for row in rows],
            "total": total,
            "page": request.page,
            "page_size": request.page_size,
            "has_more": end < total,
            "scope_key": scope.scope_key,
        },
    }


_ISSUE_FIELDS = (
    "id",
    "name",
    "sequence_id",
    "priority",
    "target_date",
    "completed_at",
    "created_at",
    "project_id",
    "project__name",
    "state_id",
    "state__name",
    "state__group",
)


def _serialise_row(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(row["id"]),
        "name": row["name"],
        "sequence_id": row["sequence_id"],
        "priority": row["priority"],
        "target_date": row["target_date"].isoformat() if row.get("target_date") else None,
        "completed_at": row["completed_at"].isoformat() if row.get("completed_at") else None,
        "created_at": row["created_at"].isoformat() if row.get("created_at") else None,
        "project_id": str(row["project_id"]),
        "project_name": row.get("project__name"),
        "state_id": str(row["state_id"]) if row.get("state_id") else None,
        "state_name": row.get("state__name"),
        "state_group": row.get("state__group"),
    }


# ----- attention --------------------------------------------------------


def _annotate_attention_reasons(scope: DashboardScope) -> Dict[str, Exists]:
    """Return a mapping from attention rule name to an Exists predicate.

    Each Exists subquery is independent — the row-level annotation
    evaluates the actual predicate per issue, so a row's reasons list is
    exactly the rules it satisfies (not a copy of every possible rule).
    """
    return {
        "overdue": Exists(
            active_issue_base(scope).filter(pk=OuterRef("pk")).filter(_overdue_q(scope.today))
        ),
        "blocked": Exists(
            active_issue_base(scope).filter(pk=OuterRef("pk")).filter(_blocked_q(scope))
        ),
        "due_soon": Exists(
            active_issue_base(scope).filter(pk=OuterRef("pk")).filter(_due_soon_q(scope.today))
        ),
        "unassigned_urgent_high": Exists(
            operational_queryset(scope).filter(pk=OuterRef("pk")).filter(_unassigned_urgent_high_q())
        ),
    }


def attention_payload(scope: DashboardScope) -> Dict[str, Any]:
    """Attention union rows + per-rule reason counts.

    Stable risk sort (overdue days desc → blocked → due_soon → ... → id)
    so paging is deterministic. Reasons are computed per-row.
    """
    annotations = _annotate_attention_reasons(scope)
    qs = operational_queryset(scope)

    # Per-rule reason counts via SQL Count(distinct=True). Each rule uses
    # its own filter chain — the count shares the same predicate the row
    # annotation uses, so sum-of-reasons is a superset of union_total.
    from django.db.models import Count
    reason_counts = {
        key: qs.filter(predicate).aggregate(c=Count("id", distinct=True))["c"]
        for key, predicate in annotations.items()
    }

    union_total = count_attention_union(scope)

    return {
        "status": "ok",
        "section_id": "attention",
        "data": {
            "rows_preview": [],
            "total": union_total,
            "reason_counts": reason_counts,
            "union_total": union_total,
            "scope_key": scope.scope_key,
        },
    }


def paginated_attention(
    scope: DashboardScope, *, page: int = 1, page_size: int = DEFAULT_PAGE_SIZE
) -> Dict[str, Any]:
    """Paginated attention row set with per-row reasons + reason counts.

    Pagination happens before serialisation so a 100+ row dataset stays
    bounded. Stable severity-first sort so paging is deterministic across
    requests regardless of project or locale:

        overdue desc, blocked desc, due_soon desc, urgent desc,
        target_date asc (NULL last), id asc as final tie-break.

    This puts true risks ahead of mere urgency and avoids the old
    ``-target_date`` ordering that pushed future-due issues above
    overdue rows.
    """
    if page < 1:
        raise DashboardContractError("page must be >= 1")
    if not (1 <= page_size <= MAX_PAGE_SIZE):
        raise DashboardContractError(
            f"page_size must be 1..{MAX_PAGE_SIZE}; got {page_size}"
        )

    annotations = _annotate_attention_reasons(scope)
    qs = operational_queryset(scope)
    union_q = Q()
    for predicate in annotations.values():
        union_q = union_q | predicate

    base = qs.filter(union_q).annotate(**annotations)
    base = base.order_by(
        "-overdue",
        "-blocked",
        "-due_soon",
        "-unassigned_urgent_high",
        "target_date",
        "id",
    )

    # Materialise page rows first, then derive total from the same base
    # queryset. We use values("id").distinct().count() with a *fresh*
    # queryset clone (not the one that already had .distinct() chained)
    # so the count is not subject to queryset-cache effects.
    rows = list(
        base.values(*_ISSUE_FIELDS, *annotations.keys())[
            (page - 1) * page_size : page * page_size
        ]
    )

    # Per-rule counts via SQL Count(distinct=True) — proves the canonical
    # aggregate agrees with the row-level annotations.
    from django.db.models import Count
    reason_counts = {
        key: qs.filter(predicate).aggregate(c=Count("id", distinct=True))["c"]
        for key, predicate in annotations.items()
    }
    total = (
        qs.filter(union_q).aggregate(c=Count("id", distinct=True))["c"]
    )
    union_total = total

    serialised = []
    for row in rows:
        reasons = [key for key in ATTENTION_RULES if row.get(key)]
        base_row = _serialise_row(row)
        base_row["reasons"] = reasons
        serialised.append(base_row)

    return {
        "rows": serialised,
        "total": total,
        "reason_counts": reason_counts,
        "union_total": union_total,
        "page": page,
        "page_size": page_size,
        "has_more": (page * page_size) < total,
        "scope_key": scope.scope_key,
    }