---
title: "Bulk Assign Workspace Members via Excel"
description: "Add god-mode button to bulk-add users to workspaces from an Excel file"
status: complete
priority: P2
effort: 4h
branch: triho
tags: [admin, god-mode, bulk, workspace, excel]
created: 2026-03-04
---

# Bulk Assign Workspace Members via Excel

## Overview

Add "Bulk Assign Workspace" button on god-mode `/workspace/` page. Admin uploads `.xlsx`/`.xls` → frontend parses with `xlsx` (SheetJS) → preview rows → POST JSON to new backend endpoint → show results.

## Architecture Decision

- Frontend parses Excel (same pattern as bulk-import) → sends JSON array to backend
- Backend validates each row, creates `WorkspaceMember` records atomically
- No DB migrations — `WorkspaceMember` model already exists
- No new shared packages — extend existing `InstanceWorkspaceService`

## Phases

| #   | Phase                                                              | Status   | Est. |
| --- | ------------------------------------------------------------------ | -------- | ---- |
| 01  | [Backend: Bulk Assign Members Endpoint](./phase-01-backend-api.md) | complete | 1.5h |
| 02  | [Frontend: Excel Assign UI](./phase-02-frontend-ui.md)             | complete | 2.5h |

## Key Files

**Backend:**

- `apps/api/plane/license/api/views/workspace_member_bulk_assign.py` ← CREATE
- `apps/api/plane/license/api/views/__init__.py` ← modify (add export)
- `apps/api/plane/license/urls.py` ← modify (add URL)

**Frontend (apps/admin):**

- `apps/admin/app/(all)/(dashboard)/workspace/bulk-assign/page.tsx` ← CREATE
- `apps/admin/components/workspace/workspace-bulk-assign-form.tsx` ← CREATE
- `apps/admin/components/workspace/workspace-bulk-assign-preview.tsx` ← CREATE
- `apps/admin/components/workspace/workspace-bulk-assign-results.tsx` ← CREATE
- `apps/admin/store/workspace.store.ts` ← modify (add bulkAssignMembers action)
- `packages/services/src/workspace/instance-workspace.service.ts` ← modify (add method + type)
- `apps/admin/app/(all)/(dashboard)/workspace/page.tsx` ← modify (add button)

## Dependencies

Phase 02 blocked by Phase 01 (API URL must be confirmed first).

## Validation Log

### Session 1 — 2026-03-04

**Trigger:** Initial plan creation validation
**Questions asked:** 4

#### Questions & Answers

1. **[Assumptions]** The plan found a critical discrepancy: the design spec says Member role = 10, but the actual DB model `ROLE_CHOICES` defines Member = 15. Which value should the implementation use?
   - Options: Use 15 (Recommended) | Use 10
   - **Answer:** Use 15 (Recommended)
   - **Rationale:** Backend `VALID_ROLES = {5, 15, 20}` and frontend `ROLE_MAP = {member: 15}` are consistent. Any other value would fail DB constraints.

2. **[Architecture]** When an email in the Excel file doesn't match any existing user, what should the backend do?
   - Options: Skip with reason (Recommended) | Auto-invite the user | Return as error, abort batch
   - **Answer:** Skip with reason (Recommended)
   - **Rationale:** Keeps implementation simple; admin is responsible for ensuring users exist. No invitation flow complexity needed.

3. **[Architecture]** When a user is already an active member of the specified workspace, what should happen?
   - Options: Skip with reason (Recommended) | Update their role
   - **Answer:** Skip with reason (Recommended)
   - **Rationale:** Idempotent behavior prevents accidental role downgrades; safe for re-runs of the same Excel file.

4. **[Scope]** The plan implements Bulk Assign as a new page at /workspace/bulk-assign (mirroring bulk-import). Is this the right UX pattern?
   - Options: New page (Recommended) | Modal dialog
   - **Answer:** New page (Recommended)
   - **Rationale:** Consistent with existing Bulk Import pattern; no modal state complexity needed.

#### Confirmed Decisions

- Role value for Member: **15** (matches DB model, not spec typo of 10)
- User not found: **skip** with reason (no auto-invite)
- Already member: **skip** with reason (no role update)
- UX pattern: **new page** at `/workspace/bulk-assign`

#### Action Items

- [x] No plan changes needed — all decisions already reflected in phase files

#### Impact on Phases

- No phase file updates required — all confirmed decisions already match plan content.
