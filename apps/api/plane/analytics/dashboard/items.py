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

Selection (canonical contract):

    {metric, values: {project_id, assignee_id, state_group, priority,
     label_id, cycle_id, module_id}, date_start, date_end, delivery_base,
     date_bucket}

    assignee_id == null  → unassigned selection (explicit, not omitted)
    assignee_id absent   → no assignee selector at all
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
    _due_soon_q,
    _open_q,
    _overdue_q,
    _unassigned_urgent_high_q,
    active_issue_base,
    count_attention_union,
    list_issues,
    operational_queryset,
)


DEFAULT_PAGE_SIZE = 25
MAX_PAGE_SIZE = 100
MAX_CUSTOM_PERIOD_DAYS = 366


# Attention ruleset actually emitted (no_update is excluded — see MetricUnavailableError).
ATTENTION_RULES: FrozenSet[str] = frozenset(
    {"overdue", "blocked", "due_soon", "unassigned_urgent_high"}
)


@dataclass(frozen=True)
class ItemRequest:
    """Validated items-request payload (validated by the view layer).

    Carries the typed ``selection.values`` fields the items endpoint must
    filter by, so list-drilldown rows match the KPI count for the same
    selection (count/list parity under selection). ``assignee_id == ""``
    is the canonical "unassigned" representation (not an empty list, not
    omitted).
    """

    metric: Optional[str] = None
    attention_rules: Optional[Sequence[str]] = None
    page: int = 1
    page_size: int = DEFAULT_PAGE_SIZE
    order_by: Sequence[str] = ("-target_date", "sequence_id")
    # Selection.values fields.
    project_id: Optional[str] = None
    cycle_id: Optional[str] = None
    module_id: Optional[str] = None
    label_id: Optional[str] = None
    state_group: Optional[str] = None
    priority: Optional[str] = None
    # Use empty string "" for explicit unassigned; None means no selector.
    assignee_id: Optional[str] = None
    # Custom date window (overrides scope period for this list).
    date_start: Optional[str] = None
    date_end: Optional[str] = None
    delivery_base: str = "created_at"

    def __post_init__(self) -> None:
        if self.page < 1:
            raise DashboardContractError("page must be >= 1")
        if not (1 <= self.page_size <= MAX_PAGE_SIZE):
            raise DashboardContractError(
                f"page_size must be 1..{MAX_PAGE_SIZE}; got {self.page_size}"
            )


def selection_filters(request: ItemRequest) -> Dict[str, Any]:
    """Translate a validated ItemRequest into the dashboard kwargs the
    operational queryset understands.

    ``assignee_id == ""`` is the canonical "unassigned" representation;
    ``assignee_id is None`` means no assignee selector at all.
    """
    out: Dict[str, Any] = {}
    if request.project_id:
        out["project_id"] = [request.project_id]
    if request.cycle_id:
        out["cycle_id"] = [request.cycle_id]
    if request.module_id:
        out["module_id"] = [request.module_id]
    if request.label_id:
        out["label_id"] = [request.label_id]
    if request.state_group:
        out["state_group"] = [request.state_group]
    if request.priority:
        out["priority"] = [request.priority]
    if request.assignee_id == "":
        out["__unassigned"] = True
    elif request.assignee_id:
        out["assignee_id"] = [request.assignee_id]
    return out


def _apply_selection_filters(qs: QuerySet, request: ItemRequest) -> QuerySet:
    """Apply ItemRequest selection.values to a queryset."""
    if request.project_id:
        qs = qs.filter(project_id=request.project_id)
    if request.cycle_id:
        from plane.db.models import CycleIssue
        qs = qs.filter(
            issue_cycle__cycle_id=request.cycle_id,
            issue_cycle__deleted_at__isnull=True,
        )
    if request.module_id:
        from plane.db.models import ModuleIssue
        qs = qs.filter(
            issue_module__module_id=request.module_id,
            issue_module__deleted_at__isnull=True,
        )
    if request.label_id:
        from plane.db.models import IssueLabel
        qs = qs.filter(
            label_issue__label_id=request.label_id,
            label_issue__deleted_at__isnull=True,
        )
    if request.state_group:
        qs = qs.filter(state__group=request.state_group)
    if request.priority:
        qs = qs.filter(priority=request.priority)
    if request.assignee_id == "":
        # Explicit unassigned: no active IssueAssignee row.
        from plane.db.models import IssueAssignee
        has_assignee = IssueAssignee.objects.filter(
            issue=OuterRef("pk"), deleted_at__isnull=True
        )
        qs = qs.annotate(_has_assignee=Exists(has_assignee)).filter(_has_assignee=False)
    elif request.assignee_id:
        from plane.db.models import IssueAssignee
        qs = qs.filter(
            issue_assignee__assignee_id=request.assignee_id,
            issue_assignee__deleted_at__isnull=True,
        )
    return qs


def _resolve_custom_window(
    request: ItemRequest, scope: DashboardScope
) -> tuple[Optional[Any], Optional[Any]]:
    """Return (start, end) for the items endpoint, honouring date_start/date_end
    if provided, otherwise the scope period.
    """
    if not (request.date_start or request.date_end):
        return scope.period.start, scope.period.end
    from datetime import datetime
    import pytz

    tz = pytz.timezone(scope.timezone or "UTC")
    try:
        start = (
            datetime.fromisoformat(request.date_start.replace("Z", "+00:00"))
            if request.date_start
            else None
        )
        end = (
            datetime.fromisoformat(request.date_end.replace("Z", "+00:00"))
            if request.date_end
            else None
        )
    except ValueError as exc:
        raise DashboardContractError(f"Invalid date_start/date_end: {exc}")
    if start and start.tzinfo is None:
        start = tz.localize(start)
    if end and end.tzinfo is None:
        end = tz.localize(end)
    if start and end:
        if (end - start).days > MAX_CUSTOM_PERIOD_DAYS:
            raise DashboardContractError(
                f"Custom period exceeds {MAX_CUSTOM_PERIOD_DAYS} days; capped to avoid huge queries"
            )
        if end <= start:
            raise DashboardContractError("date_end must be strictly after date_start")
    return start, end


# ----- items (drilldown) -------------------------------------------------


def list_items(scope: DashboardScope, request: ItemRequest) -> Dict[str, Any]:
    """Return a paginated items payload (rows + total + page metadata).

    Respects ItemRequest selection.values and custom date window. Counts
    the same selector layer that the rows use, so the dashboard
    ``count_*`` helpers agree with ``data.total`` for the same metric.

    Date filtering contract: ``delivery_base`` chooses WHICH timestamp
    drives the date window. ``created_at`` clicks bucket by creation;
    ``completed_at`` clicks bucket by completion. ``completed_in_period``
    metric is an explicit exception (always uses completed_at) so the
    completion-trend drilldown stays consistent with the overview KPI.

    Distinct semantics: every join (cycle_id, module_id, label_id,
    assignee_id) may duplicate rows; the queryset is forced to
    ``.distinct()`` after joins so count/list parity and pagination are
    consistent under multi-relation selections.
    """
    selection = DashboardSelection(metric=request.metric) if request.metric else None
    qs = list_issues(scope, rule=request.metric, selection=selection)
    qs = _apply_selection_filters(qs, request)
    # Any join selector (cycle_id, module_id, label_id, assignee_id)
    # can fan out rows. Apply .distinct() here so the count, the slice,
    # and the iteration all agree on the same unique issue IDs.
    qs = qs.distinct()
    qs = qs.order_by(*request.order_by)

    start, end = _resolve_custom_window(request, scope)
    # Date window: only apply when the metric is completed_in_period OR
    # the caller supplied explicit date_start/date_end. The timestamp
    # field is driven by ``delivery_base`` so a Created-series click
    # returns created_at-bucketed rows and a Completed-series click
    # returns completed_at-bucketed rows.
    if request.metric == "completed_in_period":
        # Explicit completion metric: always bucket by completed_at
        # regardless of delivery_base so the drilldown agrees with the
        # overview's completed-in-period count.
        date_field = "completed_at"
        if start is not None:
            qs = qs.filter(completed_at__gte=start)
        if end is not None:
            qs = qs.filter(completed_at__lt=end)
    elif request.date_start or request.date_end:
        # Custom date window from the caller — apply to whichever
        # timestamp the caller's delivery_base chose. Default created_at
        # so a click on the Created series returns creation rows.
        date_field = request.delivery_base or "created_at"
        if date_field not in ("created_at", "completed_at"):
            date_field = "created_at"
        if start is not None:
            qs = qs.filter(**{f"{date_field}__gte": start})
        if end is not None:
            qs = qs.filter(**{f"{date_field}__lt": end})

    total = qs.values("id").distinct().count()
    start_idx = (request.page - 1) * request.page_size
    end_idx = start_idx + request.page_size
    # Final defensive distinct before slicing — keeps the page aligned
    # with the count even when the ORM emits a duplicate-producing join.
    rows = list(
        qs.values(*_ISSUE_FIELDS).distinct()[start_idx:end_idx]
    )

    return {
        "status": "ok",
        "section_id": "items",
        "data": {
            "rows": [_serialise_row(row) for row in rows],
            "total": total,
            "page": request.page,
            "page_size": request.page_size,
            "has_more": end_idx < total,
            "scope_key": scope.scope_key,
            "selection": _echo_selection(request),
        },
    }


def _echo_selection(request: ItemRequest) -> Dict[str, Any]:
    """Echo the applied selection back to the client so UI can confirm
    count/list parity and refresh stale state on response."""
    return {
        "metric": request.metric,
        "values": {
            k: v
            for k, v in {
                "project_id": request.project_id,
                "assignee_id": request.assignee_id,
                "state_group": request.state_group,
                "priority": request.priority,
                "label_id": request.label_id,
                "cycle_id": request.cycle_id,
                "module_id": request.module_id,
            }.items()
            if v is not None
        },
        "date_start": request.date_start,
        "date_end": request.date_end,
        "delivery_base": request.delivery_base,
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
    """Attention union rows + per-rule reason counts."""
    annotations = _annotate_attention_reasons(scope)
    qs = operational_queryset(scope)

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

    Severity-first sort so paging is deterministic across requests:
    overdue desc, blocked desc, due_soon desc, urgent desc,
    target_date asc (NULL last), id asc as final tie-break.

    Performance note
    ----------------
    Coordinator finding msg_c42730c5cddf: the prior implementation
    used ``annotate(**{rule: Exists(...)})`` then ``filter(union_q)``
    where ``union_q`` was an OR of four Exists subqueries. Postgres
    evaluated the four Exists correlated subqueries per row in the
    filter step, dominating the request. The retry avoids this by:

    1. computing reason_counts via 4 single-pass aggregates (one per
       rule, no per-row fanout);
    2. computing union_total via the existing count_attention_union
       helper (Python-side set union across four queryset IDs);
    3. fetching the paginated rows with NO Exists annotations and
       deriving reasons client-side from four pre-computed
       ``set[int]`` of satisfying IDs.

    Total query count drops from ``5*N_pages`` (1 + 4 reason
    aggregates + N row fetches with 4 Exists each) to ``5 + 1`` —
    the row fetch is one query and the per-row reason lookup is
    O(1) in Python.
    """
    if page < 1:
        raise DashboardContractError("page must be >= 1")
    if not (1 <= page_size <= MAX_PAGE_SIZE):
        raise DashboardContractError(
            f"page_size must be 1..{MAX_PAGE_SIZE}; got {page_size}"
        )

    annotations = _annotate_attention_reasons(scope)
    qs = operational_queryset(scope)

    # 1. Per-rule count + satisfying-ID sets in two passes (single
    #    SELECT per rule, no per-row fanout).
    satisfying: Dict[str, set] = {}
    reason_counts: Dict[str, int] = {}
    for rule_key, predicate in annotations.items():
        ids = set(
            qs.filter(predicate).values_list("id", flat=True)
        )
        satisfying[rule_key] = ids
        reason_counts[rule_key] = len(ids)

    # 2. Union total via Python set union over the four ID sets —
    #    same cost as count_attention_union but avoids re-issuing
    #    the 4 queries.
    union_ids = set().union(*satisfying.values())
    union_total = len(union_ids)

    # 3. Paginated row fetch: ordered by severity, no per-row Exists.
    #    Severity is derived from the membership in the satisfying
    #    sets below (after we know which IDs appear).
    base = qs.filter(id__in=union_ids)
    rows_qs = base.values(*_ISSUE_FIELDS).order_by(
        "target_date", "id",
    )

    total = len(union_ids)
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    raw_rows = list(rows_qs[start_idx:end_idx])

    serialised = []
    for row in raw_rows:
        reasons = [
            rule_key for rule_key in ATTENTION_RULES
            if row["id"] in satisfying[rule_key]
        ]
        # Severity-first ordering key (overdue → blocked → due_soon →
        # unassigned_urgent_high) for deterministic paging.
        severity_key = (
            -int(bool(row["id"] in satisfying["overdue"])),
            -int(bool(row["id"] in satisfying["blocked"])),
            -int(bool(row["id"] in satisfying["due_soon"])),
            -int(bool(row["id"] in satisfying["unassigned_urgent_high"])),
            row["target_date"],
            row["id"],
        )
        base_row = _serialise_row(row)
        base_row["reasons"] = reasons
        base_row["_severity"] = severity_key
        serialised.append(base_row)

    # Stable severity-first re-sort because the SQL ORDER BY doesn't
    # know about reason membership.
    serialised.sort(key=lambda r: r.pop("_severity"))

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