# Phase 2: Badge Component

## Context

- Plan: `plans/260316-0957-progress-tracking/plan.md`
- Phase 2 of 3
- Depends on: Phase 1 (constants registered)

## Overview

Create a reusable `ProgressTrackingBadge` component for rendering progress status in list/kanban card views. Extract shared status logic from the existing spreadsheet column.

## Key Insights

- `SpreadsheetProgressTrackingColumn` (`apps/web/ce/components/issues/spreadsheet/columns/progress-tracking-column.tsx`) already has `getProgressStatus()` logic
- List/kanban properties use `h-5` height containers with `rounded-sm border-[0.5px] border-strong px-2.5 py-1` styling (see `all-properties.tsx` sub-issues/attachments pattern)
- Badge should return `null` when no `target_date` (no badge shown per spec)
- Badge colors per spec:
  - `duedate < today` -> "Off Track" (red)
  - `duedate = today` -> "Due Today" (red)
  - `duedate = today + 1` -> "At Risk" (amber/orange)
  - `duedate > today + 1` -> "On Track" (green)
- Existing spreadsheet column uses `text-status-red`, `text-status-amber`, `text-status-green` classes

## Requirements

1. Create `ProgressTrackingBadge` component in CE directory
2. Pure component: takes `targetDate: string | null`, returns badge or null
3. Extract `getProgressStatus` to a shared utility for DRY with spreadsheet column
4. Badge styling matches existing property badge pattern (h-5, border, rounded)
5. Background tint for badge (light red/amber/green) per spec

## Architecture

```
apps/web/ce/components/issues/issue-layouts/progress-tracking-badge.tsx  (NEW)
  - ProgressTrackingBadge component
  - getProgressStatus utility (exported)

apps/web/ce/components/issues/spreadsheet/columns/progress-tracking-column.tsx  (MODIFY)
  - Import getProgressStatus from badge module instead of defining locally
```

### Component Design

```tsx
// progress-tracking-badge.tsx

export type TProgressStatus = "off_track" | "due_today" | "at_risk" | "on_track";

export function getProgressStatus(targetDate: string | null): { label: string; status: TProgressStatus } | null;

export function ProgressTrackingBadge({ targetDate }: { targetDate: string | null }): JSX.Element | null;
```

### Badge Styling

Follow existing property badge pattern from `all-properties.tsx`:

```
flex h-5 flex-shrink-0 items-center gap-1 overflow-hidden rounded-sm border-[0.5px] px-2.5 py-1
```

Color variants — use design system tokens to match spreadsheet column and dark mode:

- Off Track: `text-status-red` + investigate `bg-status-red` (fallback: `bg-red-100/60 border-red-200`)
- Due Today: `text-status-red` + same background as Off Track
- At Risk: `text-status-amber` + investigate `bg-status-amber` (fallback: `bg-amber-100/60 border-amber-200`)
- On Track: `text-status-green` + investigate `bg-status-green` (fallback: `bg-green-100/60 border-green-200`)

<!-- Updated: Validation Session 1 - use text-status-* design tokens, investigate bg-status-* for backgrounds -->

## Related Code Files

| File                                                                             | Role                                |
| -------------------------------------------------------------------------------- | ----------------------------------- |
| `apps/web/ce/components/issues/spreadsheet/columns/progress-tracking-column.tsx` | Existing progress logic to extract  |
| `apps/web/core/components/issues/issue-layouts/properties/all-properties.tsx`    | Pattern reference for badge styling |
| `apps/web/ce/components/issues/issue-layouts/additional-properties.tsx`          | Current CE additional properties    |
| `packages/i18n/src/locales/en/translations.ts`                                   | i18n translations                   |

## Implementation Steps

1. Create `apps/web/ce/components/issues/issue-layouts/progress-tracking-badge.tsx`
   - Define `getProgressStatus(targetDate)` exported function
   - Define `ProgressTrackingBadge` component with Tooltip wrapping
   - Return `null` when targetDate is null
   - Use `text-caption-sm-regular` for text sizing (matches existing badges)
2. Update `apps/web/ce/components/issues/spreadsheet/columns/progress-tracking-column.tsx`
   - Import `getProgressStatus` from `../../issue-layouts/progress-tracking-badge`
   - Remove local `getProgressStatus` and `TProgressStatus`
3. Run `pnpm check:lint`
4. Verify no import cycles

## Todo

- [x] Create progress-tracking-badge.tsx with getProgressStatus + ProgressTrackingBadge
- [x] Refactor spreadsheet column to use shared getProgressStatus
- [x] Verify file < 200 lines, component < 150 lines
- [x] Lint check passes

## Success Criteria

- `ProgressTrackingBadge` renders correct badge for each status
- Returns null for no target_date
- Spreadsheet column still works correctly after refactor
- No duplicate logic (DRY)

## Risk Assessment

- **Low**: Pure presentational component, no state management
- **Low**: Refactoring spreadsheet column import path - simple change
- Verify Tailwind v4 color tokens work correctly (may need to check design system)

## Security Considerations

None - purely presentational, no user input handling.

## Next Steps

Phase 3: Integrate badge into list/kanban views via additional-properties.tsx.
