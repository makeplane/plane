# Phase 05 — Frontend: Analytics Tab Redesign

**Status:** Todo | **Priority:** High | **Effort:** L

## Overview

Replace the existing `TimeTrackingReportPage` (core, chart-based) with a new CE timesheet-like table that:

- Lists all project workitems with worklogs in the selected week
- Logtime per cell = sum of ALL users' logs (aggregated)
- Click on a logtime cell → popover showing per-user breakdown
- Click on issue name → navigate to issue detail
- No editing at all

## Files to Create

- `apps/web/ce/components/time-tracking/analytics/analytics-timesheet-grid.tsx` — main orchestrator
- `apps/web/ce/components/time-tracking/analytics/analytics-timesheet-table.tsx` — table with TanStack
- `apps/web/ce/components/time-tracking/analytics/logtime-breakdown-popover.tsx` — per-user breakdown popover
- `apps/web/ce/components/time-tracking/analytics/index.ts` — barrel export

## Files to Modify

- `apps/web/app/(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/time-tracking/analytics/page.tsx` — swap component
- `apps/web/ce/store/worklog.store.ts` — add `fetchAnalyticsTimesheet` action + `analyticsTimesheetData` observable <!-- Updated: Validation Session 2 - CE store only -->
- `apps/web/ce/services/worklog.service.ts` or CE service — add `getAnalyticsTimesheet` method

## New Types Needed

Add to `packages/types/src/worklog.ts`:

```typescript
export interface IAnalyticsTimesheetRow extends ITimesheetRow {
  by_user: Array<{
    user_id: string;
    display_name: string;
    avatar_url: string;
    days: Record<string, number>; // "YYYY-MM-DD" → minutes
    total_minutes: number;
  }>;
}

export interface IAnalyticsTimesheetResponse {
  week_start: string;
  week_end: string;
  rows: IAnalyticsTimesheetRow[];
  daily_totals: Record<string, number>;
  grand_total_minutes: number;
}
```

Export from `packages/types/src/index.ts`.

## Implementation Steps

### 1. Service method

In `apps/web/core/services/worklog.service.ts` (or CE service):

```typescript
async getAnalyticsTimesheet(
  workspaceSlug: string,
  projectId: string,
  weekStart?: string
): Promise<IAnalyticsTimesheetResponse> {
  const params = weekStart ? { week_start: weekStart } : {};
  return this.get(
    `/api/workspaces/${workspaceSlug}/projects/${projectId}/time-tracking/analytics/timesheet/`,
    { params }
  );
}
```

### 2. Store action

In the worklog store, add:

```typescript
analyticsTimesheetData: IAnalyticsTimesheetResponse | null = null;
isAnalyticsTimesheetLoading = false;

fetchAnalyticsTimesheet = async (workspaceSlug: string, projectId: string, weekStart?: string) => {
  runInAction(() => { this.isAnalyticsTimesheetLoading = true; });
  try {
    const data = await this.worklogService.getAnalyticsTimesheet(workspaceSlug, projectId, weekStart);
    runInAction(() => { this.analyticsTimesheetData = data; });
  } finally {
    runInAction(() => { this.isAnalyticsTimesheetLoading = false; });
  }
};
```

Register in `makeObservable`: `analyticsTimesheetData: observable`, `isAnalyticsTimesheetLoading: observable`, `fetchAnalyticsTimesheet: action`.

### 3. `logtime-breakdown-popover.tsx`

Small popover that lists per-user breakdown for a given cell. Uses `@plane/propel/popover`.

```tsx
import { Popover } from "@plane/propel/popover";
import { Avatar } from "@plane/ui";

interface LogtimeBreakdownPopoverProps {
  totalMinutes: number;
  byUser: Array<{
    user_id: string;
    display_name: string;
    avatar_url: string;
    days: Record<string, number>;
    total_minutes: number;
  }>;
  date: string; // which day column was clicked — filter by_user[n].days[date]
}

export const LogtimeBreakdownPopover: FC<LogtimeBreakdownPopoverProps> = ({ totalMinutes, byUser, date }) => {
  // Only show users who have logs on this specific date
  const usersForDate = byUser
    .map((u) => ({ ...u, minutes: u.days[date] ?? 0 }))
    .filter((u) => u.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes);

  if (totalMinutes === 0) return <span className="text-13 text-tertiary">-</span>;

  return (
    <Popover>
      <Popover.Button className="text-13 font-medium text-primary hover:text-accent-primary transition-colors cursor-pointer">
        {formatMinutes(totalMinutes)}
      </Popover.Button>
      <Popover.Panel className="z-30 w-52 rounded-lg border border-subtle bg-surface-1 shadow-lg p-2">
        <div className="flex flex-col gap-1">
          {usersForDate.map((u) => (
            <div
              key={u.user_id}
              className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md hover:bg-surface-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Avatar name={u.display_name} src={u.avatar_url} size="xs" />
                <span className="text-12 text-primary truncate">{u.display_name}</span>
              </div>
              <span className="text-12 font-medium text-secondary shrink-0">{formatMinutes(u.minutes)}</span>
            </div>
          ))}
        </div>
      </Popover.Panel>
    </Popover>
  );
};
```

### 4. `analytics-timesheet-table.tsx`

Same structure as `timesheet-table.tsx` but:

- Issue column → clickable link to issue
- Day cells → `<LogtimeBreakdownPopover>` (shows total, click for per-user)
- Total column → sum across all users (already in `row.total_minutes`)
- No `onCellSave` prop

```tsx
interface AnalyticsTimesheetTableProps {
  weekStart: string;
  rows: IAnalyticsTimesheetRow[];
  dailyTotals: Record<string, number>;
  grandTotal: number;
  workspaceSlug: string;
  projectId: string;
}

// Day column cell:
cell: (info) => {
  const row = info.row.original;
  const dayTotal = row.days[date] ?? 0;
  return (
    <LogtimeBreakdownPopover
      totalMinutes={dayTotal}
      byUser={row.by_user}
      date={date}
    />
  );
},

// Issue column cell:
cell: (info) => {
  const row = info.row.original;
  return (
    <a href={`/${workspaceSlug}/projects/${row.project_id}/issues/${row.issue_id}`}
       className="flex items-center gap-2 group">
      <span className="text-12 font-mono text-tertiary">{row.issue_identifier}</span>
      <span className="text-13 text-primary truncate group-hover:text-accent-primary transition-colors">
        {row.issue_name}
      </span>
    </a>
  );
},
```

### 5. `analytics-timesheet-grid.tsx`

Mirrors `timesheet-grid.tsx` structure:

- `useEffect` on mount → `fetchAnalyticsTimesheet`
- `TimesheetWeekNavigator` for week nav
- Loading / Error / Empty / Table states
- No Add Issues button
- No Cross Workspaces toggle (analytics is project-scoped by design)

### 6. `index.ts`

```typescript
export { AnalyticsTimesheetGrid } from "./analytics-timesheet-grid";
```

### 7. Update `analytics/page.tsx`

```tsx
// apps/web/app/(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/time-tracking/analytics/page.tsx
import { AnalyticsTimesheetGrid } from "@/plane-web/components/time-tracking/analytics";

export default function AnalyticsPage() {
  const { workspaceSlug, projectId } = useParams();
  return <AnalyticsTimesheetGrid workspaceSlug={workspaceSlug} projectId={projectId} />;
}
```

Check current page file before modifying — it may have `use client` or other directives.

## i18n Keys to Add

```ts
analytics_timesheet_load_error: "Failed to load analytics data.",
analytics_timesheet_no_data: "No time logs found for this week.",
analytics_logtime_breakdown: "Time logged by user",
```

## File Size Check

- `analytics-timesheet-grid.tsx`: ~90 lines ✓
- `analytics-timesheet-table.tsx`: ~140 lines ✓ (reuses `getWeekDates`, `formatMinutes` — extract to shared util if both timesheet files use them)
- `logtime-breakdown-popover.tsx`: ~60 lines ✓

## Shared Utility Consideration

`getWeekDates` and `formatMinutes` appear in both `timesheet-table.tsx` and `analytics-timesheet-table.tsx`. Extract to:
`apps/web/ce/components/time-tracking/utils/time-format.ts`

```typescript
export function formatMinutes(m: number): string { ... }
export function getWeekDates(weekStart: string): string[] { ... }
```

Update both table files to import from this util.

## Success Criteria

- Analytics tab renders a table (not charts) with same visual style as My Timesheet
- Each row shows issue + 7 daily cells + total
- Clicking a day cell that has time → popover lists per-user time on that day
- Clicking issue name → navigates to issue detail
- Empty week → shows empty state message
- `pnpm check:lint` passes
