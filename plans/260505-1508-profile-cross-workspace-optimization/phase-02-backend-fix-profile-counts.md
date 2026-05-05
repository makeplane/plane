# Phase 2 — Backend: Fix N+1 + Sub-task Count Bug

## Context Links

- Debug report §"#2 N+1 trên backend": `plans/reports/debugger-260505-1454-your-work-profile-slow.md`
- File under fix: `apps/api/plane/app/views/workspace/user.py:294–387` (`WorkspaceUserProfileEndpoint`)
- Comment already in code line 326: `"Bug fix: filter parent__isnull=True"` — same fix needed for the other 3 annotations

## Overview

- **Priority:** P1 (correctness bug — counts wrong)
- **Status:** complete
- **Effort:** 1h
- **Brief:** 3/4 `Count()` annotations in `WorkspaceUserProfileEndpoint` miss `parent__isnull=True`, so they include sub-tasks. Fix annotations on `created_issues` (line 311), `completed_issues` (line 335), `pending_issues` (line 347).

## Key Insights

- Only `assigned_issues` (line 322–333) has `parent__isnull=True` — comment confirms it was a previous bug fix; the 3 others were missed.
- Counts wrong impacts profile UI (project breakdown numbers shown to user).
- Fix is one Q-clause addition per annotation. Zero behavioral change beyond correct counting.
- Endpoint already filters `project_projectmember__is_active=True` (line 307) — no permission regression.

## Requirements

**Functional**

- All 4 counts (`created_issues`, `assigned_issues`, `completed_issues`, `pending_issues`) exclude sub-tasks.
- Empty workspaces still return `0`, not error.
- Existing 4 fields stay in response (no contract change).

**Non-functional**

- No additional query (annotations are still single SQL).
- p95 same or better (filter narrows scan).

## Architecture

Pure SQL change inside existing endpoint. Single query before/after:

```sql
SELECT project.id, ...,
  COUNT(*) FILTER (WHERE issues.created_by_id=:uid AND issues.parent_id IS NULL AND ...) AS created_issues,
  COUNT(*) FILTER (WHERE issues.assignee=:uid AND issues.parent_id IS NULL AND ...) AS assigned_issues,
  COUNT(*) FILTER (WHERE issues.state__group='completed' AND issues.parent_id IS NULL AND ...) AS completed_issues,
  COUNT(*) FILTER (WHERE issues.state__group IN(...) AND issues.parent_id IS NULL AND ...) AS pending_issues
FROM projects ...
```

## Related Code Files

**Modify**

- `apps/api/plane/app/views/workspace/user.py` — annotations at line 311, 335, 347 only

**Read for context**

- Already-fixed example at line 322–333
- Frontend consumer: `apps/web/core/store/issue/profile/issue.store.ts:205` (calls `getUserProfileProjectsSegregation`)

## Implementation Steps

1. **Run impact analysis:**

   ```
   gitnexus_impact({target: "WorkspaceUserProfileEndpoint", direction: "upstream"})
   ```

2. **Edit annotations** in `apps/api/plane/app/views/workspace/user.py`:
   - Line 311 `created_issues`: add `project_issue__parent__isnull=True,` to Q clause
   - Line 335 `completed_issues`: same
   - Line 347 `pending_issues`: same
   - Optional: extract shared base Q into local var to DRY (`_active_issue_q = Q(project_issue__deleted_at__isnull=True, project_issue__archived_at__isnull=True, project_issue__is_draft=False, project_issue__parent__isnull=True)`)

3. **Verify SQL:** `python manage.py shell` → run queryset → check `WHERE parent_id IS NULL` appears in all 4 FILTER clauses.

4. **Compile check:** `python -c "from plane.app.views.workspace.user import WorkspaceUserProfileEndpoint"`

## Todo List

- [x] Run gitnexus_impact on `WorkspaceUserProfileEndpoint`
- [x] Add `project_issue__parent__isnull=True` to `created_issues` annotation
- [x] Add same to `completed_issues` annotation
- [x] Add same to `pending_issues` annotation
- [x] (Optional DRY) Extract common Q clause
- [x] SQL inspection in shell
- [x] Manual smoke: GET `/api/workspaces/<slug>/user-profile/<uid>/` returns same shape

## Success Criteria

- 4 counts in response are LE old values (sub-task subtraction)
- For test workspace with known sub-task: number visibly drops by exactly the sub-task count
- Existing test suite passes (no behavior change beyond correctness)
- New regression test added in Phase 7 confirms parent-only counting

## Risk Assessment

| Risk                                          | Likelihood | Impact | Mitigation                                                          |
| --------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------- |
| User notices count drop and thinks it's a bug | Med        | Low    | Mention in PR description; this is the correct number               |
| Some report tooling depends on inflated count | Low        | Med    | Grep workspace/user.py callers — only frontend profile page uses it |
| Breaking serializer assumption                | Very low   | Low    | `.values(...)` not changed                                          |

## Security Considerations

None — purely a count correctness fix on already-filtered queryset. Permission filter unchanged.

## Next Steps

- Phase 7 adds regression test asserting sub-task NOT counted
- No frontend change needed (numbers just become correct)
