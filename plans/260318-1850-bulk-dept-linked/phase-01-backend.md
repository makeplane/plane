---
title: "Phase 01 — Backend API: Bulk Link Workspace Endpoint"
description: "New Django view to bulk-link departments to workspaces via workspace-slug from Excel data"
status: pending
priority: P2
---

# Phase 01 — Backend API

**Parent plan:** [plan.md](./plan.md)
**Next phase:** [phase-02-frontend.md](./phase-02-frontend.md)

## Overview

| Field    | Value      |
| -------- | ---------- |
| Date     | 2026-03-18 |
| Status   | pending    |
| Priority | P2         |

## Key Insights

- Existing `InstanceDepartmentLinkWorkspaceEndpoint` uses `workspace_id` (UUID) — we need slug lookup
- Existing slug lookup pattern: `Workspace.objects.filter(slug=workspace_slug).first()` (from workspace_member_bulk_assign.py)
- Department lookup: use `code` field only (unique, designed for round-trip import/export) — validated decision
- Reuse `_add_managers_to_workspace()` and `_sync_members_to_workspace()` from department.py
- Per-row error handling: skip bad rows, collect reasons, continue processing
- Max 500 rows (same limit as bulk import)

## Requirements

1. New endpoint `POST /api/instances/departments/bulk-link-workspace/`
2. Accept JSON: `{"links": [{"code": "...", "workspace_slug": "..."}]}` <!-- Updated: Validation Session 1 - identifier is `code` field -->
3. For each row:
   - Lookup department by `code` field
   - Lookup workspace by `slug`
   - Check department not already linked to another workspace
   - Apply link-workspace logic (set FK + add members + add managers)
4. Return `{linked: [...dept names], skipped: [{row, reason}], total_linked, total_skipped}`
5. Max 500 rows per request
6. Require instance admin permission (same as other department endpoints)

## Architecture

```
POST /api/instances/departments/bulk-link-workspace/
  │
  ├── Validate request (max 500 rows)
  ├── For each {dept_code, workspace_slug}:
  │     ├── Lookup dept: Department.objects.filter(code=code, deleted_at__isnull=True)
  │     ├── Lookup workspace: Workspace.objects.filter(slug=workspace_slug).first()
  │     ├── Skip if: dept not found, workspace not found, dept already linked
  │     └── Link: dept.linked_workspace = workspace; reuse manager/member sync helpers
  └── Return results summary
```

## Related Code Files

- `apps/api/plane/license/api/views/department.py` — reference for link-workspace logic & helpers
- `apps/api/plane/license/api/urls/department.py` — add new URL pattern
- `apps/api/plane/db/models/department.py` — Department model fields
- `apps/api/plane/license/api/views/workspace_member_bulk_assign.py` — slug lookup pattern

## Implementation Steps

1. Create `apps/api/plane/license/api/views/department_bulk_link.py`:
   - Class `DepartmentBulkLinkWorkspaceView(BaseAPIView)`
   - Import helpers from `department.py` or duplicate minimal logic
   - POST method: validate → loop rows → link → return results

2. Register URL in `apps/api/plane/license/api/urls/department.py`:

   ```python
   path(
       "departments/bulk-link-workspace/",
       DepartmentBulkLinkWorkspaceView.as_view(),
       name="instance-department-bulk-link-workspace",
   ),
   ```

   ⚠️ Must be registered BEFORE `departments/<uuid:pk>/` routes

3. Import new view in `apps/api/plane/license/api/urls/department.py`

## Todo

- [ ] Create `department_bulk_link.py` view
- [ ] Add URL pattern (before UUID routes)
- [ ] Import new view in URL config
- [ ] Run `python run_tests.py` to verify no regressions

## Success Criteria

- POST with valid Excel rows → departments linked, managers/members added
- Invalid dept_code → row skipped with reason "Department not found"
- Invalid workspace_slug → row skipped with reason "Workspace not found"
- Already-linked dept → row skipped with reason "Already linked to workspace {name}"
- > 500 rows → 400 error
- Returns correct summary counts

## Risk Assessment

- **Helper coupling**: `_add_managers_to_workspace` and `_sync_members_to_workspace` are module-level in department.py — import them directly to avoid duplication
- **URL order**: bulk-link-workspace path must precede `<uuid:pk>` patterns

## Security Considerations

- Require `IsAuthenticated` + instance admin check (same as existing endpoints)
- No injection risk: workspace slug validated via DB lookup only
- Celery async fallback for large member counts (same pattern as existing link-workspace)
