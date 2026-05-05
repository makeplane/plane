# Phase 2: Backend Activity & Analytics APIs

## Context Links

- [Parent Plan](./plan.md)
- [Phase 1: Scope Resolution & Core APIs](./phase-01-backend-scope-resolution-core-apis.md)
- IssueActivity model: `apps/api/plane/db/models/issue.py` (line 405)
- Cycle model: `apps/api/plane/db/models/cycle.py` (line 60)
- StaffProfile model: `apps/api/plane/db/models/staff.py`

## Overview

- **Priority:** P1
- **Status:** pending
- **Effort:** 4h
- **Description:** Add 3 more endpoints to the head-office API: activity feed, staff analytics, and cycle metrics. All inherit HeadOfficeBaseView from Phase 1 and reuse scope resolution.

## Key Insights

- IssueActivity is a ProjectBaseModel: has `workspace` FK inherited, plus `issue`, `actor`, `field`, `old_value`, `new_value`, `verb`, `created_at`. Ordered by `-created_at`.
- Cycle has `start_date`, `end_date` (DateTimeField), `progress_snapshot` (JSONField), `workspace` FK. Active cycle: `start_date <= now <= end_date`.
- StaffProfile (post-migration): instance-level, `department` FK, `employment_status` choices, `date_of_joining`, `date_of_leaving`, `is_department_manager`.
- Permission model for staff analytics: managers see full details, regular staff see basic counts only (no individual staff data).

## Requirements

### Functional

1. Activity feed: latest cross-workspace issue activities with workspace context
2. Staff analytics: headcount by department, new/departed staff (30 days)
3. Cycle metrics: active cycles with progress, avg velocity, completed cycles count

### Non-Functional

1. Activity feed supports `?limit=` param (default 20, max 50)
2. Staff analytics scoped to managed departments (not all instance depts)
3. All endpoints use scope resolution from Phase 1

## Architecture

```
HeadOfficeActivityEndpoint(HeadOfficeBaseView)
  GET /head-office/activity/?limit=20

HeadOfficeStaffAnalyticsEndpoint(HeadOfficeBaseView)
  GET /head-office/staff-analytics/

HeadOfficeCyclesEndpoint(HeadOfficeBaseView)
  GET /head-office/cycles/
```

## Related Code Files

### Files to Modify

<!-- Updated: Validation Session 2 - domain split file name, add caching -->

- `apps/api/plane/app/views/workspace/head_office_core.py` -- Add 3 new endpoint classes + Django cache (5-min TTL)
- `apps/api/plane/app/urls/head_office.py` -- Register 3 new URL patterns

### Reference Files (read-only)

- `apps/api/plane/db/models/issue.py` -- IssueActivity fields
- `apps/api/plane/db/models/cycle.py` -- Cycle fields, progress_snapshot
- `apps/api/plane/app/views/issue/activity.py` -- Existing activity query pattern

## Implementation Steps

### Step 1: Activity Feed Endpoint (1.5h)

1. Add `HeadOfficeActivityEndpoint(HeadOfficeBaseView)` to `head_office.py`
2. `GET` method:
   - Get `limit` from query params, clamp to `max(1, min(int(limit), 50))`, default 20
   - Call `self.get_managed_workspace_ids()`
   - Query:
     ```python
     activities = IssueActivity.objects.filter(
         workspace_id__in=ws_ids,
         deleted_at__isnull=True,
     ).select_related(
         'actor', 'issue', 'workspace'
     ).order_by('-created_at')[:limit]
     ```
   - Serialize each activity:
     ```python
     {
         "id": str(activity.id),
         "workspace": {
             "id": str(activity.workspace_id),
             "name": activity.workspace.name,
             "slug": activity.workspace.slug,
         },
         "issue": {
             "id": str(activity.issue_id),
             "name": activity.issue.name if activity.issue else None,
         },
         "event": activity.verb,
         "field": activity.field,
         "old_value": activity.old_value,
         "new_value": activity.new_value,
         "summary": _build_activity_summary(activity),
         "actor": {
             "id": str(activity.actor_id),
             "display_name": activity.actor.display_name if activity.actor else None,
         },
         "timestamp": activity.created_at.isoformat(),
     }
     ```
3. Helper `_build_activity_summary(activity)`: human-readable string like "changed status from Todo to In Progress"

### Step 2: Staff Analytics Endpoint (1.5h)

1. Add `HeadOfficeStaffAnalyticsEndpoint(HeadOfficeBaseView)` to `head_office.py`
2. `GET` method:
   - Call `self.get_managed_workspace_ids()`
   - Get managed department IDs: departments whose `linked_workspace_id` is in `ws_ids`
   - Also include descendant depts without linked_workspace (they still have staff)
   - Use scope resolution dept_ids from the utility (extend utility or reuse)
   - Query `by_department`:
     ```python
     dept_stats = Department.objects.filter(
         id__in=dept_ids,
         deleted_at__isnull=True,
     ).annotate(
         staff_count=Count(
             'staff_members',
             filter=Q(
                 staff_members__deleted_at__isnull=True,
                 staff_members__employment_status='active'
             )
         ),
         new_30d=Count(
             'staff_members',
             filter=Q(
                 staff_members__date_of_joining__gte=thirty_days_ago,
                 staff_members__deleted_at__isnull=True,
             )
         ),
         departed_30d=Count(
             'staff_members',
             filter=Q(
                 staff_members__employment_status__in=['resigned', 'transferred'],
                 staff_members__date_of_leaving__gte=thirty_days_ago,
                 staff_members__deleted_at__isnull=True,
             )
         ),
     ).values('id', 'name', 'code', 'staff_count', 'new_30d', 'departed_30d')
     ```
   - Aggregate totals:
     ```python
     total_active = sum(d['staff_count'] for d in dept_stats)
     new_this_month = sum(d['new_30d'] for d in dept_stats)
     departed_this_month = sum(d['departed_30d'] for d in dept_stats)
     ```
   - Permission check: if user is NOT manager and NOT instance admin, return only totals (no `by_department` breakdown)
3. Response:
   ```json
   {
       "by_department": [{"dept_id", "dept_name", "dept_code", "count", "new_30d", "departed_30d"}],
       "total_active": int,
       "new_this_month": int,
       "departed_this_month": int
   }
   ```

### Step 3: Cycles Endpoint (0.5h)

1. Add `HeadOfficeCyclesEndpoint(HeadOfficeBaseView)` to `head_office.py`
2. `GET` method:
   - Call `self.get_managed_workspace_ids()`
   - Active cycles:
     ```python
     now = timezone.now()
     active_cycles = Cycle.objects.filter(
         workspace_id__in=ws_ids,
         start_date__lte=now,
         end_date__gte=now,
         deleted_at__isnull=True,
         archived_at__isnull=True,
     ).select_related('workspace').order_by('end_date')
     ```
   - For each cycle, extract progress from `progress_snapshot` (JSONField):
     - `total_issues`, `completed_issues`, `cancelled_issues`
     - Calculate `progress = completed / total * 100` if total > 0
   - Completed cycles in last 30 days:
     ```python
     completed_count = Cycle.objects.filter(
         workspace_id__in=ws_ids,
         end_date__lt=now,
         end_date__gte=thirty_days_ago,
         deleted_at__isnull=True,
     ).count()
     ```
3. Response:
   ```json
   {
       "active_cycles": [{
           "id": "uuid",
           "workspace": {"id", "name", "slug"},
           "name": "Sprint 5",
           "start_date": "iso",
           "end_date": "iso",
           "progress": 65.0,
           "total_issues": 20,
           "completed_issues": 13
       }],
       "completed_cycles_30d": int,
       "total_active": int
   }
   ```

### Step 4: Register URLs (0.5h)

1. Add to `apps/api/plane/app/urls/head_office.py`:
   ```python
   path("workspaces/<str:slug>/head-office/activity/",
        HeadOfficeActivityEndpoint.as_view(), name="head-office-activity"),
   path("workspaces/<str:slug>/head-office/staff-analytics/",
        HeadOfficeStaffAnalyticsEndpoint.as_view(), name="head-office-staff-analytics"),
   path("workspaces/<str:slug>/head-office/cycles/",
        HeadOfficeCyclesEndpoint.as_view(), name="head-office-cycles"),
   ```

## Todo List

- [ ] Implement HeadOfficeActivityEndpoint with limit param
- [ ] Implement `_build_activity_summary()` helper
- [ ] Implement HeadOfficeStaffAnalyticsEndpoint with dept breakdown
- [ ] Add permission check: non-managers see totals only (no by_department)
- [ ] Implement HeadOfficeCyclesEndpoint with progress extraction
- [ ] Register 3 new URL patterns
- [ ] Test activity feed returns cross-workspace events ordered by time
- [ ] Test staff analytics returns correct counts per department
- [ ] Test cycles endpoint returns active cycles with progress

## Success Criteria

- Activity feed returns latest activities across managed workspaces with workspace context
- Staff analytics shows department-level headcount breakdown for managers
- Regular staff see only aggregate totals in staff analytics (no dept breakdown)
- Cycles endpoint shows active cycles with progress percentage from snapshot
- All endpoints respect scope resolution (no data leakage across scopes)

## Risk Assessment

| Risk                                  | Probability | Impact | Mitigation                                             |
| ------------------------------------- | ----------- | ------ | ------------------------------------------------------ |
| IssueActivity large table, slow query | Medium      | Medium | Limit param, index on workspace_id + created_at        |
| progress_snapshot empty/malformed     | Medium      | Low    | Default to 0 if missing keys                           |
| Staff without department              | Low         | Low    | Filter `department__isnull=False` or handle gracefully |

## Security Considerations

- Staff analytics: non-managers cannot see per-department breakdown (only totals)
- Activity feed: only activities from managed workspaces (scope resolution enforced)
- No PII in activity feed responses (only display_name, not email)

## Next Steps

- Phase 3 consumes summary + workspaces endpoints
- Phase 4 consumes activity + cycles endpoints
- Phase 5 consumes staff analytics endpoint
