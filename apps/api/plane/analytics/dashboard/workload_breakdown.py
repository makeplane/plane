# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Per-member project/label mix for the workload tab.

Shows who is on which project or label as a percentage of their
period-relevant assignments: open work now plus work completed in the
selected period (same period window as ``completed_in_period``).
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple

from django.db.models import Count, Q

from .contracts import DashboardContractError, DashboardScope
from .predicates import _open_q, operational_queryset

VALID_WORKLOAD_BREAKDOWN_BY = frozenset({"project", "label"})
DEFAULT_BREAKDOWN_SLICE_LIMIT = 5
MAX_BREAKDOWN_SLICE_LIMIT = 8


def attach_workload_breakdowns(
    scope: DashboardScope,
    rows: List[Dict[str, Any]],
    *,
    breakdown_by: Optional[str],
    slice_limit: int = DEFAULT_BREAKDOWN_SLICE_LIMIT,
) -> None:
    """Mutates ``rows`` in place with a ``breakdown`` object when requested."""
    if breakdown_by is None:
        return
    if breakdown_by not in VALID_WORKLOAD_BREAKDOWN_BY:
        raise DashboardContractError(
            f"breakdown_by must be one of {sorted(VALID_WORKLOAD_BREAKDOWN_BY)}; got {breakdown_by!r}"
        )
    if not (1 <= slice_limit <= MAX_BREAKDOWN_SLICE_LIMIT):
        raise DashboardContractError(
            f"breakdown_limit must be 1..{MAX_BREAKDOWN_SLICE_LIMIT}; got {slice_limit}"
        )

    member_ids = [r["member_id"] for r in rows if r.get("member_id")]
    if not member_ids:
        return

    activity_q = _period_activity_q(scope)
    base = operational_queryset(scope).filter(activity_q)

    if breakdown_by == "project":
        raw = _project_counts(base, member_ids)
    else:
        raw = _label_counts(base, member_ids)

    for row in rows:
        mid = row.get("member_id")
        if not mid:
            row["breakdown"] = _empty_breakdown(breakdown_by)
            continue
        buckets = raw.get(str(mid), [])
        row["breakdown"] = _pack_breakdown(breakdown_by, buckets, slice_limit=slice_limit)


def _period_activity_q(scope: DashboardScope) -> Q:
    completed = Q(state__group="completed")
    if scope.period.start is not None:
        completed &= Q(completed_at__gte=scope.period.start)
    if scope.period.end is not None:
        completed &= Q(completed_at__lt=scope.period.end)
    return _open_q() | completed


def _project_counts(base, member_ids: List[str]) -> Dict[str, List[Tuple[Optional[str], str, int]]]:
    agg = (
        base.filter(
            issue_assignee__assignee_id__in=member_ids,
            issue_assignee__deleted_at__isnull=True,
        )
        .values("issue_assignee__assignee_id", "project_id", "project__name")
        .annotate(issue_count=Count("id", distinct=True))
        .order_by("-issue_count")
    )
    by_member: Dict[str, List[Tuple[Optional[str], str, int]]] = {}
    for row in agg:
        mid = str(row["issue_assignee__assignee_id"])
        name = row["project__name"] or "Untitled project"
        by_member.setdefault(mid, []).append(
            (str(row["project_id"]), name, int(row["issue_count"]))
        )
    return by_member


def _label_counts(base, member_ids: List[str]) -> Dict[str, List[Tuple[Optional[str], str, int]]]:
    linked = base.filter(
        issue_assignee__assignee_id__in=member_ids,
        issue_assignee__deleted_at__isnull=True,
        label_issue__deleted_at__isnull=True,
    )
    agg = (
        linked.values(
            "issue_assignee__assignee_id",
            "label_issue__label_id",
            "label_issue__label__name",
        )
        .annotate(issue_count=Count("id", distinct=True))
        .order_by("-issue_count")
    )
    by_member: Dict[str, List[Tuple[Optional[str], str, int]]] = {}
    for row in agg:
        mid = str(row["issue_assignee__assignee_id"])
        label_id = row["label_issue__label_id"]
        if label_id is None:
            continue
        name = row["label_issue__label__name"] or "Label"
        by_member.setdefault(mid, []).append((str(label_id), name, int(row["issue_count"])))

    unlabeled = _unlabeled_counts(base, member_ids)
    for mid, count in unlabeled.items():
        if count > 0:
            by_member.setdefault(mid, []).append((None, "No label", count))
    return by_member


def _unlabeled_counts(base, member_ids: List[str]) -> Dict[str, int]:
    from plane.db.models import IssueLabel

    from django.db.models import Exists, OuterRef

    has_label = IssueLabel.objects.filter(
        issue_id=OuterRef("pk"),
        deleted_at__isnull=True,
    )
    qs = (
        base.filter(
            issue_assignee__assignee_id__in=member_ids,
            issue_assignee__deleted_at__isnull=True,
        )
        .annotate(_has_label=Exists(has_label))
        .filter(_has_label=False)
        .values("issue_assignee__assignee_id")
        .annotate(issue_count=Count("id", distinct=True))
    )
    return {str(r["issue_assignee__assignee_id"]): int(r["issue_count"]) for r in qs}


def _empty_breakdown(breakdown_by: str) -> Dict[str, Any]:
    return {
        "by": breakdown_by,
        "basis": "open_or_completed_in_period",
        "denominator": 0,
        "slices": [],
    }


def _pack_breakdown(
    breakdown_by: str,
    buckets: List[Tuple[Optional[str], str, int]],
    *,
    slice_limit: int,
) -> Dict[str, Any]:
    if not buckets:
        return _empty_breakdown(breakdown_by)

    buckets.sort(key=lambda b: (-b[2], b[1].lower()))
    denominator = sum(count for _, _, count in buckets)
    if denominator <= 0:
        return _empty_breakdown(breakdown_by)

    if len(buckets) <= slice_limit:
        chosen = buckets
    else:
        head = buckets[: slice_limit - 1]
        tail_count = sum(c for _, _, c in buckets[slice_limit - 1 :])
        chosen = head + [(None, "Other", tail_count)]

    slices: List[Dict[str, Any]] = []
    pct_running = 0
    for idx, (group_id, name, count) in enumerate(chosen):
        if idx == len(chosen) - 1:
            pct = max(0, 100 - pct_running)
        else:
            pct = round(100 * count / denominator)
            pct_running += pct
        slices.append(
            {
                "group_id": group_id,
                "name": name,
                "count": count,
                "pct": pct,
            }
        )

    return {
        "by": breakdown_by,
        "basis": "open_or_completed_in_period",
        "denominator": denominator,
        "slices": slices,
    }
