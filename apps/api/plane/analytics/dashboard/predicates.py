# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Operational predicates and selectors for the Team Operations Dashboard.

Every KPI and drilldown page in the operations dashboard funnels through
:func:`operational_queryset`, which yields the ACL-safe base queryset with
the scope's business filters already applied. The selector helpers below all
operate on a :class:`DashboardScope` and never accept raw ORM fields.

Definitions (per spec §6.1 / §8):

* ``open`` = state group ∈ {backlog, unstarted, started}
* ``not_started`` = state group ∈ {backlog, unstarted}
* ``overdue`` = open ∧ target_date < today (workspace timezone)
* ``due_today`` = open ∧ target_date == today
* ``due_soon`` = open ∧ today <= target_date < today + 7 days
* ``blocked`` = open ∧ ∃ active unresolved IssueBlocker pointing at this issue
* ``completed_in_period`` = completed ∧ completed_at ∈ [period.start, period.end)

Counts and lists use the **same** selector helpers, so a KPI count always
equals the distinct issue rows in the drilldown list for the same read state.
"""

from __future__ import annotations

import hashlib
from datetime import date, datetime, time, timedelta
from typing import Any, Dict, FrozenSet, List, Optional, Sequence, Tuple

import pytz
from django.db.models import Count, Exists, OuterRef, Q, QuerySet

from plane.analytics.v2.acl import base_issue_queryset, visible_project_ids
from plane.analytics.v2.time_scope import (
    PRESET_LAST_30_DAYS,
    PRESET_LAST_7_DAYS,
    PRESET_NONE,
    PRESET_THIS_MONTH,
)
from plane.db.models import Issue, IssueAssignee, IssueBlocker, Project

from .contracts import (
    DEFAULT_PERIOD,
    DEFAULT_TIMEZONE,
    VALID_BUSINESS_FILTERS,
    VALID_PERIOD_PRESETS,
    DashboardContractError,
    DashboardScope,
    DashboardSelection,
    MetricUnavailableError,
    PeriodRange,
)


# ----- Period resolution -------------------------------------------------


def _resolve_preset_range(
    *, preset: str, today: date, tz_name: str
) -> Tuple[Optional[datetime], Optional[datetime]]:
    """Resolve a period preset to a half-open ``[start, end)`` window in UTC.

    Period contracts (coordinator-clarified):

    * ``last_7_days``  = ``[today-6, tomorrow)`` — 7 calendar days inclusive
      of today.
    * ``last_30_days`` = ``[today-29, tomorrow)`` — 30 calendar days inclusive
      of today.
    * ``this_month``   = ``[first-of-month, first-of-next-month)``.

    Returns ``(None, None)`` for :data:`PRESET_NONE` so snapshot queries are
    not filtered by ``created_at`` / ``completed_at``.
    """
    if preset == PRESET_NONE:
        return None, None
    if preset not in VALID_PERIOD_PRESETS:
        raise DashboardContractError(
            f"Unknown period preset: {preset!r}. Allowed: {sorted(VALID_PERIOD_PRESETS)}"
        )

    tz = pytz.timezone(tz_name or DEFAULT_TIMEZONE)
    if preset == PRESET_THIS_MONTH:
        start_local = tz.localize(datetime.combine(today.replace(day=1), time.min))
        if today.month == 12:
            next_month_first = today.replace(year=today.year + 1, month=1, day=1)
        else:
            next_month_first = today.replace(month=today.month + 1, day=1)
        end_local = tz.localize(datetime.combine(next_month_first, time.min))
    elif preset == PRESET_LAST_7_DAYS:
        start_local = tz.localize(datetime.combine(today - timedelta(days=6), time.min))
        end_local = tz.localize(datetime.combine(today + timedelta(days=1), time.min))
    elif preset == PRESET_LAST_30_DAYS:
        start_local = tz.localize(datetime.combine(today - timedelta(days=29), time.min))
        end_local = tz.localize(datetime.combine(today + timedelta(days=1), time.min))
    else:
        # Defensive: any new preset must be handled above before reaching here.
        raise DashboardContractError(f"Unhandled preset: {preset!r}")

    return start_local.astimezone(pytz.UTC), end_local.astimezone(pytz.UTC)


# ----- Scope identity ----------------------------------------------------


def compute_scope_key(
    *,
    workspace: Any,
    principal: Any,
    timezone_name: str,
    today: date,
    period: PeriodRange,
    project_ids: Sequence[str],
    business_filters: Dict[str, Sequence[str]],
) -> str:
    """Stable identity hash for a scope.

    Two requests with identical inputs (including workspace timezone) share
    the same key, so the client can detect cross-scope response leakage.
    The workspace timezone is part of the hash because ``today`` is computed
    in that timezone.
    """
    parts = [
        f"ws={getattr(workspace, 'id', workspace)}",
        f"pr={getattr(principal, 'id', principal)}",
        f"tz={timezone_name}",
        f"today={today.isoformat()}",
        f"start={period.start.isoformat() if period.start else ''}",
        f"end={period.end.isoformat() if period.end else ''}",
        f"projects={','.join(sorted(str(p) for p in project_ids))}",
        f"filters={sorted((k, ','.join(sorted(map(str, v)))) for k, v in business_filters.items())}",
    ]
    digest = hashlib.sha256("|".join(parts).encode("utf-8")).hexdigest()
    return digest[:16]


# ----- Scope construction -----------------------------------------------


def resolve_dashboard_scope(
    workspace: Any,
    principal: Any,
    payload: Optional[Dict[str, Any]] = None,
    *,
    today: Optional[date] = None,
) -> DashboardScope:
    """Construct a normalised :class:`DashboardScope` from request input.

    The workspace timezone (not a client-supplied value) drives every
    calendar boundary. ``today`` defaults to today in the workspace
    timezone; tests inject a fixed value for deterministic assertions.
    """
    payload = payload or {}
    tz_name = getattr(workspace, "timezone", None) or DEFAULT_TIMEZONE
    if tz_name not in pytz.all_timezones_set:
        raise DashboardContractError(f"Unknown workspace timezone: {tz_name!r}")

    if today is None:
        tz = pytz.timezone(tz_name)
        today = datetime.now(tz).date()

    preset = payload.get("period_preset") or DEFAULT_PERIOD
    start, end = _resolve_preset_range(preset=preset, today=today, tz_name=tz_name)
    period = PeriodRange(start=start, end=end, today=today)

    visible = visible_project_ids(
        workspace=workspace,
        principal=principal,
        project_ids=payload.get("project_ids"),
    )
    base_qs = base_issue_queryset(
        workspace=workspace, principal=principal, project_ids=payload.get("project_ids")
    )

    business_filters = _normalise_business_filters(payload.get("business_filters") or {})

    return DashboardScope(
        workspace=workspace,
        principal=principal,
        timezone=tz_name,
        today=today,
        period=period,
        base_queryset=base_qs,
        visible_project_ids=visible,
        business_filters=business_filters,
        scope_key=compute_scope_key(
            workspace=workspace,
            principal=principal,
            timezone_name=tz_name,
            today=today,
            period=period,
            project_ids=visible,
            business_filters=business_filters,
        ),
    )


def _normalise_business_filters(raw: Dict[str, Any]) -> Dict[str, List[str]]:
    out: Dict[str, List[str]] = {}
    for k, v in raw.items():
        if k not in VALID_BUSINESS_FILTERS:
            raise DashboardContractError(f"Unknown business filter: {k!r}")
        if v is None:
            continue
        if isinstance(v, (list, tuple)):
            values = [str(x) for x in v if x is not None and x != ""]
        else:
            values = [str(v)] if v != "" else []
        if values:
            out[k] = values
    return out


# ----- ACL-safe active issue base (independent of business filters) ------


def active_issue_base(scope: DashboardScope) -> QuerySet:
    """Return the principal's readable, non-archived, non-draft, non-triage
    issue queryset, restricted to ``scope.visible_project_ids`` and the
    scope's workspace.

    Distinct from :meth:`DashboardScope.base_queryset` which is the scope's
    canonical queryset (used for filtering with business filters applied).
    This helper exists for *predicate subqueries* that must not inherit the
    scope's business filters — e.g. the IssueBlocker ``blocked_by`` lookup,
    which must respect ACL but not whether the viewer happens to have an
    active ``priority=high`` filter.
    """
    visible = scope.visible_project_ids
    if not visible:
        return Issue.objects.none()

    return (
        Issue.issue_objects.filter(
            workspace_id=scope.workspace.id,
            project_id__in=visible,
            project__deleted_at__isnull=True,
            project__archived_at__isnull=True,
            project__network__in=[0, 1, 2],
        )
    )


# ----- Queryset selectors ------------------------------------------------


def _open_q() -> Q:
    """State group ∈ {backlog, unstarted, started}."""
    return Q(state__group__in=["backlog", "unstarted", "started"])


def _not_started_q() -> Q:
    """State group ∈ {backlog, unstarted}."""
    return Q(state__group__in=["backlog", "unstarted"])


def _completed_q() -> Q:
    """State group == completed."""
    return Q(state__group="completed")


def _cancelled_q() -> Q:
    """State group == cancelled."""
    return Q(state__group="cancelled")


def _overdue_q(today: date) -> Q:
    """Open ∧ target_date < today (calendar day in workspace TZ)."""
    return _open_q() & Q(target_date__lt=today)


def _due_today_q(today: date) -> Q:
    """Open ∧ target_date == today."""
    return _open_q() & Q(target_date=today)


def _due_soon_q(today: date) -> Q:
    """Open ∧ today <= target_date < today + 7 (calendar day)."""
    return _open_q() & Q(target_date__gte=today, target_date__lt=today + timedelta(days=7))


def _blocked_subquery_for_scope(scope: DashboardScope) -> Exists:
    """Active unresolved IssueBlocker pointing at this issue.

    Active = blocker row ``deleted_at IS NULL`` AND the blocker issue is in
    the principal's ACL-safe active base AND its state is not in
    {completed, cancelled}. The relation is ``block=this issue,
    blocked_by=other issue`` (this issue is blocked by the other one), per
    IssueBlocker's reverse accessor ``blocker_issues``.

    IMPORTANT: the subquery filters ``blocked_by`` through
    :func:`active_issue_base` (ACL-safe), **not** through the scope's
    business filters. That way a viewer's ``priority=high`` filter doesn't
    silently expand or shrink the set of issues that can block other issues.
    """
    blocker_active = IssueBlocker.objects.filter(
        block=OuterRef("pk"),
        deleted_at__isnull=True,
    ).annotate(
        _scope_visible=Exists(active_issue_base(scope).filter(pk=OuterRef("blocked_by_id"))),
    ).filter(
        _scope_visible=True,
        blocked_by__deleted_at__isnull=True,
    ).exclude(
        blocked_by__state__group__in=["completed", "cancelled"]
    )
    return Exists(blocker_active)


def _blocked_q(scope: DashboardScope) -> Q:
    """Open ∧ ∃ ACL-safe active unresolved blocker."""
    return _open_q() & Q(_blocked_subquery_for_scope(scope))


def _unassigned_urgent_high_q() -> Q:
    """Open ∧ priority ∈ {urgent, high} ∧ no active IssueAssignee.

    An issue is unassigned only when there is no active IssueAssignee row at
    all. Inactive assignees that still hold a row are preserved per spec.
    """
    return (
        _open_q()
        & Q(priority__in=["urgent", "high"])
        & ~Q(
            Exists(
                IssueAssignee.objects.filter(
                    issue=OuterRef("pk"),
                    deleted_at__isnull=True,
                )
            )
        )
    )


# ----- Public selectors --------------------------------------------------


def operational_queryset(
    scope: DashboardScope,
    selection: Optional[DashboardSelection] = None,
) -> QuerySet:
    """Return the ACL-safe queryset for a scope, with business filters applied.

    If ``selection.metric`` is one of the snapshot rules, the corresponding
    predicate is folded into the queryset so list-drilldown rows match the
    count returned for the same metric.
    """
    qs = scope.base_queryset
    qs = scope.apply_business_filters(qs)

    metric = getattr(selection, "metric", None)
    if metric and metric != "all":
        rule_q = _metric_predicate_for(scope, metric)
        if rule_q is not None:
            qs = qs.filter(rule_q)

    return qs.distinct()


def _metric_predicate_for(scope: DashboardScope, metric: str) -> Optional[Q]:
    """Map a snapshot rule key to its predicate Q.

    Returns ``None`` for metrics that have no filter semantic (e.g. ``total``,
    which is the unfiltered count). Raises :class:`MetricUnavailableError`
    for rules that are allowlisted but unsupported until the activity-rule
    coverage gate is documented with evidence.
    """
    if metric == "no_update":
        raise MetricUnavailableError(
            "no_update requires documented activity-rule coverage evidence "
            "(spec §13); cannot return a meaningful count yet."
        )
    if metric in ("total",):
        return None
    if metric == "open":
        return _open_q()
    if metric == "not_started":
        return _not_started_q()
    if metric == "started":
        return Q(state__group="started")
    if metric == "completed":
        return _completed_q()
    if metric == "cancelled":
        return _cancelled_q()
    if metric == "overdue":
        return _overdue_q(scope.today)
    if metric == "due_today":
        return _due_today_q(scope.today)
    if metric == "due_soon":
        return _due_soon_q(scope.today)
    if metric == "blocked":
        return _blocked_q(scope)
    if metric == "unassigned_urgent_high":
        return _unassigned_urgent_high_q()
    raise DashboardContractError(f"Unknown metric: {metric!r}")


def _apply_period(qs: QuerySet, scope: DashboardScope, field: str = "created_at") -> QuerySet:
    """Apply the scope's half-open period window to ``field``."""
    if scope.period.start is not None:
        qs = qs.filter(**{f"{field}__gte": scope.period.start})
    if scope.period.end is not None:
        qs = qs.filter(**{f"{field}__lt": scope.period.end})
    return qs


def _count(qs: QuerySet) -> int:
    return qs.values("id").distinct().count()


def count_total(scope: DashboardScope) -> int:
    """Distinct issues in the scope, including cancelled."""
    return _count(operational_queryset(scope))


def count_open(scope: DashboardScope) -> int:
    return _count(operational_queryset(scope).filter(_open_q()))


def count_not_started(scope: DashboardScope) -> int:
    return _count(operational_queryset(scope).filter(_not_started_q()))


def count_started(scope: DashboardScope) -> int:
    return _count(operational_queryset(scope).filter(Q(state__group="started")))


def count_completed(scope: DashboardScope) -> int:
    return _count(operational_queryset(scope).filter(_completed_q()))


def count_cancelled(scope: DashboardScope) -> int:
    return _count(operational_queryset(scope).filter(_cancelled_q()))


def count_overdue(scope: DashboardScope) -> int:
    return _count(operational_queryset(scope).filter(_overdue_q(scope.today)))


def count_due_today(scope: DashboardScope) -> int:
    return _count(operational_queryset(scope).filter(_due_today_q(scope.today)))


def count_due_soon(scope: DashboardScope) -> int:
    return _count(operational_queryset(scope).filter(_due_soon_q(scope.today)))


def count_blocked(scope: DashboardScope) -> int:
    return _count(operational_queryset(scope).filter(_blocked_q(scope)))


def count_completed_in_period(scope: DashboardScope) -> int:
    """Completed issues whose ``completed_at`` lies in ``[period.start, period.end)``.

    Uses the scope's period. Distinct-issue semantics; multi-assignee issues
    count once.
    """
    qs = operational_queryset(scope).filter(_completed_q())
    qs = _apply_period(qs, scope, field="completed_at")
    return _count(qs)


def count_unassigned_urgent_high(scope: DashboardScope) -> int:
    return _count(operational_queryset(scope).filter(_unassigned_urgent_high_q()))


def count_attention_union(
    scope: DashboardScope,
    rules: Optional[Sequence[str]] = None,
) -> int:
    """Distinct issue count satisfying *any* of the given attention rules.

    Default rules: overdue, blocked, due_soon, unassigned_urgent_high.
    Raises :class:`MetricUnavailableError` if ``no_update`` is requested.
    """
    rules_set = set(rules) if rules else {"overdue", "blocked", "due_soon", "unassigned_urgent_high"}
    if "no_update" in rules_set:
        raise MetricUnavailableError(
            "no_update requires documented activity-rule coverage evidence "
            "(spec §13); cannot include in attention union."
        )
    qs = operational_queryset(scope)
    predicates = []
    if "overdue" in rules_set:
        predicates.append(_overdue_q(scope.today))
    if "blocked" in rules_set:
        predicates.append(_blocked_q(scope))
    if "due_soon" in rules_set:
        predicates.append(_due_soon_q(scope.today))
    if "unassigned_urgent_high" in rules_set:
        predicates.append(_unassigned_urgent_high_q())
    if not predicates:
        return 0
    combined = predicates[0]
    for p in predicates[1:]:
        combined = combined | p
    return _count(qs.filter(combined))


def list_issues(
    scope: DashboardScope,
    *,
    rule: Optional[str] = None,
    selection: Optional[DashboardSelection] = None,
    order_by: Optional[Sequence[str]] = None,
    limit: Optional[int] = None,
) -> QuerySet:
    """Return a queryset of distinct issues filtered by an optional rule.

    Counts and lists use the same selector layer, so the rows returned here
    match the corresponding ``count_*`` for the same scope and rule.
    """
    qs = operational_queryset(scope, selection)
    if rule == "open":
        qs = qs.filter(_open_q())
    elif rule == "not_started":
        qs = qs.filter(_not_started_q())
    elif rule == "started":
        qs = qs.filter(Q(state__group="started"))
    elif rule == "completed":
        qs = qs.filter(_completed_q())
    elif rule == "cancelled":
        qs = qs.filter(_cancelled_q())
    elif rule == "overdue":
        qs = qs.filter(_overdue_q(scope.today))
    elif rule == "due_today":
        qs = qs.filter(_due_today_q(scope.today))
    elif rule == "due_soon":
        qs = qs.filter(_due_soon_q(scope.today))
    elif rule == "blocked":
        qs = qs.filter(_blocked_q(scope))
    elif rule == "completed_in_period":
        qs = qs.filter(_completed_q())
        qs = _apply_period(qs, scope, field="completed_at")
    elif rule == "unassigned_urgent_high":
        qs = qs.filter(_unassigned_urgent_high_q())
    elif rule is not None:
        raise DashboardContractError(f"Unknown rule: {rule!r}")
    if order_by:
        qs = qs.order_by(*order_by)
    if limit is not None:
        qs = qs[:limit]
    return qs