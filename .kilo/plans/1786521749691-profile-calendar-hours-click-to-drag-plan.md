# Plan: Require time-slot drag to open "create new work item" in profile calendar Hours layout

## Goal

In the assigned (profile) calendar, only **Hours** layout should open the "create new work item" modal via a dragged time slot. A plain click must **not** open it. Month/Week layouts and non-profile calendars are unchanged.

## Confirmed scope

- Target: profile calendar only (`isProfileCalendar === true`) and `layout === "hours"`.
- Month/Week layouts keep click-to-open (no time-slot dragging mechanism exists there).
- Non-profile calendars (project/cycle/module/project-view/team) keep click-to-open in Hours.

## Root cause

`apps/web/core/components/issues/issue-layouts/calendar/calendar.tsx:196` `handleDayClick` opens the modal on a plain day click. It is wired into the Hours grid at `calendar.tsx:328`:

```jsx
<CalendarHoursGrid
  ...
  onDayClick={handleDayClick}
  onTimeRangeSelect={handleTimeRangeSelect}
  ...
/>
```

In `hours-grid.tsx`, `CalendarDayColumn.handleDragEnd` (`hours-grid.tsx:228-241`) calls `onDayClick(date)` on a non-moving click. Drag (time-range select) calls `onTimeRangeSelect`. So suppressing `onDayClick` for the profile Hours grid disables click-to-open while keeping drag-to-open.

## Change

Single edit in `calendar.tsx`, render of `CalendarHoursGrid` (lines 316-333). Pass `onDayClick` only when not the profile calendar:

```jsx
onDayClick={isProfileCalendar ? undefined : handleDayClick}
```

No other files need source changes. `handleTimeRangeSelect` (which sets `createModalDate`, `createModalDuration`, `createModalPlannedAt`, and opens the modal with `{ planned_at, planned_duration_minutes }`) is untouched and already gated to profile + hours (`calendar.tsx:215`).

## Why this is safe

- `CalendarDayColumn.handleDragEnd`: with `onDayClick` undefined, the `else if (!hasMoved.current && !isSelecting && onDayClick)` branch (`hours-grid.tsx:235`) is skipped — plain click does nothing for profile Hours.
- Drag still fires `onTimeRangeSelect` when `isSelecting && onTimeRangeSelect` is truthy (`hours-grid.tsx:229`).
- `handleDragStart` (`hours-grid.tsx:194`) is gated by `canCreate = !readOnly && !disableIssueCreation && enableIssueCreation`, so time-slot drag still respects edit permissions for profile Hours.
- Touch path (`onTouchEnd`) flows through the same `handleDragEnd`, so touch-drag still works; touch-tap no longer opens the modal for profile Hours.

## Data flow (profile Hours, after change)

- Drag a time slot → `handleDragEnd` → `onTimeRangeSelect(date, startHour, endHour)` → `handleTimeRangeSelect` → opens modal with `planned_at` + `planned_duration_minutes`. ✓
- Plain click → `onDayClick` undefined → no modal. ✓
- Profile Months/Week → `onDayClick={handleDayClick}` retained → click still opens modal with `{ planned_at }`. ✓
- Non-profile Hours → `onDayClick={handleDayClick}` retained → click still opens modal with `{ target_date }`. ✓

## Validation

- No existing unit tests cover these calendar components (none in `apps/web/core/components/issues/issue-layouts/calendar/`).
- Manual checks:
  - Profile assigned calendar, Hours layout: click empty time slot → modal does NOT open; drag a time range → modal opens prefilled with the selected time/duration.
  - Profile assigned calendar, Month/Week layout: click day → modal still opens.
  - Project/cycle calendar, Hours layout: click day → modal still opens (regression check).
- Commands: `pnpm --filter=web check:types` and `pnpm check:lint` (OxLint) to confirm no type/lint regressions.

## Risks

- Minimal: one conditional prop. No API surface removed (`onDayClick` remains on `CalendarHoursGrid`/`CalendarDayColumn` for non-profile use).
- UX: profile Hours users lose the click-to-open shortcut; they must drag. Acceptable per requirement.
