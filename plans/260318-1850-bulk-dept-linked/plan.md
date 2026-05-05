---
title: "Bulk Department Linked via Excel"
description: "Add Excel upload button to bulk-link departments to workspaces using workspace-slug"
status: complete
priority: P2
effort: 3h
branch: triho
tags: [departments, bulk-import, workspace-link, admin]
created: 2026-03-18
---

# Bulk Department Linked

Add "Bulk Department Linked" button beside "Add Department" in the departments toolbar. Allows admin to upload an Excel file mapping departments to workspaces by workspace-slug.

## Phases

| #   | Phase                   | Status   | File                                           |
| --- | ----------------------- | -------- | ---------------------------------------------- |
| 1   | Backend API endpoint    | complete | [phase-01-backend.md](./phase-01-backend.md)   |
| 2   | Frontend modal & button | complete | [phase-02-frontend.md](./phase-02-frontend.md) |

## Flow Summary

```
Excel upload → parse rows [{dept_code, workspace_slug}]
  → POST /api/instances/departments/bulk-link-workspace/
  → backend: lookup dept by code, lookup workspace by slug
  → reuse existing link-workspace logic per row
  → return {linked: [], skipped: [{row, reason}]}
```

## Validation Log

### Session 1 — 2026-03-18

**Trigger:** Initial plan creation validation
**Questions asked:** 4

#### Questions & Answers

1. **[Architecture]** The Excel template needs a column to identify which department to link. The model has two candidate fields — which should be used as the department identifier in the Excel?
   - Options: code | dept_code | short_name
   - **Answer:** code (Recommended)
   - **Rationale:** `code` is unique and designed for round-trip export/import. `dept_code` is not guaranteed unique.

2. **[Assumptions]** If a department is already linked to a workspace, what should happen when that row appears in the bulk-link Excel?
   - Options: Skip with reason | Overwrite / re-link
   - **Answer:** Skip with reason (Recommended)
   - **Rationale:** Prevents accidental re-linking. Report reason "Already linked to workspace {name}".

3. **[Architecture]** The existing single link-workspace uses Celery async when a department has ≥10 staff. Should bulk-link also use async for large departments?
   - Options: Yes, same async logic | Always sync
   - **Answer:** Yes, same async logic (Recommended)
   - **Rationale:** Consistency with existing behavior; avoids timeouts for large departments.

4. **[Scope]** Should the bulk-link endpoint also support unlinking via empty workspace_slug?
   - Options: Link-only | Support unlink too
   - **Answer:** Link-only (Recommended)
   - **Rationale:** Unlink handled per-department via existing UI. Keeps bulk endpoint simple.

#### Confirmed Decisions

- Dept identifier: `code` field — unique, round-trip safe
- Already-linked: skip with reason — no accidental overwrites
- Async: use Celery for ≥10 staff — consistent with existing
- Scope: link-only — no unlink via bulk

#### Action Items

- [ ] Update phase-01: Excel column name is `code`, not `dept_code`
- [ ] Update phase-02: Template column header is `code`, not `dept_code`

#### Impact on Phases

- Phase 1: Change dept lookup field from `dept_code` to `code`; confirm skip behavior for already-linked; confirm Celery async reuse
- Phase 2: Update Excel template column from `dept_code` to `code`; update parse logic accordingly

---

## Key Files

- Backend: `apps/api/plane/license/api/views/department.py` (reference link-workspace logic)
- New backend: `apps/api/plane/license/api/views/department_bulk_link.py`
- URL config: `apps/api/plane/license/api/urls/department.py`
- Frontend page: `apps/admin/app/(all)/(dashboard)/departments/page.tsx`
- New modal: `apps/admin/app/(all)/(dashboard)/departments/components/bulk-link-modal.tsx`
- Store: `apps/admin/store/instance-department.store.ts`
- Service: `packages/services/src/department/instance-department.service.ts`
