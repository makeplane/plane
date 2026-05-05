# Phase 7: Backend Staff Search + Profile APIs

## Context Links

- [Parent Plan](./plan.md)
- [Phase 1: Scope Resolution & Core APIs](./phase-01-backend-scope-resolution-core-apis.md)
- HeadOfficeBaseView: `apps/api/plane/app/views/workspace/head_office.py`
- Head office URLs: `apps/api/plane/app/urls/head_office.py`
- StaffProfile model: `apps/api/plane/db/models/staff.py`
- IssueActivity model: `apps/api/plane/db/models/issue.py`
- Staff views pattern: `apps/api/plane/app/views/workspace/staff.py`
- BasePaginator: `apps/api/plane/utils/paginator.py`

## Overview

- **Priority:** P1
- **Status:** pending
- **Effort:** 5h
- **Description:** Add staff search (paginated, filterable across managed workspaces), staff profile (HR info + workload breakdown), and staff activity timeline endpoints. All inherit HeadOfficeBaseView and verify staff is within managed scope.

## Key Insights

- Staff list spans ALL managed workspaces — need cross-workspace StaffProfile query filtered by managed dept IDs
- Search: `Q(user__display_name__icontains=q) | Q(user__email__icontains=q) | Q(staff_id__icontains=q)`
- Workload = assigned open issues count per staff member, grouped by state group and priority
- Activity timeline = IssueActivity filtered by `actor=staff.user`, ordered by `-created_at`
- BasePaginator mixin provides `paginate()` method for queryset pagination
- Staff scope validation: staff's department must be in caller's managed dept tree

## Requirements

### Functional

1. Staff list: paginated, searchable, filterable by department/workspace/position/status/workload
2. Staff profile: full HR info + workload breakdown (by state group + priority) + projects list
3. Staff activity: recent IssueActivity records for a specific staff member
4. All endpoints validate staff is within caller's managed scope

### Non-Functional

1. Pagination with configurable page_size (default 20, max 100)
2. Search must be case-insensitive
3. Efficient cross-workspace queries with annotations

## Architecture

```
HeadOfficeStaffListEndpoint(HeadOfficeBaseView)
  GET /head-office/staff/
  ?search=&department=&workspace=&position=&status=&sort=&page=&page_size=
  -> paginated staff list with workload count

HeadOfficeStaffProfileEndpoint(HeadOfficeBaseView)
  GET /head-office/staff/<staff_id>/profile/
  -> full profile: HR + workload breakdown + projects

HeadOfficeStaffActivityEndpoint(HeadOfficeBaseView)
  GET /head-office/staff/<staff_id>/activity/?limit=20
  -> recent IssueActivity records
```

## Related Code Files

### Files to Create

- None (add to existing files)

### Files to Modify

<!-- Updated: Validation Session 2 - domain split, staff endpoints in dedicated file -->

- `apps/api/plane/app/views/workspace/head_office_staff.py` — Add 3 staff endpoints (new file, imports HeadOfficeBaseView from head_office_core.py)
- `apps/api/plane/app/urls/head_office.py` — Add staff URL patterns

## Implementation Steps

### Step 1: Add staff scope validation helper (0.5h)

1. In `HeadOfficeBaseView`, add:

   ```python
   def get_managed_department_ids(self):
       """Return set of department IDs caller can manage."""
       # Reuse scope resolution logic to get dept IDs (not just workspace IDs)
       # Instance admin: all depts
       # Manager: own dept + descendants
       ...

   def validate_staff_in_scope(self, staff_profile):
       managed_dept_ids = self.get_managed_department_ids()
       if staff_profile.department_id not in managed_dept_ids:
           return Response(
               {"error": "Staff not in managed scope"},
               status=status.HTTP_403_FORBIDDEN
           )
       return None
   ```

### Step 2: Implement Staff List endpoint (2h)

1. `HeadOfficeStaffListEndpoint(HeadOfficeBaseView)`:
2. `GET` method:
   - Get managed dept IDs
   - Base queryset:
     ```python
     staff_qs = StaffProfile.objects.filter(
         department_id__in=managed_dept_ids,
         deleted_at__isnull=True,
     ).select_related("user", "department", "department__linked_workspace")
     ```
   - Apply filters:

     ```python
     search = request.query_params.get("search")
     if search:
         staff_qs = staff_qs.filter(
             Q(user__display_name__icontains=search) |
             Q(user__email__icontains=search) |
             Q(staff_id__icontains=search)
         )

     department = request.query_params.get("department")
     if department:
         staff_qs = staff_qs.filter(department_id=department)

     workspace = request.query_params.get("workspace")
     if workspace:
         staff_qs = staff_qs.filter(department__linked_workspace_id=workspace)

     position = request.query_params.get("position")
     if position:
         staff_qs = staff_qs.filter(position__icontains=position)

     emp_status = request.query_params.get("status")
     if emp_status:
         staff_qs = staff_qs.filter(employment_status=emp_status)
     ```

   - Annotate workload:
     ```python
     staff_qs = staff_qs.annotate(
         assigned_open_issues=Count(
             "user__issue_assignee__issue",
             filter=Q(
                 user__issue_assignee__issue__state__group__in=[
                     "backlog", "unstarted", "started"
                 ],
             )
         )
     )
     ```
   - Sort: `request.query_params.get("sort", "-assigned_open_issues")`
   - Paginate using BasePaginator
   - Serialize: staff_id, display_name, email, avatar, department, workspace, position, employment_status, assigned_open_issues

### Step 3: Implement Staff Profile endpoint (1.5h)

1. `HeadOfficeStaffProfileEndpoint(HeadOfficeBaseView)`:
2. `GET` method:
   - Lookup staff by `self.kwargs["staff_id"]` (StaffProfile.id or staff_id field)
   - Validate in scope
   - HR info: staff_id, display_name, email, avatar, position, department, employment_status, date_of_joining, date_of_leaving, is_department_manager
   - Workload breakdown by state group:
     ```python
     workload_by_state = Issue.objects.filter(
         assignees=staff.user,
         workspace_id__in=managed_ws_ids,
     ).values("state__group").annotate(count=Count("id"))
     ```
   - Workload breakdown by priority:
     ```python
     workload_by_priority = Issue.objects.filter(
         assignees=staff.user,
         workspace_id__in=managed_ws_ids,
         state__group__in=["backlog", "unstarted", "started"],
     ).values("priority").annotate(count=Count("id"))
     ```
   - Projects list:
     ```python
     projects = Project.objects.filter(
         workspace_id__in=managed_ws_ids,
         project_projectmember__member=staff.user,
         archived_at__isnull=True,
     ).values("id", "name", "identifier", "workspace__slug")
     ```
   - Return combined JSON

### Step 4: Implement Staff Activity endpoint (0.5h)

1. `HeadOfficeStaffActivityEndpoint(HeadOfficeBaseView)`:
2. `GET` method:
   - Lookup staff, validate in scope
   - `limit = int(request.query_params.get("limit", 20))`
   - Query:
     ```python
     activities = IssueActivity.objects.filter(
         actor=staff.user,
         workspace_id__in=managed_ws_ids,
     ).select_related(
         "issue", "workspace"
     ).order_by("-created_at")[:limit]
     ```
   - Serialize: id, field, verb, old_value, new_value, issue (id, name), workspace (slug), created_at

### Step 5: Register URLs (0.5h)

1. Add to `apps/api/plane/app/urls/head_office.py`:
   ```python
   path("workspaces/<str:slug>/head-office/staff/",
        HeadOfficeStaffListEndpoint.as_view(), name="head-office-staff-list"),
   path("workspaces/<str:slug>/head-office/staff/<uuid:staff_id>/profile/",
        HeadOfficeStaffProfileEndpoint.as_view(), name="head-office-staff-profile"),
   path("workspaces/<str:slug>/head-office/staff/<uuid:staff_id>/activity/",
        HeadOfficeStaffActivityEndpoint.as_view(), name="head-office-staff-activity"),
   ```

## Todo List

- [ ] Add `get_managed_department_ids()` to HeadOfficeBaseView
- [ ] Add `validate_staff_in_scope()` to HeadOfficeBaseView
- [ ] Implement HeadOfficeStaffListEndpoint with search, filters, pagination
- [ ] Implement HeadOfficeStaffProfileEndpoint with workload breakdown
- [ ] Implement HeadOfficeStaffActivityEndpoint with limit param
- [ ] Register staff URL patterns
- [ ] Test: search by name, email, staff_id
- [ ] Test: filter by department, workspace, position, status
- [ ] Test: pagination with page_size
- [ ] Test: 403 when querying staff outside managed scope
- [ ] Test: profile returns workload by state group and priority

## Success Criteria

- Staff list returns paginated results with workload count
- Search works case-insensitively across name, email, staff_id
- All filters (department, workspace, position, status) apply correctly
- Staff profile returns HR info + workload breakdown + projects list
- Activity endpoint returns recent IssueActivity records
- 403 for staff outside managed scope

## Risk Assessment

| Risk                                      | Probability | Impact | Mitigation                                                      |
| ----------------------------------------- | ----------- | ------ | --------------------------------------------------------------- |
| Cross-workspace issue count slow          | Medium      | Medium | Annotate in single query, avoid N+1                             |
| Staff with no assigned issues             | Low         | Low    | Return 0 for workload, handle in serialization                  |
| staff_id ambiguity (PK vs staff_id field) | Medium      | Medium | Use StaffProfile.id (UUID PK) in URL, staff_id field for search |
| Large result set without pagination       | Low         | High   | BasePaginator enforces pagination, default page_size=20         |

## Security Considerations

- Staff data only visible to managers within managed scope
- Individual workload data is sensitive — scope validation required on every endpoint
- Activity data filtered to managed workspaces only
- No write operations (GET only)
- Email/personal info exposed only to authorized managers

## Next Steps

- Phase 10 consumes these APIs to build staff tab in frontend
- Staff profile panel will display workload bars and activity timeline
