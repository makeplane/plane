# Planner Report: Replace Inline Creation with Modal Popup

**Plan dir**: `plans/260317-1032-new-work-item-modal/`
**Status**: Ready for implementation
**Effort**: ~2h

## Summary

All 5 layouts (list, kanban, spreadsheet, gantt, calendar) route through a single component `QuickAddIssueRoot` for inline creation. The fix requires modifying **2 files**:

1. `apps/web/core/components/issues/issue-layouts/quick-add/root.tsx` -- replace inline form toggle with `toggleCreateIssueModal(true)` from `useCommandPalette()`
2. `apps/web/core/components/issues/issue-layouts/calendar/quick-add-issue-actions.tsx` -- same change for calendar's dropdown "New issue" menu item

The existing `CreateUpdateIssueModal` is already globally mounted via `WorkItemLevelModals`. No new components needed.

Header buttons (project, cycle, module, view headers) already use the modal -- no changes needed there.

## Trade-off

Pre-populated data (state/priority/assignee from group-by context) will be lost when opening modal. Acceptable for temporary change. Can be added later by extending command palette store.

## Unresolved Questions

1. Should pre-populated group context be preserved? (adds complexity to store)
2. What `EIssuesStoreType` should be passed when opening modal from quick-add? Currently quick-add doesn't know the store type. Defaulting to `PROJECT` is safe but won't auto-link to cycle/module.
