# Phase 3: Display Toggle + View Integration

## Context

- Plan: `plans/260316-0957-progress-tracking/plan.md`
- Phase 3 of 3
- Depends on: Phase 1 (constants), Phase 2 (badge component)

## Overview

Render the `ProgressTrackingBadge` in list and kanban views when the `progress_tracking` display property is enabled. The badge appears alongside other properties on work item cards/rows.

## Key Insights

- `all-properties.tsx` renders per-property using `WithDisplayPropertiesHOC`
- At line 487, it renders `<WorkItemLayoutAdditionalProperties>` from CE (`apps/web/ce/components/issues/issue-layouts/additional-properties.tsx`)
- This CE component is the correct place to add progress tracking badge (follows CE pattern)
- `WithDisplayPropertiesHOC` handles show/hide based on `displayProperties.progress_tracking`
- The `WorkItemLayoutAdditionalProperties` receives both `displayProperties` and `issue` props but currently only uses `issue`
- Need to actually use `displayProperties` to conditionally render

## Requirements

1. Modify `additional-properties.tsx` to render `ProgressTrackingBadge` when `displayProperties.progress_tracking` is true
2. Use `WithDisplayPropertiesHOC` with `displayPropertyKey="progress_tracking"` for consistent toggle behavior
3. Badge renders between existing properties and labels (current position in all-properties.tsx)
4. Badge should not render when target_date is null (handled by component itself)

## Architecture

```
apps/web/ce/components/issues/issue-layouts/additional-properties.tsx  (MODIFY)
  - Import WithDisplayPropertiesHOC from core
  - Import ProgressTrackingBadge from ./progress-tracking-badge
  - Render badge wrapped in WithDisplayPropertiesHOC
```

### Render Flow

```
all-properties.tsx
  -> <WithDisplayPropertiesHOC displayPropertyKey="state"> ... </WithDisplayPropertiesHOC>
  -> <WithDisplayPropertiesHOC displayPropertyKey="priority"> ... </WithDisplayPropertiesHOC>
  -> ... other properties ...
  -> <WorkItemLayoutAdditionalProperties>  (CE component)
       -> <WithDisplayPropertiesHOC displayPropertyKey="progress_tracking">
            <ProgressTrackingBadge targetDate={issue.target_date} />
          </WithDisplayPropertiesHOC>
       -> existing completed_at logic
  -> <WithDisplayPropertiesHOC displayPropertyKey="labels"> ... </WithDisplayPropertiesHOC>
```

## Related Code Files

| File                                                                                       | Role                                 |
| ------------------------------------------------------------------------------------------ | ------------------------------------ |
| `apps/web/ce/components/issues/issue-layouts/additional-properties.tsx`                    | CE additional properties - MODIFY    |
| `apps/web/ce/components/issues/issue-layouts/progress-tracking-badge.tsx`                  | Badge component (Phase 2)            |
| `apps/web/core/components/issues/issue-layouts/properties/all-properties.tsx:487`          | Where additional properties rendered |
| `apps/web/core/components/issues/issue-layouts/properties/with-display-properties-HOC.tsx` | HOC for conditional rendering        |

## Implementation Steps

1. Open `apps/web/ce/components/issues/issue-layouts/additional-properties.tsx`
2. Import `WithDisplayPropertiesHOC` from `@/components/issues/issue-layouts/properties/with-display-properties-HOC`
3. Import `ProgressTrackingBadge` from `./progress-tracking-badge`
4. Wrap progress tracking badge in `WithDisplayPropertiesHOC` with `displayPropertyKey="progress_tracking"`
5. Render BEFORE the existing completed_at section (progress tracking is about the due date status, completed_at is about completion)
6. The component now needs to actually use `displayProperties` prop (currently destructured but not used)
7. Run `pnpm check:lint`
8. Manual test: toggle "Progress Tracking" in Display Properties panel -> badge should appear/disappear

### Updated Component Structure

```tsx
export function WorkItemLayoutAdditionalProperties({ displayProperties, issue }: TWorkItemLayoutAdditionalProperties) {
  // ... existing hooks ...

  return (
    <>
      {/* Progress tracking badge */}
      <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="progress_tracking">
        <ProgressTrackingBadge targetDate={issue.target_date} />
      </WithDisplayPropertiesHOC>

      {/* Existing completed_at display (no change) */}
      {stateDetails?.group === "completed" && (
        // ... existing completed_at tooltip ...
      )}
    </>
  );
}
```

## Todo

- [x] Import WithDisplayPropertiesHOC and ProgressTrackingBadge
- [x] Add progress tracking badge rendering with HOC wrapper
- [x] Verify displayProperties is used (not just destructured)
- [x] Lint check passes
- [x] Manual test: list view toggle works
- [x] Manual test: kanban view toggle works
- [x] Manual test: no badge when no due date
- [x] Manual test: correct badge color for each status

## Success Criteria

- Toggle "Progress Tracking" in Display Properties -> badge appears on list rows and kanban cards
- Badge shows correct status based on due date vs today
- No badge when issue has no target_date
- Toggle off -> badge disappears
- Existing completed_at display unaffected
- Spreadsheet view continues to work correctly

## Risk Assessment

- **Low**: `additional-properties.tsx` is a small CE file (39 lines), straightforward modification
- **Low**: `WithDisplayPropertiesHOC` is well-tested pattern used throughout codebase
- **Medium**: Need to verify the component fragment return works correctly with `WithDisplayPropertiesHOC` (current component returns single element or null; need to return fragment)

## Security Considerations

None - purely presentational changes.

## Next Steps

Post-implementation:

1. Run `pnpm check:lint` across affected packages
2. Verify no regressions in spreadsheet view
3. Test edge cases: issues with no due date, completed issues, overdue issues
