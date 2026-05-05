---
title: "Replace Inline Creation with Modal Popup for New Work Item"
description: "Comment out inline quick-add row/card creation and open existing CreateUpdateIssueModal instead"
status: pending
priority: P2
effort: 2h
branch: ngoc-feat/workspaces
tags: [workitems, modal, ui, temporary]
created: 2026-03-17
---

# Replace Inline Creation with Modal Popup

## Goal

Temporarily replace inline creation (quick-add row/card) with modal popup when clicking "New work item" across all 5 layouts.

## Approach: Single-Point Modification

The `QuickAddIssueRoot` component (`core/components/issues/issue-layouts/quick-add/root.tsx`) is the **single entry point** for all inline creation across all layouts. Instead of modifying each layout file individually, modify this one component to call `toggleCreateIssueModal(true)` instead of showing inline form.

## Phases

1. **Discovery** (`phase-01-discovery.md`) - map all entry points, verify approach
2. **Implementation** (`phase-02-implementation.md`) - modify QuickAddIssueRoot + calendar special case

## Key Insight

- All 5 layouts (list, kanban, spreadsheet, gantt, calendar) use `<QuickAddIssueRoot>` from `quick-add/root.tsx`
- The existing `CreateUpdateIssueModal` is already mounted globally via `WorkItemLevelModals` in `ce/components/command-palette/modals/work-item-level.tsx`
- Opening modal = calling `toggleCreateIssueModal(true, storeType)` from `useCommandPalette()` hook
- Calendar has a special case: `CalendarQuickAddIssueActions` wraps `QuickAddIssueRoot` with a dropdown menu

## Files to Modify

| File                                                                        | Change                                                                                  |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `core/components/issues/issue-layouts/quick-add/root.tsx`                   | Replace inline form toggle with `toggleCreateIssueModal(true)`, pass `prePopulatedData` |
| `core/components/issues/issue-layouts/calendar/quick-add-issue-actions.tsx` | Update `handleNewIssue` to open modal instead                                           |

## Risk

- `prePopulatedData` (group-by context like state, priority, assignee) currently passed to inline form may not transfer to modal. Need to verify `CreateUpdateIssueModal` accepts `data` prop for pre-population.
- Calendar "Add existing issue" flow is separate and should remain untouched.

## Validation Log

### Session 1 — 2026-03-17

**Trigger:** Initial plan validation before implementation
**Questions asked:** 3

#### Questions & Answers

1. **[Scope]** Pre-populated data (state, priority, assignee from group context) will be lost when opening the modal. Is this acceptable for this temporary change?
   - Options: Skip it | Preserve group context
   - **Answer:** Skip it
   - **Rationale:** Keeps the change minimal and easy to revert. User can manually set fields in modal. Pre-population can be added later if needed via command palette store.

2. **[Architecture]** QuickAddIssueRoot doesn't know the current EIssuesStoreType (PROJECT, CYCLE, MODULE, etc.). toggleCreateIssueModal accepts a storeType param. How should this be handled?
   - Options: Default to PROJECT | Pass storeType as prop
   - **Answer:** Default to PROJECT
   - **Rationale:** Minimizes the number of files changed. Cycle/module context is already handled by header buttons which use the correct storeType.

3. **[Architecture]** How should the original inline form code be handled after replacement?
   - Options: Comment out | Delete entirely
   - **Answer:** Comment out
   - **Rationale:** Preserves original code for easy revert since this is a temporary change.

#### Confirmed Decisions

- Pre-population: skip — acceptable loss for temp change
- Store type: default to PROJECT — no new prop threading needed
- Original code: comment out — preserve for revert

#### Action Items

- [x] Phase 02 already reflects all 3 decisions — no plan changes needed

#### Impact on Phases

- No phase changes required — all decisions already align with phase-02 implementation steps.
