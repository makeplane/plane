# Researcher 01: Existing Bulk Import Projects Implementation

**Date:** 2026-03-13 | **Status:** Complete

## Existing Feature (plans/260313-1403)

**Status: FULLY IMPLEMENTED** — the create-only bulk import is complete.

### Backend (COMPLETE)

- **File:** `apps/api/plane/license/api/views/workspace_project_bulk_import.py`
- **Endpoint:** `POST /api/instances/bulk-import-projects/`
- **Payload:** `{ projects: [{ workspace_slug, name, description?, network? }] }`
- **Response:** `{ created, skipped, total_created, total_skipped }`
- **Logic:** Create-only; duplicate name in same workspace → skip
- **URL reg:** `apps/api/plane/license/urls.py` → `bulk-import-projects/`

### Frontend (COMPLETE)

- **Form:** `apps/admin/components/workspace/workspace-project-bulk-import-form.tsx` (172 lines)
- **Preview:** `apps/admin/components/workspace/workspace-project-bulk-import-preview.tsx`
- **Results:** `apps/admin/components/workspace/workspace-project-bulk-import-results.tsx`
- **Route:** `apps/admin/app/(all)/(dashboard)/workspace/bulk-import-projects/page.tsx`
- **Entry button:** `/workspace/page.tsx` has "Bulk Import Projects" button (line 138-140)

### Service (COMPLETE)

- **File:** `packages/services/src/workspace/instance-workspace.service.ts`
- **Method:** `bulkImportProjects(projects[]) → IWorkspaceProjectBulkImportResponse`
- **Type:** `IWorkspaceProjectBulkImportResponse` defined with `created`, `skipped`, `total_created`, `total_skipped`

### Store (COMPLETE)

- **File:** `apps/admin/store/workspace.store.ts`
- **Method:** `bulkImportProjects(projects[]) → Promise<IWorkspaceProjectBulkImportResponse>`

## Gap: No UPSERT Support

Current implementation:

- NO `project_id` column in Excel template
- Duplicate names → skipped (not updated)
- No way to update existing projects via bulk import

## What's Needed for "Based on Project ID"

UPSERT logic:

- Optional `project_id` (UUID) column in Excel
- If `project_id` provided → fetch project → update `name`, `description`, `network`
- If `project_id` not provided → create new (existing logic)
- Response needs `updated: [...]`, `total_updated: number` fields
