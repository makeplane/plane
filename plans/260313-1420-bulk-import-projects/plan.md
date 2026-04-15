---
title: "Bulk Import Projects with UPSERT by Project ID (God Mode)"
description: "Extend bulk import projects to support updating existing projects by project_id (UPSERT)"
status: pending
priority: P2
effort: 3h
branch: triho
tags: [god-mode, projects, bulk-import, upsert, admin]
created: 2026-03-13
---

# Bulk Import Projects — UPSERT by Project ID

## Context

The **create-only** bulk import is fully implemented (`plans/260313-1403-bulk-import-projects/`).
This plan extends it with **UPSERT** support: if `project_id` (UUID) is provided in the Excel row,
update the existing project instead of creating a new one.

Entry point: God Mode → `/god-mode/workspace/` → "Bulk Import Projects" → `/workspace/bulk-import-projects/`

## Phases

| #   | Phase           | Status     | Est. | File                                                         |
| --- | --------------- | ---------- | ---- | ------------------------------------------------------------ |
| 1   | Backend UPSERT  | ⬜ pending | 1.5h | [phase-01-backend-upsert.md](./phase-01-backend-upsert.md)   |
| 2   | Frontend Update | ⬜ pending | 1.5h | [phase-02-frontend-update.md](./phase-02-frontend-update.md) |

## Key Decisions

- **UPSERT trigger:** optional `project_id` UUID column in Excel
- **Update fields:** `name`, `description`, `network` only — `workspace` and `identifier` immutable
- **Security:** verify project belongs to specified `workspace_slug` before update
- **Response:** add `updated` + `total_updated` fields alongside existing `created`/`skipped`
- **Template:** add `project_id` as first (optional) column in `.xlsx` template
- **No breaking change:** `project_id` omitted → existing create-only logic unchanged

## Related Files

- **Extends:** `plans/260313-1403-bulk-import-projects/` (create-only — fully implemented)
- **Backend:** `apps/api/plane/license/api/views/workspace_project_bulk_import.py`
- **Service:** `packages/services/src/workspace/instance-workspace.service.ts`
- **Store:** `apps/admin/store/workspace.store.ts`
- **Form:** `apps/admin/components/workspace/workspace-project-bulk-import-form.tsx`
- **Preview:** `apps/admin/components/workspace/workspace-project-bulk-import-preview.tsx`
- **Results:** `apps/admin/components/workspace/workspace-project-bulk-import-results.tsx`
