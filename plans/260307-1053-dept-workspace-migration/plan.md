---
title: "Department-Workspace Model Migration"
description: "Migrate Department & Staff from workspace-scoped to instance-level, move admin UI to God-mode, add org chart"
status: completed
priority: P1
effort: 32h
branch: develop
tags: [migration, backend, frontend, god-mode, department, staff]
created: 2026-03-07
---

# Department-Workspace Model Migration

## Summary

Lift Department and StaffProfile models from workspace scope to instance level. Replace `linked_project` with `linked_workspace` (OneToOne). Move CRUD UI from Workspace Settings to God-mode admin. Add read-only Org Chart page in workspace. Rewrite auto-membership logic: project-level to workspace-level.

## Phases

| #   | Phase                                                                  | Effort | Status    |
| --- | ---------------------------------------------------------------------- | ------ | --------- |
| 1   | [DB Model Migration](./phase-01-db-model-migration.md)                 | 4h     | completed |
| 2   | [Backend API Migration](./phase-02-backend-api-migration.md)           | 8h     | completed |
| 3   | [God-mode Frontend](./phase-03-godmode-frontend.md)                    | 8h     | completed |
| 4   | [Cleanup Workspace Settings](./phase-04-cleanup-workspace-settings.md) | 3h     | completed |
| 5   | [Org Chart Workspace Page](./phase-05-org-chart-workspace.md)          | 5h     | completed |
| 6   | [Auto-join Logic & Polish](./phase-06-autojoin-logic-polish.md)        | 4h     | completed |

## Key Dependencies

- Phase 1 must complete before Phase 2 (serializers reference new fields)
- Phase 2 must complete before Phase 3 (frontend needs new API)
- Phase 3 + Phase 4 can run in parallel after Phase 2
- Phase 5 depends on Phase 2 (org chart API)
- Phase 6 depends on Phase 2 (auto-join logic in views)

## Architecture Changes

```
BEFORE:                          AFTER:
Department --FK--> Workspace     Department (instance-level, no workspace FK)
Department --FK--> Project       Department --OneToOne--> Workspace (nullable)
StaffProfile --FK--> Workspace   StaffProfile (instance-level, no workspace FK)
Unique: (workspace, code)        Unique: (code) globally
API: /workspaces/<slug>/dept/    API: /api/instances/departments/
UI: Workspace Settings           UI: God-mode Admin
```

## Risk Summary

- Data migration: existing FK data must be preserved and remapped
- Auto-membership: all project-level logic becomes workspace-level
- Breaking change: old workspace-scoped API endpoints removed
- Frontend: components move between apps (web -> admin)

## Branch Strategy

Feature branch from `develop`, squash merge when all phases pass.

---

## Validation Log

### Session 1 -- 2026-03-07

**Trigger:** Initial plan validation before implementation
**Questions asked:** 4

#### Questions & Answers

1. **[Migration]** Phase 1 data migration: khi remove workspace FK tu Department, cac department hien tai khong co linked_project se linked_workspace = null. Nhung co nen map linked_workspace = department.workspace (giu lien ket workspace cu) khong?
   - Options: linked_workspace = null cho tat ca (Recommended) | linked_workspace = old workspace | Chi dept co linked_project
   - **Answer:** linked_workspace = null cho tat ca
   - **Rationale:** Clean slate -- admin link thu cong sau. Tranh auto-link sai dept vao workspace khong phu hop.

2. **[Architecture]** Phase 6: khi transfer staff, co nen remove WorkspaceMember cua old workspace khong?
   - Options: Chi remove role=15 (Recommended) | Remove tat ca | Khong remove, chi add moi
   - **Answer:** Chi remove role=15
   - **Rationale:** An toan: khong bo admin ra khoi workspace. Chi member binh thuong bi remove khi transfer.

3. **[Scope]** Phase 5: Org chart nen dat o dau trong workspace navigation?
   - Options: Sidebar chinh (ngang hang Projects) | Workspace Settings | Workspace Home/Overview
   - **Answer:** Sidebar chinh (ngang hang Projects)
   - **Rationale:** Org chart la feature chinh, can truy cap nhanh. Dat trong sidebar nhu Projects, Cycles, Issues.

4. **[Architecture]** Phase 2: retroactive join khi link dept->workspace nen dung API flow nao?
   - Options: Two-step (Recommended) | Single-step + frontend confirm | Always auto-join
   - **Answer:** Always auto-join
   - **Rationale:** Don gian hoa flow. Khi link workspace -> tu dong add tat ca staff. Khong can confirm dialog.

#### Confirmed Decisions

- Data migration: linked_workspace = null for all depts (admin links manually)
- Transfer: only remove role=15 members (keep admins safe)
- Org chart: main workspace sidebar (not settings)
- Retroactive join: always auto-join, no confirm dialog needed

#### Action Items

- [x]Phase 1: Simplify RunPython migration -- all linked_workspace = null
- [x]Phase 2: Remove confirm flow from link-workspace endpoint, always auto-join
- [x]Phase 3: Remove confirm dialog component for link-workspace
- [x]Phase 5: Update org chart placement from settings to main sidebar
- [x]Phase 6: Simplify retroactive join -- remove confirm logic, always bulk add

#### Impact on Phases

- Phase 1: Simplify data migration (no linked_project -> linked_workspace mapping needed, all null)
- Phase 2: Simplify link-workspace endpoint (remove requires_confirm / confirm param logic)
- Phase 3: Remove `department-link-workspace.tsx` confirm dialog, simplify to just workspace selector
- Phase 5: Move org chart from settings area to main workspace sidebar (update route path and navigation)
- Phase 6: Remove confirm flow references, simplify Celery task trigger (always fire on link)
