# Hours Grid Drag-to-Select Time Plan

## Goal

Allow users to click-and-drag on empty space in the hours grid to select a time range, then open `CreateUpdateIssueModal` pre-populated with `planned_at` and `planned_duration_minutes`.

## Current State

- `CalendarDayColumn` has an `onClick` that opens the modal with just the date (`onDayClick(date)`).
- `HoursIssueBlock` outer wrapper already has `onClick={(e) => e.stopPropagation()}` — clicks on existing issues still open peek overview.
- Grid snap constants exist: `HOURS_ROW_HEIGHT = 56`, `HOURS_HALF_ROW_HEIGHT = 28`, `HOURS_SNAP_MINUTES = 30`, `HOURS_MIN_DURATION_MINUTES = 30`.

## Design Decisions

| Decision             | Choice                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Gesture              | mousedown + mousemove + mouseup on `CalendarDayColumn` empty space                                                  |
| Threshold            | Start selection after drag > 5px to distinguish from click                                                          |
| Snap                 | 30-minute increments (`HOURS_HALF_ROW_HEIGHT`)                                                                      |
| Min selection        | 30 minutes (one half-row)                                                                                           |
| Touch                | `touchstart`/`touchmove`/`touchend` alongside mouse events                                                          |
| Overlay              | Absolute div with `bg-accent-primary/20`, `border-t/b border-accent-primary`, `z-[2] pointer-events-none`           |
| Conflicts            | Issue blocks stop propagation; drop bands are `dropTargetForElements` only (not draggable initiators) — no conflict |
| Short click fallback | If drag < threshold, call existing `onDayClick(date)`                                                               |
| Modal data           | `planned_at` via `buildPlannedAtForDrop`, `planned_duration_minutes` from selection                                 |

## Files to Modify

### 1. `apps/web/core/components/issues/issue-layouts/calendar/hours-grid.tsx`

**`CalendarDayColumn` props**

- Add `onTimeRangeSelect?: (date: Date, startHour: number, endHour: number) => void`

**State in `CalendarDayColumn`**

- `isSelecting: boolean`
- `selectionStartY: number`
- `selectionEndY: number`
- Refs: `columnRef`, `dragStartY`, `hasMoved`, `startSelectionOnMove`

**Events on column outer div**

- `onMouseDown`: if `canCreate` and not on issue block, record `dragStartY` (clientY), `selectionStartY`, `selectionEndY`, `hasMoved = false`, `startSelectionOnMove = true`. Call `e.preventDefault()` to suppress native drag.
- `onMouseMove` (on column): if `startSelectionOnMove` and `|clientY - dragStartY| > 5`, set `isSelecting = true`, `startSelectionOnMove = false`. If selecting, update `selectionEndY`.
- `onMouseUp` (on column): if `isSelecting`, compute snapped hours, call `onTimeRangeSelect(date, startHour, endHour)`, reset state. Else if `!hasMoved`, call `onDayClick(date)`. Always reset refs.
- `onTouchStart`/`onTouchMove`/`onTouchEnd`: same logic using `e.touches[0].clientY`.

**Helper functions**

- `getClientY(e)`: extract `clientY` from mouse or touch event.
- `yToHour(y)`: `Math.round((y / HOURS_HALF_ROW_HEIGHT + HOURS_WORKDAY_START) * 2) / 2`, clamped to `[HOURS_WORKDAY_START, HOURS_WORKDAY_END + 0.5]`.

**Selection overlay**

- Render inside column, between drop bands (`z-[1]`) and issue blocks (`z-[2]`):
  ```tsx
  {
    isSelecting && (
      <div
        className="absolute left-0 right-0 bg-accent-primary/20 border-t border-b border-accent-primary pointer-events-none"
        style={{
          top: Math.min(selectionStartY, selectionEndY),
          height: Math.abs(selectionEndY - selectionStartY),
          zIndex: 2,
        }}
      />
    );
  }
  ```

**`CalendarHoursGrid` props**

- Add `onTimeRangeSelect?: (date: Date, startHour: number, endHour: number) => void`
- Pass `date`, `onTimeRangeSelect` to each `CalendarDayColumn`

### 2. `apps/web/core/components/issues/issue-layouts/calendar/calendar.tsx`

**New handler**

```tsx
const handleTimeRangeSelect = (date: Date, startHour: number, endHour: number) => {
  const dateString = renderFormattedPayloadDate(date);
  if (!dateString) return;
  const plannedAt = buildPlannedAtForDrop(dateString, null, startHour);
  const durationMinutes = Math.max((endHour - startHour) * 60, HOURS_MIN_DURATION_MINUTES);
  setCreateModalDate(date);
  setCreateModalDuration(durationMinutes);
  setIsCreateModalOpen(true);
};
```

**New state**

- `const [createModalDuration, setCreateModalDuration] = useState<number | null>(null);`

**Modal data**

```tsx
data={
  createModalDate
    ? isProfileCalendar
      ? { planned_at: renderFormattedPayloadDate(createModalDate), planned_duration_minutes: createModalDuration ?? undefined }
      : { planned_at: renderFormattedPayloadDate(createModalDate), planned_duration_minutes: createModalDuration ?? undefined }
    : undefined
}
```

Note: Hours layout always uses `planned_at` + `planned_duration_minutes` regardless of profile vs project, because duration only makes sense with `planned_at`.

**Pass to `CalendarHoursGrid`**

- `onTimeRangeSelect={handleTimeRangeSelect}`

### 3. No changes needed in `hours-issue-block.tsx`

- Already has `onClick={(e) => e.stopPropagation()}` on the outer wrapper.
- Issue blocks will not trigger column drag selection.

## Validation

1. Navigate to hours layout.
2. Click empty space → modal opens with date pre-populated (existing behavior preserved).
3. Click and drag vertically across time slots → colored selection overlay appears, snapped to 30-min boundaries.
4. Release mouse → modal opens with `planned_at` set to selection start time and `planned_duration_minutes` set to selection duration.
5. Click and drag less than 5px → treated as click, modal opens with default time.
6. Click existing issue block → peek overview opens, no selection overlay, no modal.
7. Drag selection upward → start/end hours normalized so start < end.
