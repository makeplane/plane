# Phase 01: Backend API

## Context Links

- Parent plan: [plan.md](./plan.md)
- Reference: `apps/api/plane/license/api/views/workspace_bulk_create.py`
- Reference: `apps/api/plane/app/views/project/base.py` (ProjectViewSet.create)
- Reference: `apps/api/plane/license/urls.py`

## Overview

| Field                 | Value                                                         |
| --------------------- | ------------------------------------------------------------- |
| Date                  | 2026-03-13                                                    |
| Description           | Django REST endpoint for bulk project creation in a workspace |
| Priority              | P2                                                            |
| Implementation Status | ✅ complete                                                   |
| Review Status         | ✅ complete                                                   |

## Key Insights

- `InstanceWorkspaceBulkCreateEndpoint` pattern: JSON body, per-row `transaction.atomic()`, skip+error tracking
- Project creation requires: `Project`, `ProjectIdentifier`, `State.objects.bulk_create(DEFAULT_STATES)`, `ProjectMember` (creator as Admin role=20), auto-add workspace admins
- `identifier` must be unique per workspace — auto-generate from name (first 6 alphanumeric, uppercase, suffix on collision)
- Permission: `InstanceAdminPermission` (god mode admins only)
- No file upload — JSON body like `workspace_bulk_create.py` (not multipart like `staff.py`)

## Requirements

<!-- Updated: Validation Session 1 - workspace_slug per row, general endpoint -->

- `POST /api/instances/bulk-import-projects/`
- Auth: `InstanceAdminPermission`
- Body: `{ "projects": [{ "workspace_slug": str, "name": str, "description"?: str, "network"?: int }] }`
- `workspace_slug` required per row — different rows can target different workspaces
- Max 100 projects per request
- Per-project atomic transaction (partial success allowed)
- Response: `{ created: [...], skipped: [...], total_created: int, total_skipped: int }`
- Skip row if: workspace_slug invalid/not found, name empty, name > 255 chars, name duplicate in workspace, identifier collision after 10 attempts

## Architecture

<!-- Updated: Validation Session 1 - general endpoint, workspace resolved per row -->

```
POST /api/instances/bulk-import-projects/
  → InstanceWorkspaceProjectBulkImportEndpoint
    → validate projects list (max 100)
    → for each project (transaction.atomic):
        → validate workspace_slug → resolve Workspace object (skip if not found)
        → validate name
        → generate unique identifier (per workspace)
        → Project.objects.create(...)
        → ProjectIdentifier.objects.create(...)
        → State.objects.bulk_create(DEFAULT_STATES per project)
        → ProjectMember.objects.create(role=20, member=request.user)
        → auto-add workspace admins (WorkspaceMember role >= 15 → ProjectMember role=20)
        → append to created[]
    → return { created, skipped, total_created, total_skipped }
```

## Related Code Files

- `apps/api/plane/license/api/views/workspace_bulk_create.py` — primary pattern reference
- `apps/api/plane/license/api/views/__init__.py` — register new endpoint
- `apps/api/plane/license/urls.py` — URL registration
- `apps/api/plane/app/views/project/base.py` — project creation logic to replicate
- `apps/api/plane/db/models/project/project.py` — Project, ProjectIdentifier models
- `apps/api/plane/db/models/project/member.py` — ProjectMember model
- `apps/api/plane/db/defaults/states.py` (or similar) — DEFAULT_STATES

## Implementation Steps

1. **Create** `apps/api/plane/license/api/views/workspace_project_bulk_import.py`
   - `_generate_unique_identifier(name, workspace_id)` helper
   - `InstanceWorkspaceProjectBulkImportEndpoint(BaseAPIView)` with `post()` method
   - Reuse project creation logic from `ProjectViewSet.create()` internals

2. **Update** `apps/api/plane/license/api/views/__init__.py`
   - Add: `from .workspace_project_bulk_import import InstanceWorkspaceProjectBulkImportEndpoint`

3. **Update** `apps/api/plane/license/urls.py`
   - Add path: `workspaces/<str:slug>/bulk-import-projects/`

## Todo

- [x] Create `workspace_project_bulk_import.py` view
- [x] Register in `__init__.py`
- [x] Register URL in `urls.py`
- [x] Verify DEFAULT_STATES import path
- [x] Verify WorkspaceMember admin role threshold (15 or 20?)
- [x] Manual test: POST with valid data, duplicate names, empty names

## Success Criteria

- `POST` returns 200 with correct `created`/`skipped` breakdown
- Duplicate name in same workspace → skipped with reason
- Each created project has default states (5 states)
- Creator is Admin member of each created project
- Workspace admins are auto-added to each project
- Max 100 rows enforced (returns 400 if exceeded)

## Risk Assessment

| Risk                                   | Likelihood | Mitigation                                         |
| -------------------------------------- | ---------- | -------------------------------------------------- |
| Identifier collision                   | Medium     | Numeric suffix + IntegrityError catch as fallback  |
| DEFAULT_STATES import path differs     | Low        | Check actual import in `ProjectViewSet.create()`   |
| Missing workspace admin auto-add logic | Low        | Copy logic verbatim from `ProjectViewSet.create()` |

## Security Considerations

- `InstanceAdminPermission` enforced — no regular users
- Input: validate name length ≤ 255, strip HTML, network must be 0 or 2
- Max 100 rows prevents DoS
- Workspace existence validated before processing

## Next Steps

After phase 01: Proceed to [phase-02-frontend-ui.md](./phase-02-frontend-ui.md)
