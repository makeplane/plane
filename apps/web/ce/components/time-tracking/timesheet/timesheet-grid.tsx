/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useState } from "react";
import type { FC } from "react";
import { observer } from "mobx-react";
import * as XLSX from "xlsx";
import { useTranslation } from "@plane/i18n";
import { Switch } from "@plane/propel/switch";
import { useWorklog } from "@/hooks/store/use-worklog";
import { formatMinutes, getWeekDates } from "../utils/time-format";
import { TimesheetWeekNavigator } from "./timesheet-week-navigator";
import { TimesheetTable } from "./timesheet-table";

interface TimesheetGridProps {
  workspaceSlug: string;
  projectId?: string;
  /** When true, component is rendered at workspace level (no projectId required).
   *  The cross-workspace toggle is shown; default is current workspace only. */
  isWorkspaceMode?: boolean;
}

/**
 * Main Timesheet Grid — the "My Timesheet" tab.
 * Read-only view of the current user's worklogs for a given week.
 * Supports a "Cross Workspaces" toggle to show data across all user workspaces.
 */
export const TimesheetGrid: FC<TimesheetGridProps> = observer(({ workspaceSlug, projectId, isWorkspaceMode }) => {
  if (!projectId && !isWorkspaceMode) {
    throw new Error("TimesheetGrid requires either projectId or isWorkspaceMode");
  }
  const { t } = useTranslation();
  const worklogStore = useWorklog();
  const [error, setError] = useState<string | null>(null);
  // Workspace mode defaults to current-workspace-only (toggle OFF); project mode starts OFF too
  const [isCrossWorkspace, setIsCrossWorkspace] = useState(false);

  const fetchData = useCallback(
    async (weekStart?: string) => {
      setError(null);
      try {
        if (isCrossWorkspace) {
          // All workspaces the user belongs to
          await worklogStore.fetchCrossWorkspaceTimesheet(workspaceSlug, weekStart);
        } else if (isWorkspaceMode) {
          // Current workspace only (workspace_only param filters to this workspace)
          await worklogStore.fetchCrossWorkspaceTimesheet(workspaceSlug, weekStart, true);
        } else {
          await worklogStore.fetchTimesheetGrid(workspaceSlug, projectId!, weekStart);
        }
      } catch {
        setError(t("timesheet_load_error"));
      }
    },
    [workspaceSlug, projectId, worklogStore, isCrossWorkspace, isWorkspaceMode, t]
  );

  // Re-fetch when cross-workspace toggle changes
  useEffect(() => {
    void fetchData(data?.week_start);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: only re-fetch on toggle change
  }, [isCrossWorkspace]);

  const data = worklogStore.timesheetData;
  const isLoading = worklogStore.isTimesheetLoading;
  const isEmpty = data && data.rows.length === 0;

  const handleExport = () => {
    if (!data) return;
    const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const weekDates = getWeekDates(data.week_start);
    const rows = data.rows.map((row) => {
      const entry: Record<string, string> = {};
      if (isCrossWorkspace) entry["Workspace"] = (row as typeof row & { workspace_name?: string }).workspace_name ?? "-";
      entry["Issue"] = `${row.issue_identifier} ${row.issue_name}`;
      weekDates.forEach((date, idx) => {
        entry[DAY_NAMES[idx]] = formatMinutes(row.days[date] ?? 0);
      });
      entry[t("timesheet_total")] = formatMinutes(row.total_minutes);
      return entry;
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Timesheet");
    XLSX.writeFile(wb, `timesheet-${data.week_start}.xlsx`);
  };

  return (
    <div className="flex flex-col gap-4 p-6 h-full overflow-y-auto custom-scrollbar">
      {/* Header controls (Week navigator + Cross Workspaces toggle) */}
      <div className="flex items-center justify-between">
        <TimesheetWeekNavigator
          weekStart={data?.week_start ?? null}
          onWeekChange={(ws) => void fetchData(ws)}
          onInit={() => void fetchData()}
        />

        <div className="flex items-center gap-2.5">
          <span className="text-12 font-medium text-secondary">{t("timesheet_cross_workspaces")}</span>
          <Switch value={isCrossWorkspace} onChange={(val) => setIsCrossWorkspace(val)} size="sm" />
          <button
            type="button"
            disabled={!data || isLoading}
            onClick={handleExport}
            className="flex items-center gap-2 rounded-md border border-subtle bg-surface-1 px-3 py-1.5 text-13 font-medium text-secondary hover:bg-layer-2 hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t("workspace_views.export.button")}
          </button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <span className="text-13 text-secondary font-medium animate-pulse">Loading...</span>
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <div className="flex items-center justify-center py-16">
          <span className="text-13 text-danger-primary font-medium">{error}</span>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && isEmpty && (
        <div className="flex items-center justify-center py-24">
          <span className="text-13 text-secondary">{t("timesheet_no_issues")}</span>
        </div>
      )}

      {/* Data table */}
      {!isLoading && !error && data && !isEmpty && (
        <TimesheetTable
          weekStart={data.week_start}
          rows={data.rows}
          dailyTotals={data.daily_totals}
          grandTotal={data.grand_total_minutes}
          workspaceSlug={workspaceSlug}
          projectId={projectId ?? ""}
          showWorkspaceColumn={isCrossWorkspace}
        />
      )}
    </div>
  );
});
