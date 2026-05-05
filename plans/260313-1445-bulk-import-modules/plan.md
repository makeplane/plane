---
title: "Bulk Import Modules for Projects (God Mode Workspace)"
description: "God Mode admin bulk-imports Modules into projects via Excel — multi-project, skip duplicates"
status: complete
priority: P2
effort: 3.5h
branch: triho
tags: [god-mode, modules, bulk-import, admin, workspace]
created: 2026-03-13
---

# Bulk Import Modules for Projects — God Mode Workspace

## Overview

Allow God Mode admins to bulk-import **Modules** (sprint/epic containers at `/<workspace_slug>/projects/<project_id>/modules`)
into any project across any workspace via a single Excel upload from the God Mode workspace screen.

Entry point: `/god-mode/workspace/` → "Bulk Import Modules" button → `/workspace/bulk-import-modules/`

## Phases

| #   | Phase       | Status      | Est. | File                                                 |
| --- | ----------- | ----------- | ---- | ---------------------------------------------------- |
| 1   | Backend API | ✅ complete | 1.5h | [phase-01-backend-api.md](./phase-01-backend-api.md) |
| 2   | Frontend UI | ✅ complete | 2h   | [phase-02-frontend-ui.md](./phase-02-frontend-ui.md) |

## Key Decisions

- **Multi-project import:** each Excel row targets its own project via `workspace_slug` + `project_identifier`
- **Duplicate handling:** skip if module `name` already exists in the target project (not deleted)
- **Fields imported:** `name` (required), `description` (optional), `status` (optional), `start_date` (optional), `target_date` (optional)
- **Status:** optional column in Excel — valid values: `backlog|planned|in-progress|paused|completed|cancelled`; defaults to `planned` if blank/invalid
- **Date format:** ISO `YYYY-MM-DD`; invalid date → null, row continues (don't reject for bad date)
- **Max rows:** 100 per request
- **API endpoint:** `POST /api/instances/bulk-import-modules/` (God Mode only)
- **Pattern:** mirrors `workspace_project_bulk_import.py` + `workspace-project-bulk-import-form.tsx` exactly

## Architecture Pattern

```
Excel Upload (client-side XLSX parse)
  ↓
instanceWorkspaceService.bulkImportModules(modules[])
  ↓
POST /api/instances/bulk-import-modules/
  ↓ per row: workspace_slug → Workspace (cache) → project_identifier → Project (cache)
  ↓ duplicate check: Module.filter(name, project, deleted_at__isnull=True)
  ↓ Module.create(name, description, start_date, target_date, status="planned", ...)
  ↓
{ created, skipped, total_created, total_skipped }
  ↓
Results inline (same page)
```

## Excel Template Columns

| Column               | Required | Notes                                                                            |
| -------------------- | -------- | -------------------------------------------------------------------------------- |
| `workspace_slug`     | Yes      | Target workspace                                                                 |
| `project_identifier` | Yes      | Project identifier (e.g., `PROJ`)                                                |
| `name`               | Yes      | Module name — must be unique per project                                         |
| `description`        | No       | Optional description                                                             |
| `status`             | No       | `backlog\|planned\|in-progress\|paused\|completed\|cancelled`; default `planned` |
| `start_date`         | No       | ISO `YYYY-MM-DD`; invalid → null (row still created)                             |
| `target_date`        | No       | ISO `YYYY-MM-DD`; invalid → null (row still created)                             |

## Related Files

- **Pattern — Backend:** `apps/api/plane/license/api/views/workspace_project_bulk_import.py`
- **Pattern — Frontend form:** `apps/admin/components/workspace/workspace-project-bulk-import-form.tsx`
- **Pattern — Preview:** `apps/admin/components/workspace/workspace-project-bulk-import-preview.tsx`
- **Pattern — Results:** `apps/admin/components/workspace/workspace-project-bulk-import-results.tsx`
- **Service:** `packages/services/src/workspace/instance-workspace.service.ts`
- **Store:** `apps/admin/store/workspace.store.ts`
- **Module model:** `apps/api/plane/db/models/module.py`

## Validation Log

### Session 1 — 2026-03-13

**Trigger:** Initial plan creation
**Questions asked:** 3

#### Questions & Answers

1. **[Scope]** The plan defaults module status to 'planned' and excludes it from the Excel template. Should admins be able to set status in the import file?
   - Options: No — default 'planned', keep template simple | Yes — add optional 'status' column to Excel
   - **Answer:** Yes — add optional 'status' column to Excel
   - **Rationale:** Admins importing modules for planned sprints need to set status upfront; adds 1 column to template with clear valid values.

2. **[Assumptions]** How should invalid dates (wrong format, non-existent date) be handled per row?
   - Options: Null the date field, continue creating the module | Skip the row with a 'invalid date format' reason
   - **Answer:** Null the date field, continue creating the module
   - **Rationale:** Lenient date handling avoids entire rows being skipped for formatting issues; module is still useful without dates.

3. **[Architecture]** Should the duplicate-name check be case-sensitive or case-insensitive?
   - Options: Case-sensitive — match Python's default DB behavior | Case-insensitive — normalize to lowercase before check
   - **Answer:** Case-sensitive — match Python's default DB behavior
   - **Rationale:** Consistent with Plane's existing Module uniqueness constraint; avoids extra iexact overhead.

#### Confirmed Decisions

- **Status column:** optional in Excel; valid values `backlog|planned|in-progress|paused|completed|cancelled`; default `planned`
- **Invalid dates:** null the field, row continues (not skipped)
- **Duplicate check:** case-sensitive (DB default)

#### Action Items

- [x] Add `status` to Excel template columns in plan.md
- [ ] Update phase-01 backend: parse `status` from row, validate against known choices, default to `planned`
- [ ] Update phase-02 frontend: add `status` column to template download header + preview table

#### Impact on Phases

- Phase 1: Add `status` field parsing — extract from row, validate against `VALID_STATUSES` set, default `"planned"` if blank/invalid; pass to `Module.objects.create()`
- Phase 2: Add `status` as 5th column in template header (`workspace_slug`, `project_identifier`, `name`, `description`, `status`, `start_date`, `target_date`); add column to preview table; update `IModuleRow` interface
