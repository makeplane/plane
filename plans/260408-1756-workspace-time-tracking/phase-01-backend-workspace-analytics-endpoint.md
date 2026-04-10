# Phase 01 — Backend: Workspace Analytics Timesheet Endpoint

## Context Links

- Existing project analytics: `apps/api/plane/app/views/workspace/time_tracking/analytics_timesheet.py`
- URL patterns: `apps/api/plane/app/urls/workspace.py`
- Init exports: `apps/api/plane/app/views/workspace/time_tracking/__init__.py`

## Overview

- **Priority**: P1 (blocks Phase 2+)
- **Status**: Pending
- **Description**: Clone `ProjectAnalyticsTimesheetEndpoint` into `WorkspaceAnalyticsTimesheetEndpoint` removing `project_id` filter so it scopes to ALL projects in workspace.

## Key Insights

- `ProjectAnalyticsTimesheetEndpoint` filters by `project_id=project_id` — workspace version removes this filter
- Response shape identical, but each row already includes `project_id` and `issue_identifier` (has project prefix)
- No new model needed — queries `IssueWorkLog` with `workspace__slug=slug` only

## Requirements

### Functional

- GET `/api/workspaces/<slug>/time-tracking/analytics/timesheet/?week_start=YYYY-MM-DD`
- Returns all issues across all projects with per-day, per-user breakdown
- Same response shape as project analytics (rows, daily_totals, grand_total_minutes)
- Pagination: `limit` (default 100, max 1000), `offset`

### Non-Functional

- Permission: ADMIN sees all, MEMBER sees only their ProjectMember projects
- Performance: `select_related` on issue\_\_project, logged_by
- Validation: `week_start` must be ISO date, bounded (workspace creation date → today+7d)

## Architecture

```
GET /api/workspaces/<slug>/time-tracking/analytics/timesheet/?week_start=&limit=&offset=
  -> WorkspaceAnalyticsTimesheetEndpoint.get()
  -> IssueWorkLog.objects.filter(
       workspace__slug=slug,
       project__in=user_project_ids,  # MEMBER filtered to their ProjectMember projects
       logged_at__range=[...]
     )
  -> Paginated aggregation (limit/offset)
  -> Same shape as project analytics
```

<!-- Updated: Validation Session 1 -->
<!-- Changes: Added pagination, MEMBER filtering to ProjectMember projects, week_start validation -->
<!-- RT-7 resolved: Also create WorkspaceCapacityEndpoint -->
<!-- RT-2 resolved: Added pagination -->
<!-- RT-3 resolved: Added MEMBER filtering -->
<!-- RT-5 resolved: Added week_start validation -->

## Related Code Files

### Modify

- `apps/api/plane/app/views/workspace/time_tracking/__init__.py` — add export
- `apps/api/plane/app/urls/workspace.py` — add URL patterns

### Create

- `apps/api/plane/app/views/workspace/time_tracking/workspace_analytics_timesheet.py`
- `apps/api/plane/app/views/workspace/time_tracking/workspace_capacity.py`

## Implementation Steps

1. Create `workspace_analytics_timesheet.py`:
   - Copy `ProjectAnalyticsTimesheetEndpoint` as `WorkspaceAnalyticsTimesheetEndpoint`
   - Remove `project_id` parameter from `get(self, request, slug)` signature
   - Remove `project_id=project_id` from ORM filter
   - Add MEMBER filtering: `project__in=request.user.project_member_project_ids`
   - Add pagination: `limit` default 100, max 1000, `offset`
   - Add `week_start` validation: ISO format + bounds check
   - Keep everything else identical (aggregation, response shape)

2. Create `workspace_capacity.py`:
   - Similar pattern: clone project capacity endpoint, remove project_id filter
   - Add MEMBER filtering and pagination
   - Returns capacity data across all workspace projects

3. Update `__init__.py`:

   ```python
   from .workspace_analytics_timesheet import WorkspaceAnalyticsTimesheetEndpoint
   from .workspace_capacity import WorkspaceCapacityEndpoint
   ```

   Add both to `__all__` list.

4. Add URL patterns in `workspace.py` (near line 306, with other time-tracking URLs):
   ```python
   path(
       "workspaces/<str:slug>/time-tracking/analytics/timesheet/",
       WorkspaceAnalyticsTimesheetEndpoint.as_view(),
       name="workspace-analytics-timesheet",
   ),
   path(
       "workspaces/<str:slug>/time-tracking/analytics/capacity/",
       WorkspaceCapacityEndpoint.as_view(),
       name="workspace-capacity",
   ),
   ```

## Todo List

- [ ] Create `workspace_analytics_timesheet.py` with `WorkspaceAnalyticsTimesheetEndpoint`
- [ ] Add MEMBER filtering to user's ProjectMember projects
- [ ] Add pagination (limit/offset)
- [ ] Add `week_start` validation
- [ ] Create `workspace_capacity.py` with `WorkspaceCapacityEndpoint`
- [ ] Add export to `__init__.py`
- [ ] Add URL patterns to `workspace.py`
- [ ] Test: `GET /api/workspaces/{slug}/time-tracking/analytics/timesheet/` returns 200
- [ ] Test: `GET /api/workspaces/{slug}/time-tracking/analytics/capacity/` returns 200

## Success Criteria

- Endpoint returns same shape as project analytics but across all projects
- Permission gated to ADMIN (all projects) + MEMBER (filtered to their ProjectMember projects)
- Pagination prevents unbounded data exposure (limit/offset)
- No N+1 queries (select_related used)
- `week_start` validated against workspace creation date and today+7d

## Risk Assessment

- **Low risk**: Simple clone of existing endpoint with one filter removed
- If endpoint is slow for large workspaces, add pagination later (YAGNI for now)

---

## Red Team Findings — Phase 01

### Finding RT-1 (Critical): Route path duplication in `extended.ts`

- **Severity:** Critical
- **Location:** Phase 05, section "Routes (`extended.ts`)"
- **Flaw:** `route(":workspaceSlug/time-tracking", ...)` nested inside a layout that already provides `workspaceSlug` as a parent param causes a doubled slug URL pattern `/:ws/:ws/time-tracking`.
- **Fix:** Use `route("time-tracking", ...)` not `route(":workspaceSlug/time-tracking", ...)`.
- **Status:** Fix in Phase 05.

### Finding RT-2 (Critical): No pagination — unbounded data exposure

- **Severity:** Critical
- **Location:** Phase 01, section "Requirements" and "Architecture"
- **Flaw:** Endpoint returns ALL issues across ALL projects with no `limit`/`offset` or cursor. Large workspaces return 100k+ rows → OOM, API timeout, DB pool exhaustion.
- **Fix:** Add pagination — `limit=100` default, `max_limit=1000`, use offset or cursor. Validate `week_start` bounds.
- **Status:** Add to Phase 01 implementation steps.

### Finding RT-3 (Critical): MEMBER horizontal privilege escalation

- **Severity:** Critical
- **Location:** Phase 01, section "Non-Functional / Permission"
- **Flaw:** Workspace MEMBER can see ALL project time logs including projects they don't belong to. Project-level isolation is bypassed.
- **Fix:** Filter ORM results to only include projects where the user is a `ProjectMember`. Or restrict endpoint to ADMIN only. Explicitly document which.
- **Status:** Add to Phase 01 implementation steps.

### Finding RT-4 (High): Permission class not explicitly specified

- **Severity:** High
- **Location:** Phase 01, section "Non-Functional / Permission"
- **Flaw:** "ADMIN + MEMBER (same as project analytics)" is copied without verifying the permission class checks `WorkspaceMember` not `ProjectMember`.
- **Fix:** Explicitly name the decorator to use (e.g., `workspace_member_required`) and verify it checks workspace role.
- **Status:** Add to Phase 01 implementation steps.

### Finding RT-5 (High): `week_start` validation missing — DoS vector

- **Severity:** High
- **Location:** Phase 01, section "Architecture"
- **Flaw:** No bounds check on `week_start`. Extreme values (e.g., `0001-01-01`) could scan entire database history.
- **Fix:** Validate ISO date format, apply min (workspace creation date) and max (today + 7 days) bounds.
- **Status:** Add to Phase 01 implementation steps.

### Finding RT-6 (High): Rate limiting absent

- **Severity:** High
- **Location:** Phase 01 throughout
- **Flaw:** Expensive cross-workspace aggregation with no rate limit — authenticated MEMBER can hammer the endpoint.
- **Fix:** Document existing per-user rate limit on this endpoint class. If none exists, note it as a follow-up security hardening.
- **Status:** Add risk note to Phase 01.

### Finding RT-7 (High): Missing workspace capacity endpoint

- **Severity:** High
- **Location:** Phase 01 scope / Phase 02, "Key Insights"
- **Flaw:** Phase 01 only creates analytics timesheet endpoint. But Tab 3 (Capacity) calls `fetchCrossWorkspaceCapacity` which does not exist in the plan. Capacity tab will 404.
- **Fix:** Either (a) expand Phase 01 to include `WorkspaceCapacityEndpoint`, or (b) verify `fetchCrossWorkspaceCapacity` hits an existing endpoint and document which.
- **Status:** Needs resolution before Phase 02.
