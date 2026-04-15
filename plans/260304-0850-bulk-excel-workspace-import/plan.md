---
title: "Bulk Excel Import for Workspace Creation"
description: "Add Excel-based bulk workspace creation to the god-mode admin panel at /god-mode/workspace/"
status: pending
priority: P2
effort: 4h
branch: triho
tags: [god-mode, workspace, bulk-import, excel, admin]
created: 2026-03-04
---

# Bulk Excel Import — Workspace Creation

## Overview

Add "Bulk Create Workspace" button on the god-mode `/workspace/` admin page. Admin uploads `.xlsx`/`.xls` file → frontend parses it with `xlsx` (SheetJS) → preview rows → bulk POST to new backend endpoint → show results.

## Architecture Decision

**Frontend parses Excel** (not backend):

- Enables preview UI before creation
- No new Python deps required
- Backend receives simple JSON; validates & creates workspaces

## Phases

| #   | Phase                                                                       | Status   | Est. |
| --- | --------------------------------------------------------------------------- | -------- | ---- |
| 01  | [Backend: Bulk Create Endpoint](./phase-01-backend-bulk-create-endpoint.md) | complete | 1.5h |
| 02  | [Frontend: Excel Import UI](./phase-02-frontend-excel-import-ui.md)         | complete | 2.5h |

## Key Files

**Backend:**

- `apps/api/plane/license/api/views/workspace_bulk_create.py` ← NEW
- `apps/api/plane/license/api/views/__init__.py` ← modify (export)
- `apps/api/plane/license/urls.py` ← modify (add URL)

**Frontend (apps/admin):**

- `apps/admin/components/workspace/bulk-import-form.tsx` ← NEW
- `apps/admin/app/(all)/(dashboard)/workspace/bulk-import/page.tsx` ← NEW
- `apps/admin/store/workspace.store.ts` ← modify (add bulkCreateWorkspaces)
- `apps/admin/hooks/store/use-workspace.tsx` ← modify (expose action)
- `apps/admin/app/(all)/(dashboard)/workspace/page.tsx` ← modify (add button)
- `apps/admin/package.json` ← modify (add xlsx dep)

## Dependencies

Phase 02 blocked by Phase 01 (needs API endpoint URL confirmed).

## Research

- [Researcher 01: Backend API](./research/researcher-01-backend-api.md)
- [Researcher 02: Frontend Patterns](./research/researcher-02-frontend-patterns.md)

## Validation Log

### Session 1 — 2026-03-04

**Trigger:** Initial plan creation
**Questions asked:** 4

#### Questions & Answers

1. **[Architecture]** The plan requires users to manually fill in the 'slug' column in the Excel template. Should slug be auto-generated from the workspace name instead?
   - Options: Manual (user fills slug) | Auto-generate from name | Both (auto-fill if blank)
   - **Answer:** Auto-generate from name
   - **Rationale:** Backend slugifies the `name` field (e.g. `django-utils.slugify`). Excel template only needs `name` + `organization_size` columns. Simplifies the import experience significantly.

2. **[Architecture]** After bulk import, who is set as the workspace owner for all created workspaces?
   - Options: Logged-in admin user | Add owner_email column to template
   - **Answer:** Logged-in admin user (current behavior)
   - **Rationale:** No change needed; consistent with single-create endpoint behavior.

3. **[Tradeoffs]** Should the preview table be read-only or allow inline editing before submitting?
   - Options: Read-only preview | Editable inline
   - **Answer:** Read-only preview
   - **Rationale:** Simpler implementation; consistent with user bulk import UX; fix-and-reupload workflow is acceptable.

4. **[Tradeoffs]** Add bulkCreate() to @plane/services or inline in admin store?
   - Options: Add to @plane/services | Inline in admin store
   - **Answer:** Inline in admin store
   - **Rationale:** Avoids package rebuild; this is an admin-only feature; faster to implement with no shared-package coordination needed.

#### Confirmed Decisions

- **Slug generation**: Auto-generated from name on backend (not in template) — simplifies UX
- **Workspace owner**: `request.user` (admin) — no change from single-create
- **Preview table**: Read-only — consistent with existing pattern
- **Service method**: Inline API call in admin store — no @plane/services change

#### Action Items

- [ ] Remove `slug` column from Excel template (only `name`, `organization_size`)
- [ ] Backend: auto-generate slug from name using `django.utils.text.slugify` + uniqueness suffix if collision
- [ ] Remove `@plane/services bulkCreate()` step from Phase 02 — inline `axios.post` in store instead

#### Impact on Phases

- Phase 01: Backend must auto-generate slug from name, handle slug collisions (append suffix)
- Phase 02: Template has only 2 columns (`name`, `organization_size`); service method inlined in store
