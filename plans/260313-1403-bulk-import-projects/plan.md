---
title: "Bulk Import Projects to Workspace (God Mode)"
description: "Allow God Mode admins to bulk-import multiple projects into any workspace via Excel upload"
status: complete
priority: P2
effort: 6h
branch: triho
tags: [god-mode, projects, bulk-import, admin]
created: 2026-03-13
---

# Bulk Import Projects to Workspace

## Overview

Add "Bulk Import Projects" feature to God Mode admin panel (`/god-mode/workspace/`). Admins can upload an Excel file to bulk-create projects in any workspace.

## Phases

| #   | Phase       | Status      | Est. | File                                                 |
| --- | ----------- | ----------- | ---- | ---------------------------------------------------- |
| 1   | Backend API | ✅ complete | 2.5h | [phase-01-backend-api.md](./phase-01-backend-api.md) |
| 2   | Frontend UI | ✅ complete | 3.5h | [phase-02-frontend-ui.md](./phase-02-frontend-ui.md) |

## Key Decisions

- **App target:** `apps/admin` (God Mode), NOT `apps/web/ce/`
- **Import format:** Excel (.xlsx/.xls) — follows existing bulk import pattern
- **API:** `POST /api/instances/bulk-import-projects/` (JSON body, no workspace slug in URL)
- **Template columns:** `workspace_slug` (required), `name` (required), `description` (optional), `network` (optional, default 2=Public)
- **Multi-workspace:** Each row targets its own workspace via `workspace_slug` column
- **Max rows:** 100 per request
- **Entry point:** "Bulk Import Projects" button on `/workspace/` list page
- **Post-submit:** Show results inline (created/skipped breakdown)

## Architecture Pattern

Mirrors existing `workspace/bulk-import/` feature in `apps/admin`:

- Backend: `InstanceWorkspaceBulkCreateEndpoint` → `InstanceWorkspaceProjectBulkImportEndpoint`
- Frontend: `WorkspaceBulkImportForm` → `WorkspaceProjectBulkImportForm` (no dropdown, just file upload)
- Service: `instanceWorkspaceService.bulkCreate()` → `.bulkImportProjects()`
- Store: `workspaceStore.bulkCreateWorkspaces()` → `.bulkImportProjects()`

## Validation Log

### Session 1 — 2026-03-13

**Trigger:** Initial plan creation
**Questions asked:** 5

#### Questions & Answers

1. **[Architecture]** How should the target workspace be selected in the form?
   - Options: Dropdown | URL param | Text input
   - **Answer:** Admin fills workspace slug into Excel file (custom)
   - **Custom input:** "Admin fill workspace slug into Excel file, Admin fill workspace slug into Excel file"
   - **Rationale:** Removes need for dropdown entirely; each Excel row has `workspace_slug` column — enables multi-workspace import in one file

2. **[Scope]** Should the imported projects include additional fields beyond name, description, and network?
   - Options: name + description + network | identifier | emoji/icon | No extra fields
   - **Answer:** name + description + network (default)
   - **Rationale:** Minimal field set — keeps template simple, identifier auto-generated server-side

3. **[Architecture]** Where should the "Bulk Import Projects" entry point button be?
   - Options: Workspace list page | Workspace detail page | Both
   - **Answer:** Workspace list page
   - **Rationale:** Single entry point, consistent with existing "Bulk Create Workspace" button placement

4. **[UX]** After bulk import completes, what should happen?
   - Options: Show results inline | Redirect to workspace | Toast + stay on form
   - **Answer:** Show results inline
   - **Rationale:** Mirrors existing bulk workspace import UX; admin can see created/skipped without navigation

5. **[Architecture]** How should workspace_slug be structured in the Excel file?
   - Options: Column per row | Single cell/header row
   - **Answer:** Column per row
   - **Rationale:** Allows single file to create projects across multiple workspaces; more flexible and consistent with tabular data

#### Confirmed Decisions

- **workspace_slug**: column per row in Excel — enables multi-workspace import in one upload
- **API URL**: `POST /api/instances/bulk-import-projects/` (not per-workspace URL)
- **No dropdown**: frontend has no workspace selector — xlsx template includes workspace_slug column
- **Excel columns**: `workspace_slug`, `name`, `description`, `network`
- **Post-submit**: inline results on same page
- **Entry point**: button on `/workspace/` list page

#### Action Items

- [x] Update API URL in phase-01 (remove `workspaces/{slug}/` from path)
- [x] Update Excel template columns in phase-02 (add `workspace_slug`)
- [x] Remove workspace dropdown from phase-02 form component
- [x] Update service/store signatures (remove `workspaceSlug` param)
- [x] Update preview table columns (add Workspace Slug column)

#### Impact on Phases

- Phase 1: API endpoint URL changed to `/api/instances/bulk-import-projects/`; body now includes `workspace_slug` per row; workspace resolved per row inside loop
- Phase 2: No dropdown component needed; Excel template has 4 columns; service/store methods have no slug param; preview table shows workspace_slug column

## Related Files

- `apps/api/plane/license/api/views/workspace_bulk_create.py` — reference pattern
- `apps/admin/app/(all)/(dashboard)/workspace/bulk-import/` — reference UI pattern
- `packages/services/src/workspace/instance-workspace.service.ts`
- `apps/admin/store/workspace.store.ts`
