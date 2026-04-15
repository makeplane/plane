---
title: "Add View Column to HO Department Table"
description: "Show workspace views as clickable tag links in HO department table"
status: done
priority: P2
effort: 2h
branch: triho
tags: [ho, department, workspace-views, ui]
created: 2026-03-26
---

# Add View Column to HO Department Table

## Overview

Add a "View" column to the Department table in the HO menu (`/[workspace]/ho/`).
Each cell shows all workspace views belonging to the department's linked workspace as clickable tag links that open in a new tab.

## Phases

| #   | Phase                                                               | Status | Est. |
| --- | ------------------------------------------------------------------- | ------ | ---- |
| 1   | [Fetch & render views in department row](./phase-01-view-column.md) | done   | 2h   |

## Files Changed

- `apps/web/ce/components/ho/department-tree-row.tsx` — add View column cell
- `apps/web/ce/components/ho/department-list.tsx` — add View column header

## Validation Log

### Session 1 — 2026-03-26

**Trigger:** Initial plan validation before implementation
**Questions asked:** 3

#### Questions & Answers

1. **[Scope]** The plan fetches ALL workspace views for the linked workspace. Should any filtering be applied?
   - Options: All views | Default views only | Custom views only
   - **Answer:** All views
   - **Rationale:** No filtering needed — show the full view list as-is from the API.

2. **[Architecture]** How should the View column handle a department with many views (e.g. 10+ tags)?
   - Options: Wrap to multiple lines | Truncate with +N more | Horizontal scroll
   - **Answer:** Wrap to multiple lines (flex-wrap)
   - **Rationale:** Simplest approach; all tags remain visible; row height grows naturally.

3. **[Architecture]** Where should the HoDeptViewTags helper component live?
   - Options: Same file (department-tree-row.tsx) | Separate file
   - **Answer:** Same file
   - **Rationale:** Component is small and tightly coupled to the row — no need for a new file.

#### Confirmed Decisions

- View filter: None — show all views
- Layout: flex-wrap (multi-line)
- Component location: inside `department-tree-row.tsx`

#### Technical Questions Resolved (pre-interview)

- View URL: `/{workspaceSlug}/workspace-views/{viewId}` ✅ (confirmed from route dir `[globalViewId]`)
- WorkspaceService import: `@/services/workspace.service` ✅ (used in core stores, accessible from CE)
- Badge subpath: `@plane/propel/badge` ✅ (confirmed in package.json exports)

#### Action Items

- [ ] No plan changes required — all decisions align with existing plan

#### Impact on Phases

- Phase 1: No changes needed — plan already reflects confirmed decisions
