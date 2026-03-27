# Phase 2: Backend — Cross-Workspace Issues API

## Context Links

- [Plan Overview](./plan.md)
- Department model: `apps/api/plane/db/models/` (department + linked workspace)
- Issue model: `apps/api/plane/db/models/issue.py`
- Global views: `apps/api/plane/app/views/issue/` (reference for filter patterns)
- Worklog model: `apps/api/plane/db/models/worklog.py` (reference for total_log_time aggregation)
- URL config reference: `apps/api/plane/app/urls/`

## Overview

- **Priority**: P1
- **Status**: pending
- **Effort**: 1d
- **Description**: Add two new backend endpoints: (1) `GET /api/ho/issues/` — paginated, filtered, sorted list of issues across all workspaces accessible to the user; (2) `GET /api/ho/category-summary/` — aggregated count of work items per Department × Team/Project × Category combination.

## Key Insights

- **Access control**: Instance admins see all workspaces; department managers see only workspaces linked to their managed departments. Reuse `DepartmentTree` + `StaffProfile.department` logic already used in `HoDepartmentList`.
- **Department name**: In the HO context, "Department" maps to the workspace linked to the department (i.e., `department.linked_workspace.name`). The existing `SpreadsheetDepartmentNameColumn` displays `currentWorkspace.name` — for cross-workspace we need the department name per issue's workspace.
- **total_log_time**: Aggregate from `IssueWorkLog.duration_minutes` (sum per issue). See `IssueWorkLog` model in `worklog.py`.
- **main_task_category / sub_task_category**: Already on `Issue` model via FK (`main_task_category_id`, `sub_task_category_id`) with `_name` annotations from serializer.
- **Pagination**: Use DRF `PageNumberPagination`. Default page size 100. <!-- Updated: Validation Session 3 - Use PageNumberPagination (?page=1&page_size=100), not cursor-based -->
- **Ordering**: Default `workspace__name, project__name, main_task_category__name, sub_task_category__name, created_at`. Support `?order_by=` param for sort column override.
- **Category summary**: Uses Django `values()` + `Count()` aggregation — no pagination needed (bounded by department × project × category combinations).

## Requirements

### Functional

**Endpoint 1 — Issue List:**

- `GET /api/ho/issues/`
- Query params: `page`, `page_size` (default 100), `order_by`, `display_properties` (comma-separated to limit fields), `from_date` (YYYY-MM-DD), `to_date` (YYYY-MM-DD)
- **Date filter logic**: `start_date <= to_date AND due_date >= from_date` (overlap — issues active during the selected range). Both params optional; if omitted, no date filter applied.
- Returns: paginated list of issues with fields: `id`, `project_id`, `workspace_slug`, `department_name`, `project_name`, `name` (title), `main_task_category_name`, `sub_task_category_name`, `sub_issues_count`, `project_lead` (display name), `assignees`, `is_bank_wide_project`, `priority`, `state_name`, `state_color`, `target_date`, `start_date`, `completed_at`, `cycle_id`, `cycle_name`, `module_ids`, `module_names`, `total_log_time` (minutes), `reference_links`, `progress_tracking` (computed)
- Access: Instance admin → all workspaces; Department manager → managed department workspaces only
- Unauthorized (neither admin nor manager): return 403

<!-- Updated: Validation Session 2 - Add from_date/to_date filter with overlap condition (start_date <= to_date AND due_date >= from_date) to both endpoints -->

**Endpoint 2 — Category Summary:**

- `GET /api/ho/category-summary/`
- Query params: `from_date` (YYYY-MM-DD), `to_date` (YYYY-MM-DD)
- **Date filter logic**: same overlap condition — count only issues where `start_date <= to_date AND due_date >= from_date`. Both params optional.
- Returns: list of `{ department_name, workspace_slug, project_id, project_name, main_task_category_name, sub_task_category_name, work_item_count }`
- Same access control as above
- Ordered: `department_name, project_name, main_task_category_name, sub_task_category_name`

### Non-functional

- Response time < 2s for typical datasets (< 10k issues)
- Add DB indexes if needed for the cross-workspace query
- Both endpoints are read-only (GET only)

## Architecture

```
apps/api/plane/app/views/ho.py          (new)
apps/api/plane/app/serializers/ho.py    (new)
apps/api/plane/app/urls/ho.py           (new)
apps/api/plane/app/urls/__init__.py     (modify — include ho urls)
```

<!-- Updated: Validation Session 1 - Use existing DRF permission class; verify correct class before implementing -->

### Access Control Helper

```python
def get_accessible_workspace_ids(request):
    """Returns list of workspace IDs the user can see in HO context.

    NOTE: Use existing DRF permission class for instance admin check — do NOT
    use raw `user.role >= 15`. Grep for `InstanceAdminPermission` or similar
    in apps/api/plane/app/permissions/ to find the correct class/helper.
    """
    user = request.user
    # Check instance admin — use existing permission helper, not raw role check
    if is_instance_admin(user):  # Replace with actual helper from codebase
        return list(Workspace.objects.values_list("id", flat=True))
    # Check department manager
    staff = StaffProfile.objects.filter(user=user, is_department_manager=True).first()
    if not staff or not staff.department_id:
        return []
    # Get all descendant departments (recursive) and their linked workspaces
    dept_ids = get_all_descendant_dept_ids(staff.department_id)
    return list(
        Department.objects.filter(id__in=dept_ids, linked_workspace__isnull=False)
        .values_list("linked_workspace_id", flat=True)
    )
```

### Issue List Query

```python
issues = (
    Issue.objects
    .filter(workspace_id__in=accessible_workspace_ids, is_draft=False, archived_at__isnull=True, deleted_at__isnull=True)
    .select_related("project", "project__workspace", "state", "main_task_category", "sub_task_category")
    .prefetch_related("assignees", "issue_module__module", "issue_cycle__cycle", "issue_worklogs")
    .annotate(
        department_name=Subquery(...),   # department linked to issue's workspace
        total_log_time=Coalesce(Sum("issue_worklogs__duration_minutes"), 0),
        sub_issues_count=Count("sub_issues", distinct=True),
    )
    .order_by(order_by_fields)
)
```

### Category Summary Query

```python
summary = (
    Issue.objects
    .filter(workspace_id__in=accessible_workspace_ids, is_draft=False, archived_at__isnull=True, deleted_at__isnull=True)
    .values(
        "project__workspace__name",  # department_name (workspace = dept)
        "project__workspace__slug",
        "project_id",
        "project__name",
        "main_task_category__name",
        "sub_task_category__name",
    )
    .annotate(work_item_count=Count("id"))
    .order_by(
        "project__workspace__name",
        "project__name",
        "main_task_category__name",
        "sub_task_category__name",
    )
)
```

### URL Registration

```python
# apps/api/plane/app/urls/ho.py
urlpatterns = [
    path("", HoIssueListView.as_view(), name="ho-issues"),
    path("category-summary/", HoCategorySummaryView.as_view(), name="ho-category-summary"),
]

# In root urls.py or app urls __init__:
path("api/ho/issues/", include("plane.app.urls.ho")),
```

## Related Code Files

- **Create**: `apps/api/plane/app/views/ho.py`
- **Create**: `apps/api/plane/app/serializers/ho.py`
- **Create**: `apps/api/plane/app/urls/ho.py`
- **Modify**: `apps/api/plane/app/urls/__init__.py` (add ho url include)
- **Reference**: `apps/api/plane/db/models/issue.py`, `worklog.py`, `department.py`

## Embedded Rules

```
- Django views: scope ORM by explicit workspace list (never un-scoped)
- Permissions: check instance admin (use existing DRF permission class/helper, NOT raw role >= 15) OR department manager — return 403 if neither
- progress_tracking: existing model field on Issue — include in serializer as-is, no computation
- Soft-delete: filter deleted_at__isnull=True on all queries
- DRF views: APIView or GenericAPIView, authentication_classes = [JWTAuthentication]
- Serializers: read-only fields only (no write operations)
- No new migrations needed (no new models)
- File <200 lines — split views.py and serializers.py if needed
```

## Implementation Steps

1. **Create `apps/api/plane/app/views/ho.py`**:
   - `HoIssueListView(APIView)` — GET only
   - `HoCategorySummaryView(APIView)` — GET only
   - Both call `get_accessible_workspace_ids(request)` first; return 403 if empty
   - Apply pagination in HoIssueListView (use `PageNumberPagination`, page_size=100)
   - Support `?order_by=` param for column sorting (whitelist allowed fields)

2. **Create `apps/api/plane/app/serializers/ho.py`**:
   - `HoIssueSerializer` — all required fields, read-only
   - `HoCategorySummarySerializer` — 6 fields + work_item_count

3. **Create `apps/api/plane/app/urls/ho.py`**:

   ```python
   urlpatterns = [
       path("", HoIssueListView.as_view()),
       path("category-summary/", HoCategorySummaryView.as_view()),
   ]
   ```

4. **Modify `apps/api/plane/app/urls/__init__.py`**:
   - Add `path("ho/issues/", include("plane.app.urls.ho"))`

5. **Test manually**:
   - Call with instance admin user → expect all issues
   - Call with dept manager user → expect only managed workspace issues
   - Call with regular user → expect 403
   - Verify category-summary returns correct counts

## Post-Phase Checklist

- [ ] `python manage.py check` — no errors
- [ ] Both endpoints return 200 for admin user
- [ ] Returns 403 for non-admin, non-manager user
- [ ] Dept manager sees only their managed workspace issues
- [ ] `total_log_time` correctly sums IssueWorkLog minutes
- [ ] `sub_issues_count` correct
- [ ] Category summary counts match manual count
- [ ] No N+1 queries (use select_related + prefetch_related)
- [ ] `deleted_at__isnull=True` and `archived_at__isnull=True` filters applied

## Todo List

- [ ] Create `ho.py` views
- [ ] Create `ho.py` serializers
- [ ] Create `ho.py` urls
- [ ] Register URLs in app urls init
- [ ] Manual API test with curl/Postman

## Success Criteria

- Both endpoints return correct data per access control rules
- Response includes all 19 column fields for Datasheet view
- Category summary provides correct aggregated counts

## Risk Assessment

- **Cross-workspace query performance**: Use `filter(workspace_id__in=[...])` — Postgres handles this well with proper indexes on `workspace_id`
- **Department hierarchy traversal**: Recursive CTE or Python-side traversal. Start with Python-side (simpler), optimize if slow.
- **Null categories**: Some issues may have no main_task_category — annotate as empty string/None

## Security Considerations

- Always derive workspace list from server-side access check (never trust client-provided workspace list)
- Authentication required: JWTAuthentication
- Read-only endpoints — no mutation risk

## Next Steps

- Phase 3: Frontend store + service using these endpoints
