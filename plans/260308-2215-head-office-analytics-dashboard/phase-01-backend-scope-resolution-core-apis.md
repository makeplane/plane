# Phase 1: Backend Scope Resolution & Core APIs

## Context Links

- [Parent Plan](./plan.md)
- [Dependency: Dept-Workspace Migration](../260307-1053-dept-workspace-migration/plan.md)
- Post-migration models: `apps/api/plane/db/models/department.py`, `apps/api/plane/db/models/staff.py`
- Existing analytics pattern: `apps/api/plane/app/views/analytic/advance.py`
- Permission: `apps/api/plane/utils/permissions/workspace.py` (WorkspaceEntityPermission)
- URL registration: `apps/api/plane/app/urls/__init__.py`

## Overview

- **Priority:** P1
- **Status:** pending
- **Effort:** 6h
- **Description:** Create scope resolution utility and two core API endpoints (summary KPIs, workspace health table). This phase establishes the foundational backend pattern all other head-office endpoints will follow.

## Key Insights

- Post-migration: Department has no workspace FK, uses `linked_workspace` OneToOneField(nullable). StaffProfile is instance-level with `is_department_manager` boolean.
- Department tree: parent-child self-ref, max 6 levels. Recursive descendant collection needed.
- IssueActivity is a ProjectBaseModel (has workspace FK via project). Queryable cross-workspace via `workspace_id__in`.
- Existing BaseAPIView pattern: inherits TimezoneMixin + ReadReplicaControlMixin + APIView + BasePaginator.
- WorkspaceEntityPermission: any workspace member (safe methods). URL param is `slug` (not `workspace_slug`).

## Requirements

### Functional

1. Scope resolution: given a user, return list of workspace IDs they can manage
2. Summary endpoint: aggregated counts (workspaces, staff, projects, issues, overdue, completion rate, active cycles)
3. Workspace health endpoint: per-workspace stats with health status classification

### Non-Functional

1. Scope resolution must handle up to 6 levels of dept hierarchy efficiently
2. Cross-workspace queries should use `select_related`/`prefetch_related` to minimize N+1
3. All endpoints return JSON, no HTML rendering

## Architecture

```
HeadOfficeBaseView(BaseAPIView)
  permission_classes = [WorkspaceEntityPermission]

  def get_managed_workspace_ids(self, request):
      # 1. Find user's StaffProfile (instance-level, post-migration)
      # 2. If is_department_manager: collect descendant dept IDs recursively
      # 3. Get linked_workspace IDs from those depts
      # 4. Instance admin override: return ALL workspace IDs
      # 5. Regular staff: return just own workspace ID

HeadOfficeSummaryEndpoint(HeadOfficeBaseView)
  GET -> aggregate counts across managed workspaces

HeadOfficeWorkspacesEndpoint(HeadOfficeBaseView)
  GET -> per-workspace health stats
```

### Scope Resolution Algorithm

```python
def get_managed_workspace_ids(user, current_workspace_id):
    # Instance admin shortcut
    if user.is_superuser or InstanceAdmin.objects.filter(user=user).exists():
        return Workspace.objects.values_list('id', flat=True)

    # Find staff profile (post-migration: no workspace FK)
    staff = StaffProfile.objects.filter(
        user=user, deleted_at__isnull=True
    ).select_related('department').first()

    if not staff or not staff.department:
        # No staff profile or no dept: no head-office access
        return []  # caller should return 403

    # Regular staff (not manager, not instance admin) = no access
    if not staff.is_department_manager:
        return []  # caller should return 403
    <!-- Updated: Validation Session 1 - manager/admin only, regular staff get 403 -->
    <!-- Updated: Validation Session 2 - removed dead else branch, added current_workspace_id param, added caching -->

    dept = staff.department

    # Manager: collect all descendant department IDs (iterative BFS, max 6 levels)
    dept_ids = {dept.id}
    current_level = {dept.id}
    for _ in range(6):  # max 6 levels
        children = set(Department.objects.filter(
            parent_id__in=current_level,
            deleted_at__isnull=True
        ).values_list('id', flat=True))
        if not children:
            break
        dept_ids |= children
        current_level = children

    # Get linked workspaces
    ws_ids = list(Workspace.objects.filter(
        linked_department__id__in=dept_ids,
        linked_department__isnull=False
    ).values_list('id', flat=True))

    # Fallback: always include current workspace
    if current_workspace_id not in ws_ids:
        ws_ids.append(current_workspace_id)

    return ws_ids
```

### Health Status Classification

```python
def get_health_status(completion_rate):
    if completion_rate >= 80: return "good"        # green
    if completion_rate >= 60: return "fair"         # yellow
    if completion_rate >= 40: return "at_risk"      # orange
    return "critical"                               # red
```

## Related Code Files

### Files to Create

<!-- Updated: Validation Session 2 - renamed to head_office_core.py (domain split), added access-check endpoint -->

- `apps/api/plane/app/views/workspace/head_office_core.py` -- HeadOfficeBaseView, SummaryEndpoint, WorkspacesEndpoint, AccessCheckEndpoint
- `apps/api/plane/app/urls/head_office.py` -- URL patterns for head-office endpoints
- `apps/api/plane/utils/head_office_scope.py` -- Scope resolution utility function (with Django cache, 5-min TTL)

### Files to Modify

- `apps/api/plane/app/urls/__init__.py` -- Register head_office_urls
- `apps/api/plane/app/views/workspace/__init__.py` -- Export new views (if needed)

## Implementation Steps

### Step 1: Create scope resolution utility (1.5h)

1. Create `apps/api/plane/utils/head_office_scope.py`
2. Implement `get_managed_workspace_ids(user, current_workspace_id)`:
   - Check instance admin (InstanceAdmin model or `is_superuser`)
   - Find StaffProfile (post-migration: `StaffProfile.objects.filter(user=user, deleted_at__isnull=True)`)
   - If `is_department_manager`: iterative BFS to collect descendant dept IDs (max 6 iterations)
   - Query `Workspace.objects.filter(linked_department__id__in=dept_ids)` for linked workspaces
   - Regular staff: only own dept's `linked_workspace`
   - Always include current workspace as fallback
3. Return `list[UUID]`

### Step 2: Create HeadOfficeBaseView (1h)

1. Create `apps/api/plane/app/views/workspace/head_office.py`
2. `HeadOfficeBaseView(BaseAPIView)`:
   - `permission_classes = [WorkspaceEntityPermission]`
   - Property `workspace_slug` from `self.kwargs["slug"]`
   - Method `get_managed_workspace_ids()` that calls the utility with `request.user` and current workspace ID
   - Resolve current workspace from slug: `Workspace.objects.get(slug=self.kwargs["slug"])`

### Step 3: Implement Summary Endpoint (1.5h)

1. `HeadOfficeSummaryEndpoint(HeadOfficeBaseView)`:
2. `GET` method:
   - Call `self.get_managed_workspace_ids()`
   - Count managed workspaces: `len(ws_ids)`
   - Count staff: `StaffProfile.objects.filter(department__linked_workspace_id__in=ws_ids, deleted_at__isnull=True, employment_status='active').count()`
   - Count projects: `Project.objects.filter(workspace_id__in=ws_ids, archived_at__isnull=True).count()`
   - Count open issues: `Issue.objects.filter(workspace_id__in=ws_ids, state__group__in=['backlog','unstarted','started']).count()`
   - Count overdue issues: `Issue.objects.filter(workspace_id__in=ws_ids, target_date__lt=now(), state__group__in=['backlog','unstarted','started']).count()`
   - Avg completion rate: per workspace, `closed_issues / total_issues * 100` within last 30 days, then average
   <!-- Updated: Validation Session 1 - 30-day window for completion rate -->
   - Active cycles: `Cycle.objects.filter(workspace_id__in=ws_ids, start_date__lte=now(), end_date__gte=now()).count()`
3. Return JSON response

### Step 4: Implement Workspaces Endpoint (1.5h)

1. `HeadOfficeWorkspacesEndpoint(HeadOfficeBaseView)`:
2. `GET` method:
   - Call `self.get_managed_workspace_ids()`
   - Query workspaces with annotations:
     - `projects_count` (Count of projects)
     - `open_issues` (Count of issues with open state groups)
     - `closed_issues_30d` (Count of issues closed in last 30 days)
     - `active_members` (Count of active WorkspaceMembers)
   - Calculate `completion_rate` per workspace
   - Include department info from `linked_department` reverse relation
   - Include current cycle: `Cycle.objects.filter(workspace=ws, start_date__lte=now(), end_date__gte=now()).first()`
   - Apply `get_health_status(completion_rate)` classification
3. Return JSON array

### Step 5: Register URLs (0.5h)

1. Create `apps/api/plane/app/urls/head_office.py`:
   ```python
   urlpatterns = [
       path("workspaces/<str:slug>/head-office/summary/",
            HeadOfficeSummaryEndpoint.as_view(), name="head-office-summary"),
       path("workspaces/<str:slug>/head-office/workspaces/",
            HeadOfficeWorkspacesEndpoint.as_view(), name="head-office-workspaces"),
   ]
   ```
2. Add to `apps/api/plane/app/urls/__init__.py`:
   - Import `head_office_urls`
   - Add `*head_office_urls` to urlpatterns

## Todo List

- [ ] Create `apps/api/plane/utils/head_office_scope.py` with `get_managed_workspace_ids()`
- [ ] Create `apps/api/plane/app/views/workspace/head_office.py` with HeadOfficeBaseView
- [ ] Implement HeadOfficeSummaryEndpoint GET
- [ ] Implement HeadOfficeWorkspacesEndpoint GET
- [ ] Create `apps/api/plane/app/urls/head_office.py`
- [ ] Register URLs in `apps/api/plane/app/urls/__init__.py`
- [ ] Test scope resolution: instance admin, manager, regular staff, no staff profile
- [ ] Test summary endpoint returns correct aggregated counts
- [ ] Test workspaces endpoint returns per-workspace health with correct classification
- [ ] Implement AccessCheckEndpoint (GET /head-office/access-check/) returning {has_access: bool}
- [ ] Add Django cache (5-min TTL) to scope resolution and summary/workspaces endpoints
<!-- Updated: Validation Session 2 - access-check endpoint + caching -->

## Success Criteria

- Scope resolution correctly identifies managed workspaces for all 3 roles
- Summary endpoint returns aggregated KPIs for managed workspaces
- Workspaces endpoint returns per-workspace health with status classification
- No N+1 queries (verify with Django debug toolbar or `assertNumQueries`)
- Graceful handling when user has no StaffProfile (fallback to current workspace)

## Risk Assessment

| Risk                               | Probability | Impact | Mitigation                                     |
| ---------------------------------- | ----------- | ------ | ---------------------------------------------- |
| Recursive dept query slow          | Low         | Medium | Iterative BFS, max 6 levels, indexed parent_id |
| Cross-workspace count queries slow | Medium      | Medium | Use Count annotations, avoid N+1               |
| No StaffProfile for user           | Medium      | Low    | Graceful fallback: show current workspace only |
| Post-migration model mismatch      | Low         | High   | Verify against migration plan Phase 1 output   |

## Security Considerations

- WorkspaceEntityPermission gates access: user must be member of the workspace in URL
- Head Office restricted to managers + instance admins. Regular staff get 403.
<!-- Updated: Validation Session 1 - manager/admin only access -->
- Scope resolution never returns workspaces user shouldn't see (only descendant depts)
- Instance admin check uses InstanceAdmin model, not just `is_superuser`
- No write endpoints in this phase (GET only)

## Next Steps

- Phase 2 adds activity feed, staff analytics, and cycles endpoints using same HeadOfficeBaseView
- Phase 3 consumes these APIs from frontend
