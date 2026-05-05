# Phase 1 — Backend: Cross-Workspace Aggregate Endpoint

## Context Links

- Debug report: `plans/reports/debugger-260505-1454-your-work-profile-slow.md`
- Existing patterns: `apps/api/plane/app/views/workspace/user.py:100` (`WorkspaceUserProfileIssuesEndpoint`)
- URL conventions: `apps/api/plane/app/urls/user.py`
- Backend rules: `.claude/rules/plane-backend-architecture.md`, `.claude/rules/backend-views.md`

## Overview

- **Priority:** P1 (blocks Phase 4 — biggest perf win)
- **Status:** complete
- **Effort:** 4h
- **Brief:** Add 2 new endpoints `GET /api/users/me/work-items/today/` + `/overdue/` returning issues from ALL workspaces user is active member of, in 1 query, server-enriched with project/state/workspace info.

## Key Insights

- Frontend currently fans 100 ws × 3 calls × 2 components = 600 req. Single endpoint kills 99% of req.
- Layer choice: `plane/app/` (v0, session auth) — frontend-only consumer, NO `@extend_schema`.
- Pattern: `BaseAPIView`, `Issue.issue_objects` (auto-excludes drafts/archived/deleted), filter by `workspace__workspace_member__member=request.user, is_active=True` to scope to user's active workspaces only.
- Permission: ALSO require `project__project_projectmember__member=request.user, is_active=True` so we never leak issues from projects user can't view (mirrors `WorkspaceUserProfileIssuesEndpoint` line 159).
- Self-only: `userId` in URL is enforced = `request.user.id` (this is "your work", not "look at someone else's cross-ws"). Avoids leaking other people's work-cross-workspace.
- "Today" semantic: assignee=me, state\_\_group ∈ {backlog, unstarted, started}, (start_date IS NULL OR start_date <= today), target_date >= today OR target_date IS NULL → matches frontend filter.
- "Overdue" semantic: assignee=me, state\_\_group ∈ {backlog, unstarted, started}, target_date IS NOT NULL AND target_date < today.

## Requirements

**Functional**

- Return JSON: `[{id, name, sequence_id, project_id, state_id, start_date, target_date, main_task_category_id, sub_task_category_id, assignees, labels, _workspace: {slug, name}, _project: {name, identifier}, _state: {name, color, group}}]`
- Default cap 200, no pagination day 1 (KISS — `parent__isnull=True` + state-group filter keeps active-item count low). <!-- Updated: Validation Session 1 - pagination decision -->
- 200 OK + empty array when no issues.
- Filter by single workspace via `?workspace=<slug>` (covers `crossWorkspaces=false` toggle case → still uses same endpoint).

**Non-functional**

- Single SQL with `select_related("workspace", "project", "state")`, `prefetch_related("assignees", "labels")`.
- p95 < 300ms for user with 100 workspaces, 5000 assigned issues.
- No N+1 in serializer (verify with Django Debug Toolbar or `connection.queries`).

## Architecture

```
GET /api/users/me/work-items/today/
GET /api/users/me/work-items/overdue/
       ↓
UserWorkItemsTodayEndpoint(BaseAPIView)
UserWorkItemsOverdueEndpoint(BaseAPIView)
       ↓
Issue.issue_objects.filter(
  assignees=request.user,
  workspace__workspace_member__member=request.user,
  workspace__workspace_member__is_active=True,
  project__project_projectmember__member=request.user,
  project__project_projectmember__is_active=True,
  project__archived_at__isnull=True,
  state__group__in=["backlog","unstarted","started"],
  parent__isnull=True,            # exclude sub-tasks
  # Today extra: Q(start_date__isnull=True) | Q(start_date__lte=today)
  # Overdue extra: target_date__isnull=False, target_date__lt=today
).select_related("workspace","project","state")
 .prefetch_related("assignees","labels")
 .distinct()
       ↓
UserCrossWorkspaceWorkItemSerializer (flat, includes nested workspace/project/state info)
```

## Related Code Files

**Create**

- `apps/api/plane/app/views/user/work_items.py` — 2 endpoint classes (~120 lines)
- `apps/api/plane/app/serializers/user_work_items.py` — `UserCrossWorkspaceWorkItemSerializer` (~70 lines)

**Modify**

- `apps/api/plane/app/views/user/__init__.py` — export new classes
- `apps/api/plane/app/views/__init__.py` — re-export
- `apps/api/plane/app/serializers/__init__.py` — re-export serializer
- `apps/api/plane/app/urls/user.py` — register 2 new paths

**Read for context**

- `apps/api/plane/app/views/workspace/user.py:100–263` (existing user-issues pattern)
- `apps/api/plane/app/views/user/base.py` (existing user/me/\* endpoints)
- `apps/api/plane/app/serializers/issue.py:865–928` (issue field shape)

## Implementation Steps

1. **Run impact analysis** before edit:

   ```
   gitnexus_impact({target: "WorkspaceUserProfileIssuesEndpoint", direction: "upstream"})
   ```

   Expected: low risk (pure addition, no shared symbol modified).

2. **Create serializer** `apps/api/plane/app/serializers/user_work_items.py`:
   - Inherit `BaseSerializer`
   - Source: workspace name via `workspace.name`, slug via `workspace.slug`; project via `project.name`, `project.identifier`; state via `state.name`, `state.color`, `state.group`
   - Use `serializers.SerializerMethodField` for `_workspace`, `_project`, `_state` to keep response flat-friendly with frontend's `EnrichedIssue` shape
   - Fields: `id, name, sequence_id, project_id, state_id, start_date, target_date, main_task_category_id, sub_task_category_id, assignee_ids (List[UUID]), label_ids (List[UUID]), _workspace, _project, _state`
   - <!-- Updated: Validation Session 2 - LOCKED to ID lists only. NO embedded assignee/label objects. Frontend joins via existing MobX member/label stores to keep payload lean and match TBaseIssue/EnrichedIssue shape. -->
   - **Self-only confirmed (Session 2):** Endpoint accepts NO `?user=` param. Other-user profile pages use legacy `WorkspaceUserProfileIssuesEndpoint` via Phase 4 hook fallback. No IDOR surface added here.

3. **Create views** `apps/api/plane/app/views/user/work_items.py`:
   - `class _BaseUserWorkItemsEndpoint(BaseAPIView)` — shared queryset builder
   - `class UserWorkItemsTodayEndpoint(_BaseUserWorkItemsEndpoint)` — adds today filter
   - `class UserWorkItemsOverdueEndpoint(_BaseUserWorkItemsEndpoint)` — adds overdue filter
   - Read `?workspace=<slug>` query param → if present, filter `workspace__slug=<slug>`
   - `use_read_replica = True` (read-only, mirrors `UserEndpoint`)
   - Order by `target_date NULLS LAST, created_at`

4. **Register exports** in `__init__.py` files (views/user, views, serializers).

5. **Register URLs** in `apps/api/plane/app/urls/user.py`:

   ```python
   path("users/me/work-items/today/", UserWorkItemsTodayEndpoint.as_view(), name="user-work-items-today"),
   path("users/me/work-items/overdue/", UserWorkItemsOverdueEndpoint.as_view(), name="user-work-items-overdue"),
   ```

6. **Compile check** (Django syntax):

   ```bash
   cd apps/api && python -c "import django; django.setup(); from plane.app.views.user.work_items import UserWorkItemsTodayEndpoint" 2>&1 | head -20
   ```

7. **Manual SQL inspection** with `python manage.py shell`:
   ```python
   from django.db import connection
   from plane.app.views.user.work_items import UserWorkItemsTodayEndpoint
   # ... call queryset, print connection.queries → expect ≤4 queries (1 main + prefetch_related)
   ```

## Todo List

- [x] Run `gitnexus_impact` on `WorkspaceUserProfileIssuesEndpoint`
- [x] Create `serializers/user_work_items.py` (`UserCrossWorkspaceWorkItemSerializer`)
- [x] Create `views/user/work_items.py` (2 endpoints + base)
- [x] Update `views/user/__init__.py`
- [x] Update `views/__init__.py`
- [x] Update `serializers/__init__.py`
- [x] Register URLs in `urls/user.py`
- [x] Compile-check Django imports
- [x] Inspect `connection.queries` ≤4
- [x] curl smoke test against running container

## Success Criteria

- `curl -b 'session=...' http://localhost/api/users/me/work-items/today/` → 200 with array
- Same call with `?workspace=shinhan-bank-vn` → filters correctly
- Django logs show 1 GET, ≤4 SQL queries (NOT N×workspaces)
- `WorkspaceUserProfileIssuesEndpoint` still works unchanged (regression check)

## Risk Assessment

| Risk                                                           | Likelihood          | Impact | Mitigation                                                                                          |
| -------------------------------------------------------------- | ------------------- | ------ | --------------------------------------------------------------------------------------------------- |
| Permission leak (return issues user can't see)                 | Medium              | High   | Double filter: workspace_member + project_projectmember active; add unit test for forbidden project |
| Slow without index on (assignees, target_date, state\_\_group) | Medium              | Med    | Phase 6 adds index; benchmark before deploy                                                         |
| Serializer N+1 on assignees/labels                             | High if no prefetch | Med    | `prefetch_related("assignees", "labels")`, verify `connection.queries`                              |
| Wrong "today" semantic mismatching frontend                    | Med                 | Med    | Mirror exact frontend filter; cross-test with toggle                                                |
| Breaking change to existing `user-issues` callers              | Low                 | High   | NO modification of existing endpoint; pure addition                                                 |

## Security Considerations

- Auth: session-based via `BaseAPIView` default; no `permission_classes` override needed (default authenticated).
- Authorization: `userId` is implicit `request.user.id` — endpoint never accepts arbitrary user_id. Prevents IDOR.
- Workspace scope: `workspace__workspace_member__is_active=True` excludes left/banned workspaces.
- Project scope: `project__project_projectmember__is_active=True` excludes projects user lost access to.
- No PII exposure beyond what frontend already shows on profile page.

## Next Steps

- Phase 4 consumes this endpoint
- Phase 6 adds composite index `(assignees, state_id, target_date)` if benchmark shows seq scan
- Phase 7 unit tests
