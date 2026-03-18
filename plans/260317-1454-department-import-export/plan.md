---
title: "Department Import & Export"
description: "Add bulk import (XLSX) and export (XLSX/CSV) for god-mode departments page"
status: complete
priority: P2
effort: 3h
branch: triho
tags: [backend, frontend, departments, import, export, god-mode]
created: 2026-03-17
---

# Department Import & Export

Adds Import and Export buttons to `/god-mode/departments/` following the established bulk import pattern (workspaces, users).

## Phases

| # | Phase | Status | File |
|---|-------|--------|------|
| 1 | Backend Export endpoint | ✅ complete | [phase-01-backend-export.md](./phase-01-backend-export.md) |
| 2 | Backend Bulk Import endpoint | ✅ complete | [phase-02-backend-bulk-import.md](./phase-02-backend-bulk-import.md) |
| 3 | Frontend Service + Store | ✅ complete | [phase-03-frontend-service-store.md](./phase-03-frontend-service-store.md) |
| 4 | Frontend UI | ✅ complete | [phase-04-frontend-ui.md](./phase-04-frontend-ui.md) |

## Validation Log

### Session 1 — 2026-03-17
**Trigger:** Initial plan creation
**Questions asked:** 4

#### Questions & Answers

1. **[Architecture]** The plan places Import as a modal dialog (like DepartmentFormModal). Workspace bulk import uses a dedicated full page instead. Which UI pattern do you prefer?
   - Options: Modal dialog | Dedicated page
   - **Answer:** Dedicated page (`/god-mode/departments/import`)
   - **Rationale:** More space for preview table; consistent with workspace bulk import UX pattern. Requires a new page route + navigation from toolbar button instead of a modal.

2. **[Assumptions]** How should the bulk import handle rows with validation errors?
   - Options: Partial success | All-or-nothing
   - **Answer:** Partial success
   - **Rationale:** Matches workspace bulk create behavior. Valid rows created; invalid returned as `skipped` with reasons.

3. **[Scope]** What export format(s) should be supported?
   - Options: XLSX only | XLSX + CSV both
   - **Answer:** XLSX only
   - **Rationale:** Simpler backend. CSV deferred. Remove `?format=csv` branch from Phase 1.

4. **[Risk]** Phase 3 flags a risk: the base APIService may not support blob responses for the Export download. Preferred fallback if it doesn't?
   - Options: window.open() URL | Extend APIService for blob | fetch() directly in store
   - **Answer:** `window.open()` URL
   - **Rationale:** Zero extra code — browser handles download directly. No blob/axios complexity. Export action in store becomes a single `window.open(url)` call.

#### Confirmed Decisions
- **Import UI**: Dedicated page at `/god-mode/departments/import` (not a modal)
- **Error handling**: Partial success — skip bad rows, create valid ones
- **Export format**: XLSX only
- **Export download**: `window.open('/api/instances/departments/export/')` in store

#### Action Items
- [ ] Update Phase 1: remove CSV support, XLSX only
- [ ] Update Phase 3: `exportDepartments` store action uses `window.open()` not blob fetch
- [ ] Update Phase 4: replace modal with dedicated page + route; Import button navigates to page

#### Impact on Phases
- Phase 1: Remove `_csv_response` helper and `format` query param handling — XLSX only
- Phase 3: `exportDepartments` store action → `window.open(url)` instead of blob download
- Phase 4: Replace modal component with dedicated page route `/departments/import`; Import button uses `useRouter` to navigate; page mirrors `workspace-bulk-import-form.tsx` structure

## Key Files

- **Backend views:** `apps/api/plane/license/api/views/department.py`
- **Backend URLs:** `apps/api/plane/license/api/urls/department.py`
- **Service:** `packages/services/src/department/instance-department.service.ts`
- **Store:** `apps/admin/store/instance-department.store.ts`
- **Page:** `apps/admin/app/(all)/(dashboard)/departments/page.tsx`
- **Reference import UI:** `apps/admin/components/workspace/workspace-bulk-import-form.tsx`
- **Reference import backend:** `apps/api/plane/license/api/views/workspace_bulk_create.py`
