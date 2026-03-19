---
title: "Export Workspace Linked Button"
description: "Add Export Workspace Linked button beside Bulk Linked to download dept-workspace mapping as XLSX"
status: complete
priority: P2
effort: 30m
branch: triho
tags: [frontend, department, export, xlsx]
created: 2026-03-19
---

# Export Workspace Linked

## Overview

Add an "Export Workspace Linked" button beside the existing "Bulk Linked" button on the Department List page. Exports `workspace_slug` + `department_code` for all departments with a linked workspace, as an XLSX file.

**Approach**: Pure frontend — `xlsx` v0.18.5 already installed, department data (incl. `linked_workspace_detail.slug`) already in MobX store via `fetchTree`. No backend changes needed.

## Phases

| # | Phase | Status | File |
|---|-------|--------|------|
| 1 | Store action + Page button | pending | [phase-01](./phase-01-store-and-button.md) |

## Files Touched

- `apps/admin/store/instance-department.store.ts`
- `apps/admin/app/(all)/(dashboard)/departments/page.tsx`

## Validation Log

### Session 1 — 2026-03-19
**Trigger:** Initial plan creation
**Questions asked:** 3

#### Questions & Answers

1. **[Assumptions]** The IInstanceDepartment type has two code fields. Which one should map to "department_code" in the export?
   - Options: `code` (Recommended) | `dept_code` | Both columns
   - **Answer:** `code` — the unique dept identifier, same field used in Bulk Linked import/export
   - **Rationale:** `code` is the canonical identifier for bulk-link operations; using it makes the export directly usable as a Bulk Linked input template.

2. **[Architecture]** Should the export use data already in the MobX store or fetch fresh data from the backend?
   - Options: Store data (Recommended) | Fresh fetch
   - **Answer:** Store data — use tree already loaded on mount, no extra request
   - **Rationale:** Keeps implementation minimal; data is fresh enough for export use case.

3. **[Scope]** Which departments should be included in the export?
   - Options: All linked (Recommended) | Top-level linked only
   - **Answer:** All linked — flatten tree recursively, include any dept at any level with a linked workspace
   - **Rationale:** Matches real-world need; child depts can have their own linked workspaces.

#### Confirmed Decisions
- `department_code` column = `code` field (not `dept_code`)
- Data source = MobX store `this.tree` (no extra fetch)
- Scope = all levels recursively flattened, filter `linked_workspace_detail !== null`

#### Action Items
- [x] No plan changes required — all recommended options confirmed
