# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Pure aggregation helpers for the instance usage-monitor dashboards.

Inputs are an ``IssueWorkLog`` queryset (the caller applies date-range, user
and live-parent filters) or plain lists of the dicts these helpers return.
Outputs are JSON-ready dicts/lists — no ORM objects leak out, keeping the
functions cheap to unit test.

Activity here means "logged time": login history is not stored, so a user is
counted active for a day when their summed worklog duration for that day is > 0.
"""

from collections import defaultdict
from datetime import date

from django.db.models import Sum

# A "standard" working day is at least 8 logged hours.
STANDARD_DAILY_MINUTES = 480


def user_day_totals(queryset):
    """Per-(user, day) summed minutes; 0-minute-only days dropped.

    Returns ``[{"user_id", "day": date, "total_minutes": int}]``. Shared by the
    active and standard metrics so the endpoint aggregates only once.
    """
    rows = (
        queryset.values("logged_by", "logged_at")
        .annotate(total=Sum("duration_minutes"))
        .filter(total__gt=0)
    )
    return [
        {"user_id": r["logged_by"], "day": r["logged_at"], "total_minutes": r["total"]}
        for r in rows
    ]


def user_workspace_day_totals(queryset):
    """Per-(user, workspace, day) summed minutes; 0-minute-only buckets dropped.

    Adds the workspace grain that department classification needs (a user can be
    standard in one workspace and not another). Returns
    ``[{"user_id", "workspace_id", "day": date, "total_minutes": int}]``.
    """
    rows = (
        queryset.values("logged_by", "workspace", "logged_at")
        .annotate(total=Sum("duration_minutes"))
        .filter(total__gt=0)
    )
    return [
        {
            "user_id": r["logged_by"],
            "workspace_id": r["workspace"],
            "day": r["logged_at"],
            "total_minutes": r["total"],
        }
        for r in rows
    ]


def project_totals(queryset):
    """Per-project summed minutes with the project name resolved via join.

    The queryset already excludes soft-deleted parents, so only live projects
    appear. Returns ``[{"project_id", "project_name", "workspace_id", "total_minutes"}]``.
    """
    rows = (
        queryset.values("project", "project__name", "workspace")
        .annotate(total=Sum("duration_minutes"))
        .filter(total__gt=0)
    )
    return [
        {
            "project_id": str(r["project"]),
            "project_name": r["project__name"],
            "workspace_id": str(r["workspace"]),
            "total_minutes": r["total"],
        }
        for r in rows
    ]


def bucket_key(day: date, granularity: str) -> str:
    """Map a date to its bucket label for the chosen granularity."""
    if granularity == "year":
        return f"{day.year:04d}"
    if granularity == "month":
        return f"{day.year:04d}-{day.month:02d}"
    return day.isoformat()


def active_users_series(rows, granularity):
    """Distinct active users per bucket, sorted by period."""
    buckets = defaultdict(set)
    for r in rows:
        buckets[bucket_key(r["day"], granularity)].add(r["user_id"])
    return [
        {"period": period, "active_users": len(users)}
        for period, users in sorted(buckets.items())
    ]


def total_active_users(rows) -> int:
    """Distinct active users across all rows (deduped instance-wide)."""
    return len({r["user_id"] for r in rows})


def standard_users_series(rows, granularity):
    """Per bucket, non-overlapping counts of standard vs non-standard user-days.

    standard + non_standard == active user-days for the bucket (standard ⊆ active).
    """
    buckets = defaultdict(lambda: {"standard": 0, "non_standard": 0})
    for r in rows:
        key = bucket_key(r["day"], granularity)
        if r["total_minutes"] >= STANDARD_DAILY_MINUTES:
            buckets[key]["standard"] += 1
        else:
            buckets[key]["non_standard"] += 1
    return [
        {
            "period": period,
            "standard_user_days": counts["standard"],
            "non_standard_user_days": counts["non_standard"],
        }
        for period, counts in sorted(buckets.items())
    ]


def standard_users_pie(rows):
    """Range-level split: a user is standard if they have >= 1 standard day.

    Non-standard users are active users who never hit the daily threshold in range.
    """
    standard_users = set()
    all_users = set()
    for r in rows:
        all_users.add(r["user_id"])
        if r["total_minutes"] >= STANDARD_DAILY_MINUTES:
            standard_users.add(r["user_id"])
    total = len(all_users)
    standard = len(standard_users)
    return {
        "standard_users": standard,
        "non_standard_users": total - standard,
        "total_active_users": total,
    }


def department_aggregates(ws_day_rows, project_rows, workspaces):
    """Per-workspace active/standard users, total minutes and project count.

    ``workspaces`` is a ``{workspace_id(str): {"name", "slug"}}`` map built from
    live ``Workspace`` rows; workspace ids absent from it are dropped (defensive
    against ghost rows). Standard classification is per (user, workspace): a user
    is standard in a workspace if they have >= 1 day >= 480 minutes there.
    """
    agg = {}
    for r in ws_day_rows:
        wid = str(r["workspace_id"])
        if wid not in workspaces:
            continue
        bucket = agg.setdefault(
            wid, {"active": set(), "standard": set(), "minutes": 0}
        )
        bucket["active"].add(r["user_id"])
        bucket["minutes"] += r["total_minutes"]
        if r["total_minutes"] >= STANDARD_DAILY_MINUTES:
            bucket["standard"].add(r["user_id"])

    project_ids = defaultdict(set)
    for r in project_rows:
        wid = str(r["workspace_id"])
        if wid in workspaces:
            project_ids[wid].add(r["project_id"])

    result = [
        {
            "workspace_id": wid,
            "workspace_name": workspaces[wid]["name"],
            "slug": workspaces[wid]["slug"],
            "active_users": len(bucket["active"]),
            "standard_users": len(bucket["standard"]),
            "total_logged_minutes": bucket["minutes"],
            "projects_with_logged_time": len(project_ids.get(wid, set())),
        }
        for wid, bucket in agg.items()
    ]
    result.sort(key=lambda x: x["total_logged_minutes"], reverse=True)
    return result
