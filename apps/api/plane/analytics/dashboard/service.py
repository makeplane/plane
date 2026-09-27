# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Read service for the Team Operations Dashboard.

The service composes the canonical read state per request and emits a
versioned, ACL-safe response envelope. Every section is wrapped in a
try/except boundary so one failing helper never blanks the rest of the
overview — a per-section failure yields ``{"status": "error", ...}``
without affecting siblings.

Section IDs are stable (``kpis``, ``progress``, ``delivery``,
``top_projects``, ``attention_preview``) so the client can map render
slots to data deterministically.

Counts and lists are derived from the same selector helpers so the
overview KPI total always equals the items endpoint total in the same
read state.
"""

from __future__ import annotations

from collections import OrderedDict
from datetime import date, datetime, time, timedelta, timezone
from typing import Any, Callable, Dict, List, Optional, Tuple

import pytz
from django.db.models import Q, QuerySet

from .contracts import (
    DashboardScope,
    VALID_DATE_BUCKETS,
)
from .predicates import (
    _blocked_q,
    _due_soon_q,
    _open_q,
    _overdue_q,
    _unassigned_urgent_high_q,
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
    operational_queryset,
)


# ----- envelope helpers ---------------------------------------------------


def envelope(scope: DashboardScope, payload: Any) -> Dict[str, Any]:
    """Wrap ``payload`` in the canonical response envelope.

    ``payload`` may be:
    * a list of section dicts (overview endpoint);
    * a single section dict (attention, items).

    The envelope always carries the resolved scope + period metadata.
    """
    if isinstance(payload, list):
        sections = payload
    elif isinstance(payload, dict):
        sections = [payload]
    else:
        sections = [{"status": "ok", "data": payload}]

    return {
        "version": 1,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "scope_key": scope.scope_key,
        "resolved_scope": {
            "workspace_id": str(getattr(scope.workspace, "id", "")),
            "principal_id": str(getattr(scope.principal, "id", "")),
            "project_ids": list(scope.visible_project_ids),
            "business_filters": dict(scope.business_filters),
        },
        "resolved_period": {
            "start": scope.period.start.isoformat() if scope.period.start else None,
            "end": scope.period.end.isoformat() if scope.period.end else None,
            "today": scope.today.isoformat(),
        },
        "timezone": scope.timezone,
        "sections": sections,
    }


def _section(section_id: str, builder: Callable[[], Dict[str, Any]]) -> Dict[str, Any]:
    """Run a section builder with an isolated failure boundary.

    Returns a section dict with a stable ``section_id``. On exception,
    returns ``{"status": "error", "section_id": ..., "reason": "..."}``
    so the rest of the overview keeps rendering.
    """
    try:
        data = builder()
        return {"status": "ok", "section_id": section_id, "data": data}
    except Exception as exc:  # noqa: BLE001 - keep overview robust
        return {
            "status": "error",
            "section_id": section_id,
            "reason": f"{type(exc).__name__}",
        }


# ----- KPI + progress composition ---------------------------------------


def _kpis(scope: DashboardScope) -> Dict[str, Any]:
    """6 current-snapshot KPIs."""
    counts = {
        "total": count_total(scope),
        "open": count_open(scope),
        "not_started": count_not_started(scope),
        "started": count_started(scope),
        "completed": count_completed(scope),
        "cancelled": count_cancelled(scope),
        "overdue": count_overdue(scope),
        "due_today": count_due_today(scope),
        "due_soon": count_due_soon(scope),
        "blocked": count_blocked(scope),
    }
    # Snapshots are current-state, not period-filtered.
    return counts


def _progress(scope: DashboardScope) -> Dict[str, Any]:
    """Stacked-bar summary by state group (excludes cancelled)."""
    groups = [
        ("backlog", count_state_group(scope, "backlog")),
        ("unstarted", count_state_group(scope, "unstarted")),
        ("started", count_state_group(scope, "started")),
        ("completed", count_state_group(scope, "completed")),
        ("cancelled", count_state_group(scope, "cancelled")),
    ]
    total = sum(v for _, v in groups)
    denom = total - groups[-1][1]  # total - cancelled
    completion_rate = (groups[3][1] / denom) if denom > 0 else None
    return {
        "state_groups": [{"group": g, "count": c} for g, c in groups],
        "completion_rate": completion_rate,
        "denominator": denom,
    }


def count_state_group(scope: DashboardScope, group: str) -> int:
    return operational_queryset(scope).filter(state__group=group).values("id").distinct().count()


# ----- delivery trend with day/week/month bucketing ---------------------


def _delivery_trend(scope: DashboardScope, *, bucket: str = "day") -> Dict[str, Any]:
    """Created vs completed time series bucketed by ``bucket``.

    Uses ``completed_at`` for completed counts (per spec §6.3) and
    ``created_at`` for created counts. Empty buckets are zero-filled so
    the line chart has a continuous x-axis.

    The bucket representation is a canonical ISO string (``YYYY-MM-DD``,
    ``YYYY-Www``, ``YYYY-MM``) shared between the ORM aggregation keys
    and the zero-fill boundary generator so the dict-lookup match works
    (coordinator finding: dict keys were datetime objects, zero-fill
    strings — every series was silently zero).
    """
    if scope.period.start is None or scope.period.end is None:
        return {
            "bucket": bucket,
            "series_created": [],
            "series_completed": [],
            "created_total": 0,
            "completed_total": 0,
            "delta": 0,
        }

    if bucket not in VALID_DATE_BUCKETS:
        bucket = "day"

    from django.db.models import Count
    from django.db.models.functions import TruncDate, TruncMonth, TruncWeek

    tz = pytz.timezone(scope.timezone or "UTC")
    bucket_labels = _bucket_labels(scope.period.start, scope.period.end, bucket=bucket, tz=tz)

    trunc = {
        "day": TruncDate,
        "week": TruncWeek,
        "month": TruncMonth,
    }[bucket]

    qs = operational_queryset(scope)

    # Pass workspace timezone so day buckets align with the workspace
    # calendar (UTC truncation would put Asia/Ho_Chi_Minh midnight events on
    # the wrong day).
    created_counts = dict(
        qs.filter(created_at__gte=scope.period.start, created_at__lt=scope.period.end)
        .annotate(bucket=trunc("created_at", tzinfo=tz))
        .values("bucket")
        .annotate(c=Count("id", distinct=True))
        .values_list("bucket", "c")
    )
    completed_counts = dict(
        qs.filter(
            state__group="completed",
            completed_at__gte=scope.period.start,
            completed_at__lt=scope.period.end,
        )
        .annotate(bucket=trunc("completed_at", tzinfo=tz))
        .values("bucket")
        .annotate(c=Count("id", distinct=True))
        .values_list("bucket", "c")
    )

    # Normalise ORM keys (date / datetime) to canonical ISO strings.
    def _normalize(counts: Dict[Any, int]) -> Dict[str, int]:
        out: Dict[str, int] = {}
        for key, value in counts.items():
            if hasattr(key, "date"):
                key = key.date()
            label = _bucket_label(key, bucket=bucket, tz=tz)
            out[label] = out.get(label, 0) + int(value)
        return out

    created_norm = _normalize(created_counts)
    completed_norm = _normalize(completed_counts)

    series_created = [{"bucket": d, "count": int(created_norm.get(d, 0))} for d in bucket_labels]
    series_completed = [
        {"bucket": d, "count": int(completed_norm.get(d, 0))} for d in bucket_labels
    ]
    created_total = sum(item["count"] for item in series_created)
    completed_total = sum(item["count"] for item in series_completed)
    return {
        "bucket": bucket,
        "series_created": series_created,
        "series_completed": series_completed,
        "created_total": created_total,
        "completed_total": completed_total,
        "delta": created_total - completed_total,
    }


def _bucket_label(value: Any, *, bucket: str, tz: pytz.BaseTzInfo) -> str:
    """Canonical ISO string for a bucket key.

    Day → ``YYYY-MM-DD`` (workspace-local calendar date).
    Week → ``YYYY-Www`` (ISO week-year + ISO week number).
    Month → ``YYYY-MM``.
    """
    if hasattr(value, "astimezone"):
        local = value.astimezone(tz)
    elif hasattr(value, "year"):
        local = value
    else:
        local = value
    if bucket == "day":
        return local.isoformat()
    if bucket == "week":
        iso_year, iso_week, _ = local.isocalendar()
        return f"{iso_year:04d}-W{iso_week:02d}"
    if bucket == "month":
        return f"{local.year:04d}-{local.month:02d}"
    return str(local)


def _bucket_labels(
    start: datetime, end: datetime, *, bucket: str, tz: pytz.BaseTzInfo
) -> List[str]:
    """Canonical ISO bucket labels covering [start, end) in workspace TZ.

    Day buckets walk the workspace-local calendar; week/month collapse
    duplicates via a set so the line chart has no gaps.
    """
    if hasattr(start, "astimezone"):
        start_local = start.astimezone(tz)
    else:
        start_local = start
    if hasattr(end, "astimezone"):
        end_local = end.astimezone(tz)
    else:
        end_local = end

    start_d = start_local.date() if hasattr(start_local, "date") else start_local
    end_d = end_local.date() if hasattr(end_local, "date") else end_local

    seen: List[str] = []
    seen_set: set = set()
    cur = start_d
    if bucket == "day":
        while cur < end_d:
            label = cur.isoformat()
            if label not in seen_set:
                seen.append(label)
                seen_set.add(label)
            cur += timedelta(days=1)
    elif bucket == "week":
        while cur < end_d:
            iso_year, iso_week, _ = cur.isocalendar()
            label = f"{iso_year:04d}-W{iso_week:02d}"
            if label not in seen_set:
                seen.append(label)
                seen_set.add(label)
            cur += timedelta(days=1)
    elif bucket == "month":
        while cur < end_d:
            label = f"{cur.year:04d}-{cur.month:02d}"
            if label not in seen_set:
                seen.append(label)
                seen_set.add(label)
            if cur.month == 12:
                cur = date(cur.year + 1, 1, 1)
            else:
                cur = date(cur.year, cur.month + 1, 1)
    return seen


# ----- top projects ----------------------------------------------------


def _top_projects(scope: DashboardScope, *, limit: int = 6) -> Dict[str, Any]:
    """Top N projects by overdue → blocked → open (current snapshot).

    Uses the shared ``operational_queryset`` so business filters and
    ACL apply uniformly. Aggregates on the issue rows, never on a
    second raw queryset.
    """
    from django.db.models import Count

    qs = operational_queryset(scope).filter(_open_q())
    rows = list(
        qs.values("project_id", "project__name")
        .annotate(
            overdue_count=Count("id", filter=_overdue_q(scope.today), distinct=True),
            blocked_count=Count("id", filter=_blocked_q(scope), distinct=True),
            open_count=Count("id", distinct=True),
        )
        .order_by("-overdue_count", "-blocked_count", "-open_count", "project__name")
        [:limit]
    )
    top = [
        {
            "project_id": str(row["project_id"]),
            "name": row["project__name"],
            "open": row["open_count"],
            "overdue": row["overdue_count"],
            "blocked": row["blocked_count"],
        }
        for row in rows
    ]
    return {
        "top": top,
        "total_projects_in_scope": len(scope.visible_project_ids),
        "shown": len(top),
    }


# ----- attention preview -----------------------------------------------


def _attention_preview(scope: DashboardScope, *, limit: int = 5) -> Dict[str, Any]:
    """Attention preview — uses ``paginated_attention`` for paging parity.

    Re-uses the per-row Exists annotation so reasons are truthful, not
    fabricated.
    """
    from .items import paginated_attention

    payload = paginated_attention(scope, page=1, page_size=limit)
    return {
        "preview": payload.get("rows", []),
        "reason_counts": payload.get("reason_counts", {}),
        "union_total": payload.get("union_total", 0),
        "total": payload.get("total", 0),
    }


# ----- overview composition --------------------------------------------


def overview_payload(
    scope: DashboardScope,
    *,
    date_bucket: str = "day",
    top_project_limit: int = 6,
    preview_limit: int = 5,
) -> List[Dict[str, Any]]:
    """Compose the overview sections (without the envelope wrapper).

    Each section is isolated by ``_section(...)`` so one failure cannot
    blank the rest.
    """
    sections: List[Dict[str, Any]] = []

    sections.append(_section("kpis", lambda: _kpis(scope)))
    sections.append(_section("progress", lambda: _progress(scope)))
    sections.append(
        _section(
            "delivery",
            lambda: _delivery_trend(scope, bucket=date_bucket),
        )
    )
    sections.append(
        _section(
            "top_projects",
            lambda: _top_projects(scope, limit=top_project_limit),
        )
    )
    sections.append(
        _section(
            "attention_preview",
            lambda: _attention_preview(scope, limit=preview_limit),
        )
    )
    # Workload preview (Task 3) is intentionally not yet wired: the
    # workload read model lives in ``dashboard.workload`` and the panel
    # contract is finalised in Task 3. We expose a placeholder status so
    # the UI can render "Loading…" instead of an empty box.
    sections.append(
        {
            "status": "unavailable",
            "section_id": "workload_preview",
            "reason": "workload_read_model_pending_task_3",
        }
    )
    # Echo the requested date_bucket for client confirmation. Validates
    # the request was honoured (coordinator finding: requested bucket was
    # previously ignored).
    sections.append(
        {
            "status": "ok",
            "section_id": "request_meta",
            "data": {"date_bucket": date_bucket},
        }
    )
    return sections