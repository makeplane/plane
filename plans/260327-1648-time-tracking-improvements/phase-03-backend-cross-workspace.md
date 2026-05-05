# Phase 03 — Backend: Cross Workspaces Endpoints

**Status:** Todo | **Priority:** Medium | **Effort:** L

## Overview

Two new workspace-level endpoints to aggregate data across ALL workspaces the current user belongs to:

1. Cross-workspace timesheet grid (for My Timesheet tab toggle)
2. Cross-workspace capacity report (for Capacity tab toggle)

## Files to Create

- `apps/api/plane/app/views/workspace/time_tracking/cross_workspace.py`

## Files to Modify

- `apps/api/plane/app/views/workspace/time_tracking/__init__.py`
- URL file — add new URL patterns

## Implementation Steps

### 1. Create `cross_workspace.py`

```python
# apps/api/plane/app/views/workspace/time_tracking/cross_workspace.py

from collections import defaultdict
from datetime import timedelta

from django.db.models import Sum, Q
from django.utils import timezone

from rest_framework.response import Response
from rest_framework import status

from plane.app.views.base import BaseAPIView
from plane.app.permissions import allow_permission, ROLE
from plane.db.models import IssueWorkLog, Issue, WorkspaceMember, ProjectMember


def _get_monday(raw_date_str):
    """Parse week_start string, snap to Monday. Returns (date, error_str)."""
    if raw_date_str:
        from datetime import date as _date
        try:
            d = _date.fromisoformat(raw_date_str)
            return d - timedelta(days=d.weekday()), None
        except ValueError:
            return None, "Invalid date format. Use YYYY-MM-DD."
    today = timezone.now().date()
    return today - timedelta(days=today.weekday()), None


class CrossWorkspaceTimesheetEndpoint(BaseAPIView):
    """
    My Timesheet grid across ALL workspaces the current user is a member of.
    Only shows the current user's own worklogs.

    GET /api/workspaces/<slug>/time-tracking/cross-workspace/timesheet/
    ?week_start=YYYY-MM-DD  (optional)

    The <slug> param is the current workspace (used for auth context only).
    Data spans ALL workspaces the user belongs to.
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        week_start, err = _get_monday(request.query_params.get("week_start"))
        if err:
            return Response({"error": err}, status=400)
        week_end = week_start + timedelta(days=6)

        # All workspace slugs this user is an active member of
        user_workspace_ids = WorkspaceMember.objects.filter(
            member=request.user,
            is_active=True,
        ).values_list("workspace_id", flat=True)

        # <!-- Updated: Validation Session 2 - query worklogs first (not all assigned issues) -->
        # Only issues with at least one worklog in the selected week
        worklogs = (
            IssueWorkLog.objects.filter(
                workspace_id__in=user_workspace_ids,
                logged_by=request.user,
                logged_at__range=[week_start, week_end],
            )
            .select_related("issue__project", "issue__workspace")
            .values(
                "issue_id", "issue__name", "issue__sequence_id",
                "issue__project__identifier", "issue__project_id",
                "issue__workspace__slug", "issue__workspace__name",
                "logged_at",
            )
            .annotate(total=Sum("duration_minutes"))
        )

        issue_days = defaultdict(lambda: defaultdict(int))
        issue_meta = {}
        for wl in worklogs:
            iid = str(wl["issue_id"])
            day = wl["logged_at"].isoformat()
            issue_days[iid][day] += wl["total"]
            if iid not in issue_meta:
                issue_meta[iid] = {
                    "issue_id": iid,
                    "issue_name": wl["issue__name"],
                    "issue_identifier": f"{wl['issue__project__identifier']}-{wl['issue__sequence_id']}",
                    "project_id": str(wl["issue__project_id"]),
                    "workspace_slug": wl["issue__workspace__slug"],
                    "workspace_name": wl["issue__workspace__name"],
                }

        rows = []
        for iid, info in issue_meta.items():
            days = dict(issue_days[iid])
            total = sum(days.values())
            rows.append({**info, "days": days, "total_minutes": total})

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


class CrossWorkspaceCapacityEndpoint(BaseAPIView):
    """
    Capacity report across ALL workspaces the current user is a member of.
    Lists ALL members from all workspaces with their logged time in date range.

    GET /api/workspaces/<slug>/time-tracking/cross-workspace/capacity/
    ?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD  (optional, defaults to current week)
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        today = timezone.now().date()
        default_start = today - timedelta(days=today.weekday())
        default_end = default_start + timedelta(days=6)

        date_from = request.query_params.get("date_from", default_start.isoformat())
        date_to = request.query_params.get("date_to", default_end.isoformat())

        # All workspace IDs user belongs to
        user_workspace_ids = WorkspaceMember.objects.filter(
            member=request.user,
            is_active=True,
        ).values_list("workspace_id", flat=True)

        # All active project members across those workspaces
        members_qs = (
            ProjectMember.objects.filter(
                workspace_id__in=user_workspace_ids,
                is_active=True,
            )
            .select_related("member", "workspace")
            .values_list("member_id", "member__display_name", "member__avatar", "workspace__slug")
        )

        # Build unique members map (user may appear in multiple projects)
        member_map = {}
        for mid, name, avatar, ws_slug in members_qs:
            key = str(mid)
            if key not in member_map:
                member_map[key] = {
                    "display_name": name,
                    "avatar_url": avatar or "",
                    "workspaces": set(),
                }
            member_map[key]["workspaces"].add(ws_slug)

        # Aggregate worklogs
        worklog_filters = {
            "workspace_id__in": user_workspace_ids,
            "logged_at__range": [date_from, date_to],
        }

        logged_qs = (
            IssueWorkLog.objects.filter(**worklog_filters)
            .values("logged_by")
            .annotate(total_logged=Sum("duration_minutes"))
        )
        logged_map = {str(r["logged_by"]): r["total_logged"] for r in logged_qs}

        daily_qs = (
            IssueWorkLog.objects.filter(**worklog_filters)
            .values("logged_by", "logged_at")
            .annotate(daily_logged=Sum("duration_minutes"))
        )
        member_days_map = {mid: {} for mid in member_map.keys()}
        for row in daily_qs:
            mid = str(row["logged_by"])
            if mid in member_days_map:
                member_days_map[mid][str(row["logged_at"])] = row["daily_logged"]

        result_members = []
        total_logged = 0
        for mid, info in member_map.items():
            member_logged = logged_map.get(mid, 0) or 0
            total_logged += member_logged
            result_members.append({
                "member_id": mid,
                "display_name": info["display_name"],
                "avatar_url": info["avatar_url"],
                "total_logged_minutes": member_logged,
                "days": member_days_map.get(mid, {}),
            })

        result_members.sort(key=lambda m: -m["total_logged_minutes"])

        return Response({
            "date_from": date_from,
            "date_to": date_to,
            "members": result_members,
            "project_total_logged": total_logged,
        }, status=status.HTTP_200_OK)
```

### 2. Register + URLs

`__init__.py`:

```python
from .cross_workspace import CrossWorkspaceTimesheetEndpoint, CrossWorkspaceCapacityEndpoint
```

URL patterns (workspace-level, not project-level):

```python
path(
    "workspaces/<str:slug>/time-tracking/cross-workspace/timesheet/",
    CrossWorkspaceTimesheetEndpoint.as_view(),
    name="cross-workspace-timesheet",
),
path(
    "workspaces/<str:slug>/time-tracking/cross-workspace/capacity/",
    CrossWorkspaceCapacityEndpoint.as_view(),
    name="cross-workspace-capacity",
),
```

## Success Criteria

- `GET .../cross-workspace/timesheet/` returns rows from multiple workspaces, each with `workspace_slug` + `workspace_name` fields
- `GET .../cross-workspace/capacity/` lists members from all user's workspaces
- Both endpoints require only MEMBER-level permission on the current workspace (auth context)
- No data from workspaces the user is not a member of leaks through

## Notes

- `WorkspaceMember` model field names: verify `workspace_id`, `member`, `is_active` against actual model
- Cross-workspace capacity may return large member sets — consider adding pagination or limiting to workspaces with activity in date range
- The `<slug>` path param is used only for permission check (current workspace context), not for data filtering
