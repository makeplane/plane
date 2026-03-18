---
title: "Rejoin All Departments Button"
description: "Add global Rejoin button to bulk-join all dept managers to linked workspaces and projects"
status: done
priority: P2
effort: 1.5h
branch: triho
tags: [departments, admin, workspace, bulk-action]
created: 2026-03-18
---

# Rejoin All Departments Button

Add a global **Rejoin** button beside "Add Department" on the Departments admin page. Click → mode-selection modal (All Projects / Bank-wide) → bulk operation joining ALL department managers to ALL their linked workspaces + selected project scope.

## Phases

| # | Phase | File(s) | Status | Est. |
|---|-------|---------|--------|------|
| 1 | [Backend Endpoint](./phase-01-backend.md) | `views/department.py`, `urls/department.py` | ✅ done | 30m |
| 2 | [Frontend: Service + Store + UI](./phase-02-frontend.md) | `service.ts`, `store.ts`, `page.tsx`, `rejoin-all-modal.tsx` | ✅ done | 75m |

## Files Changed

1. `apps/api/plane/license/api/views/department.py`
2. `apps/api/plane/license/api/urls/department.py`
3. `packages/services/src/department/instance-department.service.ts`
4. `apps/admin/store/instance-department.store.ts`
5. `apps/admin/app/(all)/(dashboard)/departments/page.tsx`
6. `apps/admin/app/(all)/(dashboard)/departments/components/rejoin-all-modal.tsx` *(new)*

## Key Design Decisions

- **Mode-selection modal** — small modal asking All Projects vs Bank-wide before running (validated)
- **Confirmation** — modal replaces `window.confirm()` for cleaner UX
- **Synchronous backend** — no Celery; admin-only infrequent op (validated)
- **Backend accepts `mode`** — `RejoinAllEndpoint` takes `{ mode }` body param like `autoJoin`
- **Reuse helpers** — `_collect_dept_and_ancestor_managers` + soft-delete-aware upsert patterns
- **Static URL first** — `rejoin-all/` placed before `<uuid:pk>/` dynamic route

## Validation Log

### Session 1 — 2026-03-18
**Trigger:** Initial plan validation
**Questions asked:** 3

#### Questions & Answers

1. **[UX]** The plan uses `window.confirm()` for the Rejoin button confirmation. Is this sufficient or do you want a richer confirmation UI?
   - Options: window.confirm() | Inline confirm buttons | Modal dialog
   - **Answer:** window.confirm() (Recommended)
   - **Rationale:** Overridden by Q2 answer — mode selection requires a modal; `window.confirm()` can't present two options

2. **[Scope]** The Rejoin button will bulk-join managers to ALL projects in each linked workspace (all_projects mode). Should there be a mode selector, or is all_projects always correct for this global action?
   - Options: all_projects hardcoded | bank_wide_projects hardcoded | Ask user via confirm dialog
   - **Answer:** Ask user via confirm dialog
   - **Rationale:** Backend must accept `mode` param; frontend needs a small modal to present the choice (can't use `window.confirm()`)

3. **[Performance]** For large deployments, the rejoin-all operation could be slow. How should the backend handle performance?
   - Options: Synchronous — simple | Async via Celery
   - **Answer:** Synchronous — simple
   - **Rationale:** No changes to backend execution model needed

#### Confirmed Decisions
- Confirmation UX: Small modal with mode selector (All Projects / Bank-wide) + Confirm/Cancel
- Backend: Accepts `mode` param (`all_projects` | `bank_wide_projects`), synchronous
- New file: `rejoin-all-modal.tsx` component needed

#### Action Items
- [ ] Backend: Add `mode` param to `RejoinAllEndpoint.post()`, validate same as `InstanceDepartmentAutoJoinEndpoint`
- [ ] Frontend: Create `rejoin-all-modal.tsx` (small modal, mirrors AutoJoinModal pattern)
- [ ] Frontend: Update `page.tsx` to use modal instead of `window.confirm()`
- [ ] Service: `rejoinAll(mode)` accepts mode param

#### Impact on Phases
- Phase 1 (backend): `RejoinAllEndpoint` must read `mode` from `request.data`, filter projects accordingly
- Phase 2 (frontend): Add new `rejoin-all-modal.tsx` component; update page to open modal on button click
