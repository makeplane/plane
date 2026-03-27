# Phase 07 — Frontend: Cross Workspaces Feature

**Status:** Todo | **Priority:** Medium | **Effort:** M
**Depends on:** Phase 03 (backend endpoints), Phase 04 (timesheet toggle wire-up), Phase 06 (capacity toggle)

## Overview

Complete the "Cross Workspaces" toggle for My Timesheet and Capacity tabs:

- Store actions to call cross-workspace backend endpoints
- Service methods for the 2 new endpoints
- Timesheet table: show `workspace_name` column when cross-workspace is active
- Capacity dashboard: toggle to show all workspace members

## Files to Modify

- `apps/web/ce/services/worklog.service.ts` — 2 new service methods <!-- Updated: Validation Session 2 - CE store only -->
- `apps/web/ce/store/worklog.store.ts` — 2 new store actions <!-- Updated: Validation Session 2 - CE store only -->
- `apps/web/ce/components/time-tracking/timesheet/timesheet-table.tsx` — workspace column
- `apps/web/ce/components/time-tracking/capacity/capacity-dashboard.tsx` — cross-workspace toggle

## Implementation Steps

### 1. Service methods

```typescript
// Cross-workspace timesheet (same response shape as ITimesheetGridResponse but rows have workspace fields)
async getCrossWorkspaceTimesheet(
  workspaceSlug: string,
  weekStart?: string
): Promise<ITimesheetGridResponse> {
  const params = weekStart ? { week_start: weekStart } : {};
  return this.get(
    `/api/workspaces/${workspaceSlug}/time-tracking/cross-workspace/timesheet/`,
    { params }
  );
}

// Cross-workspace capacity (same shape as ICapacityReportResponse)
async getCrossWorkspaceCapacity(
  workspaceSlug: string,
  params?: { date_from?: string; date_to?: string }
): Promise<ICapacityReportResponse> {
  return this.get(
    `/api/workspaces/${workspaceSlug}/time-tracking/cross-workspace/capacity/`,
    { params }
  );
}
```

### 2. Store actions

```typescript
fetchCrossWorkspaceTimesheet = async (workspaceSlug: string, weekStart?: string) => {
  runInAction(() => {
    this.isTimesheetLoading = true;
  });
  try {
    const data = await this.worklogService.getCrossWorkspaceTimesheet(workspaceSlug, weekStart);
    runInAction(() => {
      this.timesheetData = data;
    });
  } finally {
    runInAction(() => {
      this.isTimesheetLoading = false;
    });
  }
};

fetchCrossWorkspaceCapacity = async (workspaceSlug: string, params?: { date_from?: string; date_to?: string }) => {
  runInAction(() => {
    this.isCapacityLoading = true;
  });
  try {
    const data = await this.worklogService.getCrossWorkspaceCapacity(workspaceSlug, params);
    runInAction(() => {
      this.capacityData = data;
    });
  } finally {
    runInAction(() => {
      this.isCapacityLoading = false;
    });
  }
};
```

Register both in `makeObservable` as `action`.

### 3. `timesheet-table.tsx` — Workspace column

When `showWorkspaceColumn` prop is `true`, prepend a workspace column before the Issue column:

```tsx
// Conditionally add workspace column
...(showWorkspaceColumn
  ? [columnHelper.accessor("workspace_name" as keyof ITimesheetRow, {
      header: () => <span className="text-12 font-medium text-tertiary uppercase tracking-wide">Workspace</span>,
      cell: (info) => (
        <span className="text-12 text-secondary truncate max-w-[120px]">
          {(info.row.original as ITimesheetRow & { workspace_name?: string }).workspace_name ?? "-"}
        </span>
      ),
    })]
  : []),
// Then issue column, day columns, total column...
```

**Note:** `ITimesheetRow` type may need optional `workspace_slug` and `workspace_name` fields added:

```typescript
// packages/types/src/worklog.ts
export interface ITimesheetRow {
  // ... existing fields
  workspace_slug?: string;
  workspace_name?: string;
}
```

### 4. `capacity-dashboard.tsx` — Cross Workspaces toggle

The capacity dashboard already has `workspaceSlug` and `projectId` props. Add:

```tsx
const [isCrossWorkspace, setIsCrossWorkspace] = useState(false);

// In useEffect for data fetching:
useEffect(() => {
  if (isCrossWorkspace) {
    void worklogStore.fetchCrossWorkspaceCapacity(workspaceSlug, { date_from: dateFrom, date_to: dateTo });
  } else {
    void worklogStore.fetchCapacityReport(workspaceSlug, projectId, { date_from: dateFrom, date_to: dateTo });
  }
}, [workspaceSlug, projectId, dateFrom, dateTo, isCrossWorkspace]);

// Toggle button in header (same style as in timesheet):
<button
  onClick={() => setIsCrossWorkspace((v) => !v)}
  className={cn(
    "text-12 font-medium px-3 py-1.5 rounded-md border transition-colors",
    isCrossWorkspace
      ? "bg-accent-subtle border-accent-primary text-accent-primary"
      : "border-subtle text-secondary hover:text-primary"
  )}
>
  {t("timesheet_cross_workspaces")}
</button>;
```

When cross-workspace is active, hide the "member filter" dropdown (since it filters by project members — cross-workspace has a different member scope).

### 5. i18n keys (already added in Phase 04)

- `timesheet_cross_workspaces` — used in both tabs, already planned

## Type Extension

In `packages/types/src/worklog.ts`:

```typescript
export interface ITimesheetRow {
  issue_id: string;
  issue_name: string;
  issue_identifier: string;
  project_id: string;
  days: Record<string, number>;
  total_minutes: number;
  // Cross-workspace extensions
  workspace_slug?: string;
  workspace_name?: string;
}
```

## Success Criteria

- Toggling "Cross Workspaces" in My Timesheet fetches from cross-workspace endpoint and shows workspace column
- Toggling "Cross Workspaces" in Capacity shows members across all workspaces
- Toggling back to project-scoped view fetches project data and hides workspace column
- Both toggles default to `false` (project-scoped) on page load
- No TypeScript errors from the optional `workspace_name` field access
- `pnpm check:lint` passes

## Notes

- Cross-workspace capacity: day-details popover is project-scoped. <!-- Updated: Validation Session 2 - render plain non-clickable cells when isCrossWorkspace=true --> When `isCrossWorkspace` is true, `CapacityHeatmap` renders plain `<div>` cells (no `<CapacityDayDetailsPopover>` wrapper). Pass `isCrossWorkspace` prop to `CapacityHeatmap` and branch accordingly.
- Categories endpoint is project-scoped — hide category tables when cross-workspace is active in Capacity tab.
