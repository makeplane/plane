# Phase 6: Backend Workspace Drill-down APIs

## Context Links

- [Parent Plan](./plan.md)
- [Phase 1: Scope Resolution & Core APIs](./phase-01-backend-scope-resolution-core-apis.md)
- HeadOfficeBaseView: `apps/api/plane/app/views/workspace/head_office.py`
- Head office URLs: `apps/api/plane/app/urls/head_office.py`
- Project model: `apps/api/plane/db/models/project/project.py`
- WorkspaceMember model: `apps/api/plane/db/models/workspace/workspace.py`
- Issue model: `apps/api/plane/db/models/issue.py`
- StaffProfile model: `apps/api/plane/db/models/staff.py`

## Overview

- **Priority:** P1
- **Status:** pending
- **Effort:** 4h
- **Description:** Add workspace drill-down endpoints: projects list with issue counts/completion, and members list with workload (assigned issue count). Both verify target workspace is within caller's managed scope.

## Key Insights

- Reuse `HeadOfficeBaseView.get_managed_workspace_ids()` to verify target ws_id is in managed scope
- Projects: annotate with `Count` for open/closed issues, compute completion_rate in Python
- Members: join WorkspaceMember + StaffProfile (left join, staff may not exist) + assigned open issue count
- Use `select_related` on project FK chains, `annotate` for aggregations to avoid N+1
- Workspace ID passed as URL param, must validate it's a UUID and within managed scope

## Requirements

### Functional

1. Projects endpoint: list projects in a specific workspace with issue stats
2. Members endpoint: list workspace members with workload (assigned open issue count)
3. Both endpoints validate target workspace is in caller's managed scope (403 otherwise)

### Non-Functional

1. No N+1 queries — use annotations for counts
2. Paginate if >50 results
3. Return JSON, consistent with existing head-office API shape

## Architecture

```
HeadOfficeWorkspaceProjectsEndpoint(HeadOfficeBaseView)
  GET /head-office/workspaces/<ws_id>/projects/
  1. Verify ws_id in get_managed_workspace_ids()
  2. Query Project.objects.filter(workspace_id=ws_id, archived_at__isnull=True)
  3. Annotate: total_issues, open_issues, closed_issues_30d, completion_rate
  4. Return project list with stats

HeadOfficeWorkspaceMembersEndpoint(HeadOfficeBaseView)
  GET /head-office/workspaces/<ws_id>/members/
  1. Verify ws_id in get_managed_workspace_ids()
  2. Query WorkspaceMember.objects.filter(workspace_id=ws_id)
  3. Left join StaffProfile via member.member (user FK)
  4. Annotate: assigned_open_issues = Count of Issues where assignees contains member.member
  5. Return member list with workload
```

## Related Code Files

### Files to Create

- None (add to existing files)

### Files to Modify

<!-- Updated: Validation Session 2 - domain split, drill-down stays with core workspace concerns -->

- `apps/api/plane/app/views/workspace/head_office_core.py` — Add HeadOfficeWorkspaceProjectsEndpoint, HeadOfficeWorkspaceMembersEndpoint
- `apps/api/plane/app/urls/head_office.py` — Add URL patterns for drill-down endpoints

## Implementation Steps

### Step 1: Add workspace scope validation helper (0.5h)

1. In `head_office.py`, add method to `HeadOfficeBaseView`:
   ```python
   def validate_workspace_in_scope(self, ws_id):
       managed_ids = self.get_managed_workspace_ids()
       if str(ws_id) not in [str(mid) for mid in managed_ids]:
           return Response(
               {"error": "Workspace not in managed scope"},
               status=status.HTTP_403_FORBIDDEN
           )
       return None
   ```

### Step 2: Implement Projects endpoint (1.5h)

1. `HeadOfficeWorkspaceProjectsEndpoint(HeadOfficeBaseView)`:
2. `GET` method:
   - Extract `ws_id` from `self.kwargs["workspace_id"]`
   - Call `validate_workspace_in_scope(ws_id)` — return 403 if not in scope
   - Query:
     ```python
     projects = Project.objects.filter(
         workspace_id=ws_id,
         archived_at__isnull=True,
     ).annotate(
         total_issues=Count("issues"),
         open_issues=Count(
             "issues",
             filter=Q(issues__state__group__in=["backlog", "unstarted", "started"])
         ),
         closed_issues_30d=Count(
             "issues",
             filter=Q(
                 issues__state__group="completed",
                 issues__completed_at__gte=timezone.now() - timedelta(days=30)
             )
         ),
     ).values(
         "id", "name", "identifier", "emoji", "icon_prop",
         "total_issues", "open_issues", "closed_issues_30d",
     ).order_by("name")
     ```
   - Compute `completion_rate` per project in serialization
   - Return JSON array

### Step 3: Implement Members endpoint (1.5h)

1. `HeadOfficeWorkspaceMembersEndpoint(HeadOfficeBaseView)`:
2. `GET` method:
   - Extract `ws_id` from `self.kwargs["workspace_id"]`
   - Validate scope
   - Query:
     ```python
     members = WorkspaceMember.objects.filter(
         workspace_id=ws_id,
         is_active=True,
     ).select_related("member").annotate(
         assigned_open_issues=Count(
             "member__issue_assignee__issue",
             filter=Q(
                 member__issue_assignee__issue__workspace_id=ws_id,
                 member__issue_assignee__issue__state__group__in=[
                     "backlog", "unstarted", "started"
                 ],
             )
         ),
     )
     ```
   - Left join StaffProfile:
     ```python
     staff_map = {
         sp.user_id: sp
         for sp in StaffProfile.objects.filter(
             user_id__in=[m.member_id for m in members],
             deleted_at__isnull=True,
         ).select_related("department")
     }
     ```
   - Serialize: member info + staff profile (position, department, staff_id) + workload count
   - Return JSON array

### Step 4: Register URLs (0.5h)

1. Add to `apps/api/plane/app/urls/head_office.py`:
   ```python
   path("workspaces/<str:slug>/head-office/workspaces/<uuid:workspace_id>/projects/",
        HeadOfficeWorkspaceProjectsEndpoint.as_view(), name="head-office-ws-projects"),
   path("workspaces/<str:slug>/head-office/workspaces/<uuid:workspace_id>/members/",
        HeadOfficeWorkspaceMembersEndpoint.as_view(), name="head-office-ws-members"),
   ```

## Todo List

- [ ] Add `validate_workspace_in_scope()` to HeadOfficeBaseView
- [ ] Implement HeadOfficeWorkspaceProjectsEndpoint GET
- [ ] Implement HeadOfficeWorkspaceMembersEndpoint GET
- [ ] Register drill-down URL patterns
- [ ] Test: projects endpoint returns annotated issue counts
- [ ] Test: members endpoint returns workload with staff profile join
- [ ] Test: 403 when target workspace not in managed scope

## Success Criteria

- Projects endpoint returns project list with total_issues, open_issues, closed_issues_30d, completion_rate
- Members endpoint returns member list with assigned_open_issues + staff profile info
- 403 returned when requesting workspace outside managed scope
- No N+1 queries (annotations handle all counts)
- Pagination works for workspaces with >50 projects/members

## Risk Assessment

| Risk                               | Probability | Impact | Mitigation                                              |
| ---------------------------------- | ----------- | ------ | ------------------------------------------------------- |
| Issue assignee M2M join complexity | Medium      | Medium | Use through table `issue_assignee` with proper filter   |
| StaffProfile missing for members   | Medium      | Low    | Left join via dict lookup, return null for staff fields |
| Large workspace with many projects | Low         | Medium | Pagination via BasePaginator                            |
| UUID validation on ws_id           | Low         | Low    | Django `<uuid:workspace_id>` handles invalid UUIDs      |

## Security Considerations

- Scope validation: target workspace must be in caller's managed scope
- No write operations (GET only)
- Staff profile data only exposed to authorized managers
- WorkspaceEntityPermission still required (user must be member of URL workspace)

## Next Steps

- Phase 9 consumes these APIs to build workspace drill-down cards in frontend
- Phase 7 adds staff-specific endpoints (search, profile, activity)
