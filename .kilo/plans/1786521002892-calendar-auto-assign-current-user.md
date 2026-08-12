# Plan: Auto-assign calendar-created issues to current user

## Goal

When a user creates an issue from the calendar view (time-range selection, day click, or drag-to-create), automatically assign it to the current user.

## Root cause

`handleCreateModalSubmit` in `calendar.tsx` only runs for **profile calendar + hours layout**. For all other calendar types, `onSubmit` is `undefined`, so the post-creation callback never fires and the issue is never assigned.

## Changes

**File: `apps/web/core/components/issues/issue-layouts/calendar/calendar.tsx`**

1. **Line 420** — Always pass `handleCreateModalSubmit` as `onSubmit`:

   ```tsx
   onSubmit = { handleCreateModalSubmit };
   ```

2. **Lines 214-235** — Modify `handleCreateModalSubmit` to:
   - Remove the `isProfileCalendar && layout !== "hours"` early-return guard
   - Always assign the created issue to `currentUser.id` when `project_id` is present
   - Keep the existing `handleResizePlan` call for profile calendar + hours layout
   - For profile calendar + non-hours layout, call `handleResizePlan` with `planned_at` derived from `createModalDate`
   - For project/cycle/module calendar + hours layout, call `updateIssue` to set `planned_at` and `planned_duration_minutes`
   - For project/cycle/module calendar + month/week layout, no extra plan update needed (modal pre-fills `target_date`)

### Pseudocode for new `handleCreateModalSubmit`

```tsx
const handleCreateModalSubmit = async (payload: Partial<TIssue>) => {
  try {
    const newIssue = payload as TIssue;
    if (!newIssue?.id) return;

    // 1. Always assign to current user
    if (newIssue.project_id && currentUser?.id) {
      await updateIssue(newIssue.project_id, newIssue.id, {
        assignees: [currentUser.id],
      });
    }

    // 2. Update plan based on calendar type
    if (isProfileCalendar && handleResizePlan) {
      const plannedAt =
        layout === "hours"
          ? createModalPlannedAt
          : createModalDate
            ? renderFormattedPayloadDate(createModalDate)
            : null;
      if (plannedAt) {
        await handleResizePlan(newIssue.id, {
          planned_at: plannedAt,
          planned_duration_minutes: layout === "hours" ? (createModalDuration ?? undefined) : undefined,
        });
      }
    } else if (!isProfileCalendar && layout === "hours" && createModalPlannedAt && newIssue.project_id) {
      await updateIssue(newIssue.project_id, newIssue.id, {
        planned_at: createModalPlannedAt,
        planned_duration_minutes: createModalDuration ?? undefined,
      });
    }
  } catch (error) {
    console.error("Failed to create issue with planned time:", error);
  }
};
```

## Validation

1. Create an issue from a project calendar (month layout) → verify `assignees` includes current user
2. Create an issue from a project calendar (hours layout, time-range select) → verify `assignees` and `planned_at` are set
3. Create an issue from a profile calendar (month layout) → verify `assignees` and `planned_at` are set
4. Create an issue from a profile calendar (hours layout) → verify existing behavior still works (assignee + planned_at + duration)
5. Refresh the page → verify the created issue remains visible in the calendar

## Risks

- `updateIssue` and `handleResizePlan` already handle errors gracefully (toast + catch)
- Backend validates assignee membership; if current user is not a project member, the issue is still created but unassigned
- No new imports required; `updateIssue`, `currentUser`, and `renderFormattedPayloadDate` are already available
