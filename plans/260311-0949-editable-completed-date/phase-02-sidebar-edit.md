# Phase 02: Frontend - Editable Sidebar DateDropdown

## Context

- Plan: [plan.md](./plan.md)
- Depends on: [Phase 01](./phase-01-backend.md) (backend must preserve manual edits)
- Component: `apps/web/ce/components/issues/issue-details/sidebar/completed-at-property.tsx`
- Reference: Due date pattern in `apps/web/core/components/issues/issue-detail/sidebar.tsx` (lines 167-191)

## Overview

Replace read-only text display with `DateDropdown` in the existing `CompletedAtProperty` CE component. Same component is used by both sidebar and peek-overview, so this change covers both.

## Key Insights

1. `CompletedAtProperty` already receives `issueId` and looks up the issue internally
2. Needs `issueOperations` and `isEditable` props to match sidebar pattern
3. Due date uses `DateDropdown` from `@/components/dropdowns/date` with `renderFormattedPayloadDate`
4. `completed_at` is `DateTimeField` but `DateDropdown` only picks dates -- will send date string, backend stores as datetime
5. The component handles its own visibility (returns null if state != completed)

<!-- Updated: Validation Session 1 - Use date+time picker instead of DateDropdown -->

## Requirements

- Show date+time picker when `state.group === 'completed'` and `isEditable`
- On date+time change: call `issueOperations.update(...)` with `{ completed_at: isoString }`
- Show read-only text when `!isEditable`
- Clear button should NOT be shown (completed_at shouldn't be null when state is completed)
- No existing date+time picker component — build a custom dropdown: `DateDropdown` for date part + `<input type="time">` for time part, combined in a popover

## Architecture

<!-- Updated: Validation Session 2 - Self-contained component; NO core/ call site changes -->

`CompletedAtProperty` must be **self-contained** — resolve all dependencies internally via store hooks. The core/ call sites (`sidebar.tsx` line 193, `peek-overview/properties.tsx` line 192) remain **unchanged** (`<CompletedAtProperty issueId={issueId} />`).

**Internal resolution pattern (confirmed Session 3):**

```tsx
// Inside CompletedAtProperty — confirmed hook patterns
const { workspaceSlug, projectId } = useParams();
const { getIssueById, updateIssue } = useIssueDetail();
const issue = getIssueById(issueId);
const { canEditProperties } = useUserPermissions(projectId);
const isEditable = canEditProperties;
```

<!-- Updated: Validation Session 3 - Use useIssueDetail() + useUserPermissions(projectId) -->

## Related Code Files

| File                                                                                    | Purpose                                          |
| --------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `apps/web/ce/components/issues/issue-details/sidebar/completed-at-property.tsx`         | CE component to modify (self-contained)          |
| `apps/web/ce/components/issues/issue-details/sidebar/completed-at-date-time-picker.tsx` | New: date+time picker component                  |
| `apps/web/core/components/dropdowns/date.tsx`                                           | DateDropdown component (reuse inside new picker) |
| `apps/web/core/components/issues/issue-detail/sidebar.tsx`                              | Call site — **DO NOT MODIFY**                    |
| `apps/web/core/components/issues/peek-overview/properties.tsx`                          | Call site — **DO NOT MODIFY**                    |

## Implementation Steps

### Step 1: Make CompletedAtProperty self-contained

File: `apps/web/ce/components/issues/issue-details/sidebar/completed-at-property.tsx`

**Props stay minimal** (no new props added):

```typescript
type TCompletedAtPropertyProps = {
  issueId: string;
  // Keep existing signature — core/ call sites remain unchanged
};
```

**Internal resolution** (look at other CE sidebar properties for the exact hooks to use):

- `workspaceSlug` / `projectId` — from router params or issue store
- `issueOperations` — from `useIssueOperations()` hook or equivalent
- `isEditable` — from member role store or `useUserPermissions()`

**New render:** Replace `<span>` with date+time picker:

```tsx
<SidebarPropertyListItem icon={DueDatePropertyIcon} label={t("common.completed_at")}>
  <CompletedAtDateTimePicker
    value={issue.completed_at}
    onChange={(isoString) =>
      void issueOperations.update(workspaceSlug, projectId, issueId, {
        completed_at: isoString,
      })
    }
    disabled={!isEditable}
  />
</SidebarPropertyListItem>
```

### Step 2: Create completed-at-date-time-picker.tsx

File: `apps/web/ce/components/issues/issue-details/sidebar/completed-at-date-time-picker.tsx`

- Trigger button: shows formatted date + time (or placeholder)
- Popover content: `DateDropdown` (date part) + `<input type="time">` (time part)
- On confirm: combine date + time → ISO string → call `onChange`

### Step 3: DO NOT touch call sites in core/

`apps/web/core/components/issues/issue-detail/sidebar.tsx` — **no changes**
`apps/web/core/components/issues/peek-overview/properties.tsx` — **no changes**

## Todo

- [x] Update `CompletedAtProperty` to use `useIssueDetail()` + `useUserPermissions(projectId)` internally
- [x] Create `completed-at-date-time-picker.tsx` (date + time combined popover)
- [x] Replace read-only text with `CompletedAtDateTimePicker` in `CompletedAtProperty`
- [x] Run `pnpm check:lint` to verify no lint errors
- [x] Manual test: pick a date+time on completed issue, verify API call, verify persistence

## Success Criteria

- DateDropdown appears for completed issues in sidebar
- Date selection triggers PATCH with `completed_at` value
- Dropdown disabled when `!isEditable`
- Non-completed issues show nothing (existing null return)
- No regressions on due_date or other sidebar properties

## Risk Assessment

| Risk                                                            | Impact                                                 | Mitigation                                                          |
| --------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------- |
| core/ files modified (call sites)                               | Low -- only adding props to existing CE component call | CE component itself stays in `ce/`                                  |
| DateDropdown sends date-only, field expects datetime            | Low                                                    | Django `DateTimeField` accepts date strings, stores as midnight UTC |
| Optimistic fallback `new Date().toISOString()` no longer needed | Low                                                    | DateDropdown handles null value display natively                    |
