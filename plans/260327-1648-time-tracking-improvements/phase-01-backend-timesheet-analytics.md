# Phase 01 — Backend: My Timesheet + Analytics Endpoint

**Status:** Todo | **Priority:** High | **Effort:** M

## Overview

1. My Timesheet backend: No structural change needed — already filters `logged_by=request.user`. Minor: verify URL routing allows no bulk-update from frontend (no backend changes required unless we want to enforce read-only at API level).
2. New `ProjectAnalyticsTimesheetEndpoint` — like timesheet grid but for ALL project issues aggregated across all assignees, plus per-user breakdown.

## Files to Modify

- `apps/api/plane/app/views/workspace/time_tracking/__init__.py` — register new view
- `apps/api/plane/app/urls/workspace.py` (or wherever time-tracking URLs live) — add URL pattern

## Files to Create

- `apps/api/plane/app/views/workspace/time_tracking/analytics_timesheet.py`

## Implementation Steps

### 1. Create `analytics_timesheet.py`

```python
# apps/api/plane/app/views/workspace/time_tracking/analytics_timesheet.py

from collections import defaultdict
from datetime import timedelta
from django.db.models import Sum
from django.utils import timezone
from rest_framework.response import Response
from rest_framework import status
from plane.app.views.base import BaseAPIView
from plane.app.permissions import allow_permission, ROLE
from plane.db.models import IssueWorkLog, Issue


class ProjectAnalyticsTimesheetEndpoint(BaseAPIView):
    """
    Week-grid view for ALL project issues, with logtime aggregated from ALL users.
    Per-issue, per-day breakdown also includes per-user split.

    GET /api/workspaces/<slug>/projects/<project_id>/time-tracking/analytics/timesheet/
    ?week_start=YYYY-MM-DD  (optional, defaults to current week Monday)
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id):
        # Parse week_start (reuse helper from timesheet_grid.py or inline)
        raw = request.query_params.get("week_start")
        if raw:
            from datetime import date as _date
            try:
                week_start = _date.fromisoformat(raw)
                week_start = week_start - timedelta(days=week_start.weekday())
            except ValueError:
                return Response({"error": "Invalid date format. Use YYYY-MM-DD."}, status=400)
        else:
            today = timezone.now().date()
            week_start = today - timedelta(days=today.weekday())

        week_end = week_start + timedelta(days=6)

        # All issues in project that have worklogs in this week (or all assigned)
        # Strategy: get all issues that have ANY worklog in this week
        worklogs_in_week = (
            IssueWorkLog.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                logged_at__range=[week_start, week_end],
            )
            .select_related("issue__project", "logged_by")
            .values(
                "issue_id", "issue__name", "issue__sequence_id",
                "issue__project__identifier", "issue__project_id",
                "logged_by_id", "logged_by__display_name", "logged_by__avatar",
                "logged_at",
            )
            .annotate(total=Sum("duration_minutes"))
        )

        # Build structure: issue_id → {info, days: {date: total}, by_user: {user_id: {days, total}}}
        issue_map = {}
        for wl in worklogs_in_week:
            iid = str(wl["issue_id"])
            date_str = wl["logged_at"].isoformat()
            uid = str(wl["logged_by_id"])
            mins = wl["total"]

            if iid not in issue_map:
                issue_map[iid] = {
                    "issue_id": iid,
                    "issue_name": wl["issue__name"],
                    "issue_identifier": f"{wl['issue__project__identifier']}-{wl['issue__sequence_id']}",
                    "project_id": str(wl["issue__project_id"]),
                    "days": defaultdict(int),
                    "by_user": {},
                    "total_minutes": 0,
                }

            issue_map[iid]["days"][date_str] += mins
            issue_map[iid]["total_minutes"] += mins

            if uid not in issue_map[iid]["by_user"]:
                issue_map[iid]["by_user"][uid] = {
                    "user_id": uid,
                    "display_name": wl["logged_by__display_name"],
                    "avatar_url": wl["logged_by__avatar"] or "",
                    "days": defaultdict(int),
                    "total_minutes": 0,
                }
            issue_map[iid]["by_user"][uid]["days"][date_str] += mins
            issue_map[iid]["by_user"][uid]["total_minutes"] += mins

        # Convert defaultdicts to dicts; sort by total desc
        rows = []
        for info in issue_map.values():
            rows.append({
                **info,
                "days": dict(info["days"]),
                "by_user": [
                    {**u, "days": dict(u["days"])}
                    for u in info["by_user"].values()
                ],
            })
        rows.sort(key=lambda r: -r["total_minutes"])

        # Daily totals
        daily_totals = defaultdict(int)
        for r in rows:
            for day, mins in r["days"].items():
                daily_totals[day] += mins

        grand_total = sum(r["total_minutes"] for r in rows)

        return Response({
            "week_start": week_start.isoformat(),
            "week_end": week_end.isoformat(),
            "rows": rows,
            "daily_totals": dict(daily_totals),
            "grand_total_minutes": grand_total,
        }, status=status.HTTP_200_OK)
```

### 2. Register in `__init__.py`

Add to `apps/api/plane/app/views/workspace/time_tracking/__init__.py`:

```python
from .analytics_timesheet import ProjectAnalyticsTimesheetEndpoint
```

### 3. Add URL pattern

Find the URLs file registering time-tracking routes (likely `apps/api/plane/app/urls/workspace.py` or a dedicated time_tracking urls file).

Add:

```python
path(
    "workspaces/<str:slug>/projects/<str:project_id>/time-tracking/analytics/timesheet/",
    ProjectAnalyticsTimesheetEndpoint.as_view(),
    name="project-analytics-timesheet",
),
```

## Success Criteria

- `GET /api/workspaces/{slug}/projects/{project_id}/time-tracking/analytics/timesheet/` returns 200
- Response includes all issues with worklogs in the week (not just assigned to current user)
- Each row has `by_user` array with per-user daily breakdown
- `by_user[n].days` has same date-keyed format as `days`
- Empty week returns `rows: []`

## Notes

- The existing `TimesheetGridEndpoint` is NOT modified (it's correct for My Timesheet)
- No `bulk-update` endpoint change needed — frontend will simply stop calling it
- Performance: worklogs query uses date range + workspace + project — should be fast with existing indexes
