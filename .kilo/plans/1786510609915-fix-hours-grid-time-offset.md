# Fix Hours Grid Drag-to-Select Time Offset

## Root Cause

`yToHour` in `hours-grid.tsx:183` divides by `HOURS_HALF_ROW_HEIGHT` (28) instead of `HOURS_ROW_HEIGHT` (56), doubling the computed hour. A drag at 10:00 becomes 14:00, exactly matching the reported 4-hour shift (10→14, 11→16).

## Fix

In `apps/web/core/components/issues/issue-layouts/calendar/hours-grid.tsx`, line 183:

```diff
- const raw = Math.round((relativeY / HOURS_HALF_ROW_HEIGHT + HOURS_WORKDAY_START) * 2) / 2;
+ const raw = Math.round((relativeY / HOURS_ROW_HEIGHT + HOURS_WORKDAY_START) * 2) / 2;
```

## Validation

1. Open hours layout, drag from 10:00 to 11:00
2. Save the issue
3. Verify the block renders at 10:00–11:00, not 14:00–16:00
4. Verify 30-min snap still works (e.g., drag to 10:30)
