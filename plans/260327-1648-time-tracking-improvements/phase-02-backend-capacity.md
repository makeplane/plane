# Phase 02 — Backend: Capacity Improvements + Categories

**Status:** Todo | **Priority:** High | **Effort:** M

## Overview

1. Fix `ProjectCapacityEndpoint` — change permission to allow MEMBER (currently ADMIN only)
2. New `ProjectCapacityDayDetailsEndpoint` — tasks for a given member on a given day
3. New `ProjectCapacityCategoriesEndpoint` — count issues by label, split Main Task vs Sub Task

## Files to Modify

- `apps/api/plane/app/views/capacity.py` — fix permission + add day-details endpoint
- `apps/api/plane/app/views/workspace/time_tracking/__init__.py` — register new views
- URL file — add new URL patterns

## Implementation Steps

### 1. Fix permission in `capacity.py`

Change:

```python
@allow_permission([ROLE.ADMIN], level="PROJECT")
```

To:

```python
@allow_permission([ROLE.ADMIN, ROLE.MEMBER])
```

This allows all project members to view the capacity dashboard, not just admins.

### 2. Add `ProjectCapacityDayDetailsEndpoint` to `capacity.py`

```python
class ProjectCapacityDayDetailsEndpoint(BaseAPIView):
    """
    List all worklog entries (tasks) for a specific member on a specific date.
    Used by Capacity heatmap cell click → dropdown.

    GET /api/workspaces/<slug>/projects/<project_id>/time-tracking/capacity/day-details/
    ?member_id=<uuid>&date=YYYY-MM-DD
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id):
        member_id = request.query_params.get("member_id")
        date = request.query_params.get("date")

        if not member_id or not date:
            return Response({"error": "member_id and date are required."}, status=400)

        worklogs = (
            IssueWorkLog.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                logged_by_id=member_id,
                logged_at=date,
            )
            .select_related("issue__project")
            .values(
                "issue_id",
                "issue__name",
                "issue__sequence_id",
                "issue__project__identifier",
            )
            .annotate(total_minutes=Sum("duration_minutes"))
            .order_by("-total_minutes")
        )

        tasks = [
            {
                "issue_id": str(wl["issue_id"]),
                "issue_name": wl["issue__name"],
                "issue_identifier": f"{wl['issue__project__identifier']}-{wl['issue__sequence_id']}",
                "total_minutes": wl["total_minutes"],
            }
            for wl in worklogs
        ]

        return Response({"tasks": tasks}, status=status.HTTP_200_OK)
```

### 3. Create `capacity_categories.py`

<!-- Updated: Validation Session 1 - Use main_task_category/sub_task_category FK fields, not labels -->

```python
# apps/api/plane/app/views/workspace/time_tracking/capacity_categories.py

from django.db.models import Count, Q
from rest_framework.response import Response
from rest_framework import status

from plane.app.views.base import BaseAPIView
from plane.app.permissions import allow_permission, ROLE
from plane.db.models import Issue


class ProjectCapacityCategoriesEndpoint(BaseAPIView):
    """
    Category distribution for capacity view.
    Groups all project issues by main_task_category and sub_task_category FK fields.

    GET /api/workspaces/<slug>/projects/<project_id>/time-tracking/capacity/categories/
    ?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD&member_id=<uuid>  (all optional)
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id):
        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")
        member_id = request.query_params.get("member_id")

        # Base: active issues in this project
        base_qs = Issue.issue_objects.filter(
            workspace__slug=slug,
            project_id=project_id,
        )

        # Filter by assignee if member_id given
        if member_id:
            base_qs = base_qs.filter(assignees__id=member_id)

        # Filter by date range on worklogs if given
        if date_from or date_to:
            wl_filters = Q(workspace__slug=slug, project_id=project_id)
            if date_from:
                wl_filters &= Q(logged_at__gte=date_from)
            if date_to:
                wl_filters &= Q(logged_at__lte=date_to)
            from plane.db.models import IssueWorkLog
            issue_ids_with_logs = IssueWorkLog.objects.filter(wl_filters).values_list("issue_id", flat=True).distinct()
            base_qs = base_qs.filter(id__in=issue_ids_with_logs)

        def count_by_category(qs, category_field):
            """Count issues grouped by category FK name. Issues with no category → 'Uncategorized'."""
            name_field = f"{category_field}__name"
            categorized = (
                qs.filter(**{f"{category_field}__isnull": False})
                .values(name_field)
                .annotate(count=Count("id", distinct=True))
                .order_by("-count")
            )
            uncategorized_count = qs.filter(**{f"{category_field}__isnull": True}).count()
            result = [{"name": row[name_field], "count": row["count"]} for row in categorized]
            if uncategorized_count > 0:
                result.append({"name": "Uncategorized", "count": uncategorized_count})
            return result

        return Response(
            {
                "main_task_categories": count_by_category(base_qs, "main_task_category"),
                "sub_task_categories": count_by_category(base_qs, "sub_task_category"),
            },
            status=status.HTTP_200_OK,
        )
```

**Note:** `main_task_category` and `sub_task_category` are actual FK fields on the Issue model (confirmed). No parent filter or label lookup needed.

### 4. Register + add URLs

In `__init__.py`:

```python
from .capacity_categories import ProjectCapacityCategoriesEndpoint
```

In `capacity.py` already imported, just add the new class.

URL patterns to add:

```python
path(
    "workspaces/<str:slug>/projects/<str:project_id>/time-tracking/capacity/day-details/",
    ProjectCapacityDayDetailsEndpoint.as_view(),
    name="project-capacity-day-details",
),
path(
    "workspaces/<str:slug>/projects/<str:project_id>/time-tracking/capacity/categories/",
    ProjectCapacityCategoriesEndpoint.as_view(),
    name="project-capacity-categories",
),
```

## Success Criteria

- Capacity endpoint now accessible to MEMBER role
- `GET .../capacity/day-details/?member_id=&date=` returns list of tasks with hours
- `GET .../capacity/categories/` returns `{main_task_categories: [...], sub_task_categories: [...]}`
- Each category item has `{name, count}` structure

## Notes

- "Category" = grouped by `main_task_category__name` / `sub_task_category__name` FK fields on Issue model (confirmed, not label-based)
- Both fields can be null → falls back to "Uncategorized" bucket
- Day-details endpoint: returns per-worklog-entry aggregation, NOT per-day total (user may log multiple times)
