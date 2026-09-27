# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contracts for the Team Operations Dashboard (P0).

The dashboard composes a single canonical read state per request. Every KPI,
chart, panel and drilldown page in the same request renders against the same
:class:`DashboardScope` so totals are consistent and stale data never leaks
between filters.

Selection is restricted to allowlisted keys. No raw ORM field ever reaches the
query layer; :class:`DashboardSelection` validates dimensions, date buckets and
metric/rule keys against strict allowlists.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Any, Dict, FrozenSet, List, Optional, Sequence, Union

from django.db.models import Q, QuerySet

from plane.db.models import Issue


# ----- Period presets ----------------------------------------------------

PRESET_THIS_MONTH = "this_month"
PRESET_LAST_30_DAYS = "last_30_days"
PRESET_LAST_7_DAYS = "last_7_days"
PRESET_NONE = "none"
PRESET_CUSTOM = "custom"

DEFAULT_PERIOD = PRESET_THIS_MONTH
DEFAULT_TIMEZONE = "UTC"

VALID_PERIOD_PRESETS: FrozenSet[str] = frozenset(
    {
        PRESET_THIS_MONTH,
        PRESET_LAST_30_DAYS,
        PRESET_LAST_7_DAYS,
        PRESET_NONE,
        PRESET_CUSTOM,
    }
)


# ----- Selection allowlist ----------------------------------------------

# Metric/rule keys for current-snapshot counts. Distinct from Analytics V2
# metrics: the dashboard needs "open / not_started / overdue / blocked / ..."
# with definitions that do not silently collide with the Analytics V2
# pending_work_items / due_this_week semantics.
VALID_SNAPSHOT_RULES: FrozenSet[str] = frozenset(
    {
        "total",
        "open",
        "not_started",
        "started",
        "completed",
        "cancelled",
        "overdue",
        "due_today",
        "due_soon",
        "blocked",
        "unassigned_urgent_high",
        # NOTE: "no_update" is intentionally ALLOWLISTED but UNSUPPORTED —
        # spec §13 requires documented activity-rule coverage evidence before
        # the rule ships. Attempting to use it raises MetricUnavailableError
        # so callers cannot silently see 0 and mistake it for "no events".
        "no_update",
    }
)

# Attention rules are a union over snapshot rules. Each row is a distinct
# issue; reasons are a list of rule keys the issue satisfies.
VALID_ATTENTION_RULES: FrozenSet[str] = frozenset(
    {
        "overdue",
        "blocked",
        "due_soon",
        "unassigned_urgent_high",
        # "no_update" excluded for the same reason as VALID_SNAPSHOT_RULES.
    }
)

VALID_DATE_BUCKETS: FrozenSet[str] = frozenset({"day", "week", "month"})

VALID_DELIVERY_BASES: FrozenSet[str] = frozenset({"created_at", "completed_at"})

# Allowlisted selection dimensions. ``assignee`` triggers an IssueAssignee
# join; ``project`` triggers a Project join; ``state_group`` is already on
# the Issue; ``label`` triggers a label_issue join.
VALID_DIMENSIONS: FrozenSet[str] = frozenset(
    {"assignee", "project", "state_group", "label"}
)

# Business-filter keys (allowlisted server-side). The value list is always
# resolved through a real relation (see DashboardScope.apply_business_filters).
VALID_BUSINESS_FILTERS: FrozenSet[str] = frozenset(
    {
        "state_id",
        "state_group",
        "priority",
        "assignee_id",
        "label_id",
        "cycle_id",
        "module_id",
        "created_by",
        "work_item_type",
    }
)


class DashboardContractError(ValueError):
    """Raised on any contract violation (unknown key, invalid payload)."""


class MetricUnavailableError(NotImplementedError):
    """Raised when a metric/rule is requested before its coverage gate is met.

    ``no_update`` is the canonical example: the spec requires the activity-rule
    coverage gate (mapping every meaningful IssueActivity verb to a writer)
    to be documented with evidence before the rule ships. Until then the rule
    must not return a 0 that callers could mistake for "no events".
    """


@dataclass(frozen=True)
class DashboardSelection:
    """Validated, immutable selection for one dashboard request.

    Attributes
    ----------
    metric:
        A snapshot rule key (e.g. ``"overdue"``) or an attention rule key.
        For the overview KPI strip, ``"all"`` returns every snapshot count.
    rules:
        Additional snapshot rule keys used for the attention union. Must be
        a subset of :data:`VALID_ATTENTION_RULES`.
    dimensions:
        Allowlisted dimensions. The only supported dimensions for the
        operations module are ``"assignee"``, ``"project"``, ``"state_group"``
        and ``"label"``.
    date_bucket:
        Granularity for delivery trend queries; must be in
        :data:`VALID_DATE_BUCKETS`.
    delivery_base:
        Which timestamp basis feeds the delivery trend. ``"created_at"`` or
        ``"completed_at"`` only.
    """

    metric: str = "all"
    rules: FrozenSet[str] = field(default_factory=frozenset)
    dimensions: FrozenSet[str] = field(default_factory=frozenset)
    date_bucket: str = "day"
    delivery_base: str = "created_at"

    def __post_init__(self) -> None:
        if self.metric != "all" and self.metric not in VALID_SNAPSHOT_RULES:
            raise DashboardContractError(
                f"Unknown snapshot rule: {self.metric!r}. Allowed: {sorted(VALID_SNAPSHOT_RULES)}"
            )
        if self.date_bucket not in VALID_DATE_BUCKETS:
            raise DashboardContractError(
                f"Unknown date bucket: {self.date_bucket!r}. Allowed: {sorted(VALID_DATE_BUCKETS)}"
            )
        if self.delivery_base not in VALID_DELIVERY_BASES:
            raise DashboardContractError(
                f"Unknown delivery base: {self.delivery_base!r}. Allowed: {sorted(VALID_DELIVERY_BASES)}"
            )
        for dimension in self.dimensions:
            if dimension not in VALID_DIMENSIONS:
                raise DashboardContractError(
                    f"Unknown dimension: {dimension!r}. Allowed: {sorted(VALID_DIMENSIONS)}"
                )
        for rule in self.rules:
            if rule not in VALID_ATTENTION_RULES:
                raise DashboardContractError(
                    f"Unknown attention rule: {rule!r}. Allowed: {sorted(VALID_ATTENTION_RULES)}"
                )


@dataclass(frozen=True)
class PeriodRange:
    """Half-open ``[start, end)`` window in the workspace timezone.

    ``start`` is inclusive, ``end`` is exclusive. Both are UTC-aware
    datetimes so they compose with the ``created_at`` / ``completed_at``
    columns. :attr:`today` is the calendar date in the workspace
    timezone and is used for ``overdue`` / ``due_today`` / ``due_soon``
    predicates, where the boundary is a calendar day, not a UTC instant.
    """

    start: Optional[datetime]
    end: Optional[datetime]
    today: date

    def contains(self, instant: datetime) -> bool:
        """Return True if ``instant`` lies inside ``[start, end)``."""
        if self.start is not None and instant < self.start:
            return False
        if self.end is not None and instant >= self.end:
            return False
        return True


@dataclass(frozen=True)
class DashboardScope:
    """Normalised read state for one dashboard request.

    The scope owns:

    * the workspace + principal and the principal's ACL-safe queryset
      (``base_queryset``);
    * the workspace timezone and resolved period range;
    * a stable :attr:`scope_key` that the client uses to detect cross-scope
      response leakage;
    * the resolved project ID list (after ACL intersection);
    * the optional business-filter set (state, priority, assignee, label,
      cycle, module, created_by, work_item_type) — restricted to allowlisted
      values.

    Every dashboard selector and orchestrator must consume a
    :class:`DashboardScope`. They never accept raw ORM fields or arbitrary
    user identifiers.
    """

    workspace: Any
    principal: Any
    timezone: str
    today: date
    period: PeriodRange
    base_queryset: QuerySet
    visible_project_ids: List[str]
    business_filters: Dict[str, List[str]]
    scope_key: str

    def filter(self, **kwargs: Any) -> "DashboardScope":
        """Return a new scope with extra business filters applied.

        The original scope is immutable. ``kwargs`` keys must match the
        allowlisted business-filter fields; unknown keys raise
        :class:`DashboardContractError`.
        """
        from .predicates import compute_scope_key  # local import to avoid cycle

        merged: Dict[str, List[str]] = dict(self.business_filters)
        for k, v in kwargs.items():
            if k not in VALID_BUSINESS_FILTERS:
                raise DashboardContractError(f"Unknown business filter: {k!r}")
            merged[k] = list(v) if isinstance(v, (list, tuple)) else [v]

        return DashboardScope(
            workspace=self.workspace,
            principal=self.principal,
            timezone=self.timezone,
            today=self.today,
            period=self.period,
            base_queryset=self.base_queryset,
            visible_project_ids=self.visible_project_ids,
            business_filters=merged,
            scope_key=compute_scope_key(
                workspace=self.workspace,
                principal=self.principal,
                timezone_name=self.timezone,
                today=self.today,
                period=self.period,
                project_ids=self.visible_project_ids,
                business_filters=merged,
            ),
        )

    def apply_business_filters(self, queryset: QuerySet) -> QuerySet:
        """Apply this scope's business filters to ``queryset``.

        Filters go through the actual model relations (CycleIssue, ModuleIssue,
        IssueLabel, IssueAssignee) and always honour ``deleted_at`` so soft-
        deleted links do not silently widen the result.
        """
        from plane.db.models import (
            CycleIssue,
            IssueAssignee,
            IssueLabel,
            ModuleIssue,
        )

        for key, values in self.business_filters.items():
            if not values:
                continue
            if key == "state_group":
                queryset = queryset.filter(state__group__in=values)
            elif key == "state_id":
                queryset = queryset.filter(state_id__in=values)
            elif key == "priority":
                queryset = queryset.filter(priority__in=values)
            elif key == "created_by":
                queryset = queryset.filter(created_by_id__in=values)
            elif key == "assignee_id":
                queryset = queryset.filter(
                    issue_assignee__assignee_id__in=values,
                    issue_assignee__deleted_at__isnull=True,
                ).distinct()
            elif key == "label_id":
                # Exclude deleted IssueLabel rows (the through model), not just
                # the underlying Label — soft-deleted links must not widen
                # the result. The Issue reverse for IssueLabel is
                # ``label_issue`` (the FK ``related_name`` on both sides).
                queryset = queryset.filter(
                    label_issue__label_id__in=values,
                    label_issue__deleted_at__isnull=True,
                ).distinct()
            elif key == "cycle_id":
                queryset = queryset.filter(
                    issue_cycle__cycle_id__in=values,
                    issue_cycle__deleted_at__isnull=True,
                ).distinct()
            elif key == "module_id":
                queryset = queryset.filter(
                    issue_module__module_id__in=values,
                    issue_module__deleted_at__isnull=True,
                ).distinct()
            elif key == "work_item_type":
                queryset = queryset.filter(type_id__in=values)
            else:
                raise DashboardContractError(f"Unhandled business filter: {key!r}")
        return queryset