# Calendar Click-to-Create Plan

## Goal

Allow users to click empty space in a calendar day tile (month/week views) to open `CreateUpdateIssueModal` pre-populated with the clicked date.

## Current State

- Profile "assigned"/"created" calendar uses `ProfileIssuesCalendarLayout` → `BaseCalendarRoot` → `CalendarChart`
- Profile store has `enableQuickAdd = false` and `quickAddIssue = undefined`, so inline quick-add never renders
- `CreateUpdateIssueModal` supports pre-populated `data` (e.g. `target_date` / `planned_at`) and works without a `projectId`
- Clicking a day tile currently does nothing (desktop) or selects the date for mobile issue list

## Design Decisions

| Decision    | Choice                                                                    |
| ----------- | ------------------------------------------------------------------------- |
| Interaction | Click empty space in day tile content area (desktop only)                 |
| Modal       | Full `CreateUpdateIssueModal`, pre-populated with date                    |
| Date field  | `planned_at` for profile calendar, `target_date` for project/cycle/module |
| Scope       | Month + week layouts; hours layout excluded for now                       |
| Mobile      | No change; mobile tap still selects date                                  |
| Gating      | Only when `enableIssueCreation && !readOnly && !disableIssueCreation`     |

## Files to Modify

### 1. `apps/web/core/components/issues/issue-layouts/calendar/issue-block-root.tsx`

- Add `onClick={(e) => e.stopPropagation()}` to the outer wrapper `<div>` (line 88)
- Prevents day-tile click from firing when clicking existing issues (which open peek overview via `ControlLink`)

### 2. `apps/web/core/components/issues/issue-layouts/calendar/issue-blocks.tsx`

- Add `onClick={(e) => e.stopPropagation()}` to the quick-add actions wrapper `<div>` (line 129)
- Prevents day-tile click from firing when clicking the quick-add button

### 3. `apps/web/core/components/issues/issue-layouts/calendar/day-tile.tsx`

- Add `onDayClick?: (date: Date) => void` to `Props`
- Add `onClick` handler to the desktop content area `<div>` (line 178-185)
- Handler calls `onDayClick(date.date)` only when `!readOnly && !disableIssueCreation && enableIssueCreation`
- Pass `onDayClick` from props down to the content div

### 4. `apps/web/core/components/issues/issue-layouts/calendar/week-days.tsx`

- Add `onDayClick?: (date: Date) => void` to `Props`
- Pass `onDayClick` to each `CalendarDayTile`

### 5. `apps/web/core/components/issues/issue-layouts/calendar/calendar.tsx`

- Add state: `const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)` and `const [createModalDate, setCreateModalDate] = useState<Date | null>(null)`
- Derive `enableIssueCreation` from `viewFlags`
- Create `handleDayClick(date: Date)` that sets `createModalDate` and opens modal
- Pass `onDayClick={handleDayClick}` to `CalendarWeekDays` (both month and week instances)
- Render `<CreateUpdateIssueModal>` at the end of the component with:
  - `isOpen={isCreateModalOpen}`
  - `onClose={() => setIsCreateModalOpen(false)}`
  - `data={createModalDate ? (isProfileCalendar ? { planned_at: renderFormattedPayloadDate(createModalDate) } : { target_date: renderFormattedPayloadDate(createModalDate) }) : undefined}`
  - `storeType={storeType}`

## Implementation Notes

- `CalendarChart` already destructures `storeType` and `isProfileCalendar` from props
- `viewFlags` is already extracted via `useIssues(storeType)` in `CalendarChart`
- `renderFormattedPayloadDate` is already imported in `calendar.tsx`
- `CreateUpdateIssueModal` is not currently imported in `calendar.tsx`; needs to be added
- No changes needed in `BaseCalendarRoot` or `ProfileIssuesCalendarLayout`

## Edge Cases

- **Subscribed view**: `enableIssueCreation = false` in profile store → click handler gated, modal never opens
- **Occupied day**: Quick-add button and issue blocks still work; click on empty space opens modal
- **No projectId (profile)**: Modal shows project selector automatically
- **Past/future dates**: Modal pre-populates correctly regardless of date
- **Hours layout**: Not modified; hours grid doesn't use `CalendarDayTile`

## Validation

1. Navigate to `/workspace/{slug}/profile/{userId}/assigned` with calendar layout
2. Click empty space in any day tile → modal opens with date pre-populated in `planned_at`
3. Create issue → appears on that date in calendar
4. Click existing issue → peek overview opens, modal does NOT open
5. Switch to "subscribed" view → clicking day tiles does nothing
6. Verify project/cycle/module calendars also open modal with `target_date` pre-populated
