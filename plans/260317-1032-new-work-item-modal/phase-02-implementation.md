# Phase 02: Implementation - Replace Inline Creation with Modal

## Overview

Comment out inline quick-add form logic in `QuickAddIssueRoot` and calendar quick-add, replacing with `toggleCreateIssueModal()` call. Temporary change -- preserve original code as comments for easy revert.

## Architecture Decision

**Option chosen: Modify `QuickAddIssueRoot` to open global modal (Option 2 from discovery -- skip pre-population for simplicity)**

Rationale: This is temporary. Pre-population is nice-to-have but not critical. Modifying one component covers all 5 layouts. If pre-population is needed later, can add `prePopulatedData` to command palette store.

## Related Code Files

| File                         | Path                                                                                 | Role                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| QuickAddIssueRoot            | `apps/web/core/components/issues/issue-layouts/quick-add/root.tsx`                   | Main target -- replace form toggle with modal open   |
| CalendarQuickAddIssueActions | `apps/web/core/components/issues/issue-layouts/calendar/quick-add-issue-actions.tsx` | Secondary target -- calendar's "New issue" menu item |
| BaseCommandPaletteStore      | `apps/web/core/store/base-command-palette.store.ts`                                  | Reference only -- `toggleCreateIssueModal` signature |
| useCommandPalette            | `apps/web/core/hooks/store/use-command-palette.ts`                                   | Hook to import in modified files                     |

## Implementation Steps

### Step 1: Modify `QuickAddIssueRoot` (quick-add/root.tsx)

**What to change:**

1. Import `useCommandPalette` hook
2. In the component body, get `toggleCreateIssueModal` from the hook
3. Replace `handleIsOpen(true)` calls with `toggleCreateIssueModal(true)`
4. Comment out (not delete) the form rendering block (`isOpen ? <QuickAddIssueFormRoot ... />`)
5. Keep the button rendering -- only change what happens on click
6. Remove unused imports/state that only served inline form (but keep as comments)

**Before (simplified):**

```tsx
// When button clicked:
onClick={() => handleIsOpen(true)}
// When isOpen=true, renders inline form:
{isOpen ? <QuickAddIssueFormRoot ... /> : <QuickAddButton onClick={() => handleIsOpen(true)} />}
```

**After (simplified):**

```tsx
const { toggleCreateIssueModal } = useCommandPalette();
// Always render the button, click opens modal:
{
  QuickAddButton && <QuickAddButton onClick={() => toggleCreateIssueModal(true)} />;
}
// /* TEMPORARY: inline form commented out
// {isOpen ? <QuickAddIssueFormRoot ... /> : ...}
// */
```

**Key detail:** The button components (ListQuickAddIssueButton, KanbanQuickAddIssueButton, etc.) receive `onClick` prop. We just change what `onClick` does -- no changes needed in button components themselves.

### Step 2: Modify `CalendarQuickAddIssueActions` (calendar/quick-add-issue-actions.tsx)

**What to change:**

1. Import `useCommandPalette` hook
2. Replace `handleNewIssue` implementation: instead of `setIsOpen(true)`, call `toggleCreateIssueModal(true)`
3. Comment out the `<QuickAddIssueRoot>` JSX block (no longer needed for calendar new issue)
4. Keep "Add existing issue" flow completely untouched

**Before:**

```tsx
const handleNewIssue = () => {
  setIsOpen(true);
  if (onOpen) onOpen();
};
```

**After:**

```tsx
const { toggleCreateIssueModal } = useCommandPalette();
const handleNewIssue = () => {
  toggleCreateIssueModal(true);
  if (onOpen) onOpen();
};
```

### Step 3: Verify and lint

1. Run `pnpm check:lint` to ensure no errors
2. Grep for unused imports in modified files
3. Verify `CreateUpdateIssueModal` still renders globally (no changes needed -- already mounted in `WorkItemLevelModals`)

## Todo List

- [ ] Modify `quick-add/root.tsx` -- replace form toggle with modal open
- [ ] Modify `calendar/quick-add-issue-actions.tsx` -- replace handleNewIssue
- [ ] Run `pnpm check:lint`
- [ ] Manual test: list layout "New work item" button opens modal
- [ ] Manual test: kanban layout "New work item" button opens modal
- [ ] Manual test: spreadsheet layout "Add work item" button opens modal
- [ ] Manual test: gantt layout "New work item" button opens modal
- [ ] Manual test: calendar layout dropdown "Add work item" opens modal
- [ ] Manual test: calendar "Add existing issue" still works

## Success Criteria

- Clicking any "New work item" / "Add work item" button in any layout opens `CreateUpdateIssueModal`
- No inline form appears anywhere
- Calendar "Add existing issue" still functions normally
- No lint errors
- Original inline code preserved as comments for easy revert

## Risk Assessment

| Risk                                                | Likelihood | Impact | Mitigation                                                                |
| --------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------- |
| Pre-populated data lost (group context)             | Certain    | Low    | Acceptable for temp change. User selects state/priority in modal.         |
| `useCommandPalette` not available in component tree | Very Low   | High   | Hook is used extensively throughout app; `StoreProvider` wraps all routes |
| Calendar "existing issue" flow breaks               | Low        | Medium | Only modifying `handleNewIssue`, not `handleExistingIssue`                |

## Security Considerations

No security impact -- this is a UI-only change redirecting button clicks to an existing modal.

## Next Steps

After implementation, if pre-populated data is needed:

1. Add `createIssuePrePopulatedData: Partial<TIssue>` observable to `BaseCommandPaletteStore`
2. Pass it in `toggleCreateIssueModal` and consume in `WorkItemLevelModals`
3. Forward to `CreateUpdateIssueModal` `data` prop
