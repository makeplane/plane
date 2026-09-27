# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Team Operations Dashboard (P0) — operational read service.

Distinct from :mod:`plane.analytics.v2`, which keeps the Analytics V2 query
engine contract. This module owns:

* :class:`DashboardScope` — normalised workspace/principal/period/ACL state
* operational predicates and selectors (current-snapshot counts and lists)
* read models for workload, projects, timeline and attention
* thin view orchestration that funnels every dashboard row through the same
  ACL-safe queryset, so KPI drilldown totals always equal list drilldown
  totals in the same read state.

All selection is restricted to allowlisted metric/rule/dimension keys. The
service never accepts raw ORM fields from the client.
"""

from .contracts import (
    DEFAULT_PERIOD,
    DEFAULT_TIMEZONE,
    PRESET_LAST_30_DAYS,
    PRESET_LAST_7_DAYS,
    PRESET_NONE,
    PRESET_THIS_MONTH,
    VALID_BUSINESS_FILTERS,
    VALID_DATE_BUCKETS,
    VALID_DELIVERY_BASES,
    VALID_PERIOD_PRESETS,
    VALID_SNAPSHOT_RULES,
    VALID_ATTENTION_RULES,
    DashboardContractError,
    DashboardScope,
    DashboardSelection,
    MetricUnavailableError,
    PeriodRange,
)
from .predicates import (
    _resolve_preset_range,
    active_issue_base,
    compute_scope_key,
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


__all__ = [
    # contracts
    "DashboardScope",
    "DashboardSelection",
    "DashboardContractError",
    "MetricUnavailableError",
    "PeriodRange",
    "VALID_BUSINESS_FILTERS",
    "VALID_DATE_BUCKETS",
    "VALID_DELIVERY_BASES",
    "VALID_PERIOD_PRESETS",
    "VALID_SNAPSHOT_RULES",
    "VALID_ATTENTION_RULES",
    "DEFAULT_PERIOD",
    "DEFAULT_TIMEZONE",
    "PRESET_THIS_MONTH",
    "PRESET_LAST_7_DAYS",
    "PRESET_LAST_30_DAYS",
    "PRESET_NONE",
    # predicates
    "resolve_dashboard_scope",
    "compute_scope_key",
    "_resolve_preset_range",
    "active_issue_base",
    "operational_queryset",
    "count_total",
    "count_open",
    "count_not_started",
    "count_started",
    "count_completed",
    "count_cancelled",
    "count_overdue",
    "count_due_today",
    "count_due_soon",
    "count_blocked",
    "count_unassigned_urgent_high",
    "count_completed_in_period",
    "count_attention_union",
    "list_issues",
]