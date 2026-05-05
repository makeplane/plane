# Phase 01: Discovery - Map All "New Work Item" Entry Points

## Overview

Identify every location where inline quick-add creation is triggered, and confirm the modal reuse strategy.

## Key Insights

### Architecture: Single Entry Point

All 5 layouts funnel through one component:

- **`QuickAddIssueRoot`** at `core/components/issues/issue-layouts/quick-add/root.tsx`

Each layout passes a layout-specific `QuickAddButton` and `QuickAddIssueForm`, but the orchestration (open/close state, form submission) lives in `QuickAddIssueRoot`.

### Layout-Specific Quick Add Usage

| Layout          | Consumer File                                       | Button Component            | Notes                                                                                  |
| --------------- | --------------------------------------------------- | --------------------------- | -------------------------------------------------------------------------------------- |
| **List**        | `core/.../list/list-group.tsx:354`                  | `ListQuickAddIssueButton`   | Per-group quick add, passes `prePopulatedData` from group-by                           |
| **Kanban**      | `core/.../kanban/kanban-group.tsx:351`              | `KanbanQuickAddIssueButton` | Per-column quick add, passes `prePopulatedData` from group-by + sub-group              |
| **Spreadsheet** | `core/.../spreadsheet/spreadsheet-view.tsx:115`     | `SpreadsheetAddIssueButton` | Single bottom quick add, no `prePopulatedData`                                         |
| **Gantt**       | `core/.../gantt/base-gantt-root.tsx:114`            | `GanttQuickAddIssueButton`  | Single bottom quick add, pre-populates `start_date` + `target_date`                    |
| **Calendar**    | `core/.../calendar/quick-add-issue-actions.tsx:105` | Custom dropdown button      | Special: wraps `QuickAddIssueRoot` with dropdown menu (new vs existing). Per-day tile. |

### Existing Modal Infrastructure

- **Modal component**: `CreateUpdateIssueModal` at `core/components/issues/issue-modal/modal.tsx`
- **Global mount**: `WorkItemLevelModals` at `ce/components/command-palette/modals/work-item-level.tsx`
- **Store action**: `toggleCreateIssueModal(value, storeType, allowedProjectIds)` in `BaseCommandPaletteStore`
- **Hook**: `useCommandPalette()` from `core/hooks/store/use-command-palette.ts`
- **Modal accepts `data` prop**: `data={getCreateIssueModalData()}` -- accepts `Partial<TIssue>` for pre-population

### Header Buttons (Already Using Modal - NO changes needed)

These already call `toggleCreateIssueModal()`:

- `ce/components/issues/header.tsx` (project issues header)
- `app/.../views/(detail)/[viewId]/header.tsx` (view header)
- `app/.../modules/(detail)/header.tsx` (module header)
- `app/.../cycles/(detail)/header.tsx` (cycle header)

## Pre-populated Data Flow

Currently, `QuickAddIssueRoot` receives `prePopulatedData` prop containing group-by context:

- List/Kanban: `{ state_id, priority, label_ids, assignee_ids, cycle_id, module_ids }` based on group
- Gantt: `{ start_date, target_date }`
- Calendar: `{ target_date }` (per day tile)
- Spreadsheet: none

**Challenge**: The global `CreateUpdateIssueModal` via `toggleCreateIssueModal()` does not directly accept `prePopulatedData`. The modal's `data` prop is set in `WorkItemLevelModals.getCreateIssueModalData()` which only handles cycle_id/module_ids.

**Solution options**:

1. Store `prePopulatedData` in command palette store before opening modal (cleanest)
2. Skip pre-population for now (simplest, acceptable for temporary change)
3. Render a local `CreateUpdateIssueModal` instance inside `QuickAddIssueRoot` instead of using global one

## Requirements

- [x] Map all quick-add entry points
- [x] Confirm modal component exists and is globally mounted
- [x] Identify pre-populated data flow gap
- [x] Confirm header buttons already use modal (no changes needed)

## Unresolved Questions

1. **Pre-populated data**: Should we preserve group-context pre-population when opening modal, or is losing it acceptable for this temporary change?
2. **Calendar dropdown**: The "Add existing issue" menu item in calendar should remain functional. Only "New issue" should switch to modal.
3. **Store type**: `QuickAddIssueRoot` doesn't know the current `EIssuesStoreType`. The parent layout roots (cycle-root, module-root, etc.) know this. Need to either pass it down or default to `PROJECT`.
