# Phase 04 — Frontend: My Timesheet Tab

**Status:** Todo | **Priority:** High | **Effort:** S

## Overview

Three focused changes to the existing timesheet components:

1. Remove "Add Issues" button + modal
2. Make table read-only (display-only cells, no save callback)
3. Make issue identifier/name clickable → navigate to issue detail
4. Add "Cross Workspaces" toggle button (wires to Phase 07)

## Files to Modify

- `apps/web/ce/components/time-tracking/timesheet/timesheet-grid.tsx`
- `apps/web/ce/components/time-tracking/timesheet/timesheet-table.tsx`
- `apps/web/ce/components/time-tracking/timesheet/timesheet-cell.tsx` (optional — may keep for reuse)

## Files to Delete (if unused after changes)

- `apps/web/ce/components/time-tracking/timesheet/timesheet-add-issue-modal.tsx` — only if nothing else imports it

## Implementation Steps

### 1. `timesheet-grid.tsx` — Remove Add Issues, add Cross Workspaces toggle

Remove:

- `isAddIssueModalOpen` state
- `Button` import + "Add Issue" button JSX
- `TimesheetAddIssueModal` import + JSX
- `PlusIcon` import
- `handleSave` callback (no longer needed — table is read-only)

Add:

- `isCrossWorkspace` boolean state (default `false`)
- Toggle button: `{t("timesheet_cross_workspaces")}` next to week navigator
- When `isCrossWorkspace` is true, call `worklogStore.fetchCrossWorkspaceTimesheet(workspaceSlug, weekStart)` instead of `fetchTimesheetGrid`
- Pass `isCrossWorkspace` to `TimesheetTable` so it can show workspace column

```tsx
// Simplified shape after changes
export const TimesheetGrid: FC<TimesheetGridProps> = observer(({ workspaceSlug, projectId }) => {
  const { t } = useTranslation();
  const worklogStore = useWorklog();
  const [error, setError] = useState<string | null>(null);
  const [isCrossWorkspace, setIsCrossWorkspace] = useState(false);

  const fetchData = useCallback(async (weekStart?: string) => {
    setError(null);
    try {
      if (isCrossWorkspace) {
        await worklogStore.fetchCrossWorkspaceTimesheet(workspaceSlug, weekStart);
      } else {
        await worklogStore.fetchTimesheetGrid(workspaceSlug, projectId, weekStart);
      }
    } catch {
      setError(t("timesheet_load_error"));
    }
  }, [workspaceSlug, projectId, worklogStore, isCrossWorkspace, t]);

  // Re-fetch when cross-workspace toggle changes
  useEffect(() => { void fetchData(data?.week_start); }, [isCrossWorkspace]);

  const data = worklogStore.timesheetData;
  const isLoading = worklogStore.isTimesheetLoading;

  return (
    <div className="flex flex-col gap-4 p-6 h-full overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between">
        <TimesheetWeekNavigator ... />
        <button
          onClick={() => setIsCrossWorkspace((v) => !v)}
          className={cn("text-12 font-medium px-3 py-1.5 rounded-md border transition-colors",
            isCrossWorkspace
              ? "bg-accent-subtle border-accent-primary text-accent-primary"
              : "border-subtle text-secondary hover:text-primary"
          )}
        >
          {t("timesheet_cross_workspaces")}
        </button>
      </div>

      {/* Loading / Error / Empty / Table */}
      {!isLoading && !error && data && data.rows.length > 0 && (
        <TimesheetTable
          weekStart={data.week_start}
          rows={data.rows}
          dailyTotals={data.daily_totals}
          grandTotal={data.grand_total_minutes}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          showWorkspaceColumn={isCrossWorkspace}
        />
      )}
    </div>
  );
});
```

### 2. `timesheet-table.tsx` — Read-only cells + clickable issue

Remove:

- `onCellSave` prop
- `TimesheetCell` import (replace with simple display)

Add:

- `workspaceSlug`, `projectId`, `showWorkspaceColumn` props
- Issue identifier cell wraps in `<Link>` to issue detail
- Day cells show `formatMinutes(minutes)` as plain text (not editable input)
- Optional: add workspace column when `showWorkspaceColumn` is true

```tsx
interface TimesheetTableProps {
  weekStart: string;
  rows: ITimesheetRow[];
  dailyTotals: Record<string, number>;
  grandTotal: number;
  workspaceSlug: string;
  projectId: string;
  showWorkspaceColumn?: boolean;  // for cross-workspace mode
}

// Issue column cell — make clickable
cell: (info) => {
  const row = info.row.original;
  const issueUrl = `/${row.workspace_slug ?? workspaceSlug}/projects/${row.project_id}/issues/${row.issue_id}`;
  return (
    <a href={issueUrl} className="flex items-center gap-2 min-w-[180px] group">
      <span className="text-12 font-mono text-tertiary">{row.issue_identifier}</span>
      <span className="text-13 text-primary truncate max-w-[200px] group-hover:text-accent-primary transition-colors">
        {row.issue_name}
      </span>
    </a>
  );
},

// Day column cell — plain display (was TimesheetCell editable input)
cell: (info) => {
  const mins = info.row.original.days[date] ?? 0;
  return (
    <span className={cn("text-13 font-medium", mins > 0 ? "text-primary" : "text-tertiary")}>
      {mins > 0 ? formatMinutes(mins) : "-"}
    </span>
  );
},
```

### 3. i18n keys to add

In `packages/i18n/src/locales/en/translations.ts`, `ko/`, `vi/`:

```ts
timesheet_cross_workspaces: "Cross Workspaces",
timesheet_load_error: "Failed to load timesheet data.",
```

### 4. Store action needed (stub for Phase 07)

The `worklogStore.fetchCrossWorkspaceTimesheet(workspaceSlug, weekStart)` must be added in Phase 07. In this phase, just wire the call; leave the store stub returning empty data if Phase 07 isn't done yet.

## File Size Check

- `timesheet-grid.tsx`: currently 132 lines → removing modal+button brings it to ~90 lines ✓
- `timesheet-table.tsx`: currently 158 lines → removing `onCellSave` prop + simplifying cells → ~140 lines ✓

## Success Criteria

- "Add Issues" button and modal are gone
- Cells show formatted time as plain text, no editing
- Clicking issue identifier/name navigates to issue detail page
- "Cross Workspaces" toggle button renders (may show loading/empty until Phase 07 is done)
- `pnpm check:lint` passes with 0 errors
