/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Analytics tab orchestrator — fetches all-user project worklogs and renders
 * the analytics timesheet table with per-user breakdown popovers.
 */

import { useCallback, useState } from "react";
import type { FC } from "react";
import { observer } from "mobx-react";
import * as XLSX from "xlsx";
import { useTranslation } from "@plane/i18n";
import { useWorklog } from "@/hooks/store/use-worklog";
import { formatMinutes, getWeekDates } from "../utils/time-format";
import { TimesheetWeekNavigator } from "../timesheet/timesheet-week-navigator";
import { AnalyticsTimesheetTable } from "./analytics-timesheet-table";

interface AnalyticsTimesheetGridProps {
  workspaceSlug: string;
  projectId: string;
}

/**
 * Analytics Timesheet Grid — project-scoped, shows all users' combined logtime.
 * No editing, no Cross Workspaces toggle (analytics is always project-scoped).
 */
export const AnalyticsTimesheetGrid: FC<AnalyticsTimesheetGridProps> = observer(({ workspaceSlug, projectId }) => {
  const { t } = useTranslation();
  const worklogStore = useWorklog();
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (weekStart?: string) => {
      setError(null);
      try {
        await worklogStore.fetchAnalyticsTimesheet(workspaceSlug, projectId, weekStart);
      } catch {
        setError(t("analytics_timesheet_load_error"));
      }
    },
    [workspaceSlug, projectId, worklogStore, t]
  );

  const data = worklogStore.analyticsTimesheetData;
  const isLoading = worklogStore.isAnalyticsTimesheetLoading;
  const isEmpty = data && data.rows.length === 0;

  const handleExport = () => {
    if (!data) return;
    const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const weekDates = getWeekDates(data.week_start);
    const rows = data.rows.map((row) => {
      const entry: Record<string, string> = {};
      entry["Issue"] = `${row.issue_identifier} ${row.issue_name}`;
      weekDates.forEach((date, idx) => {
        entry[DAY_NAMES[idx]] = formatMinutes(row.days[date] ?? 0);
      });
      entry[t("timesheet_total")] = formatMinutes(row.total_minutes);
      return entry;
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Analytics");
    XLSX.writeFile(wb, `analytics-${data.week_start}.xlsx`);
  };

  return (
    <div className="flex flex-col gap-4 p-6 h-full overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between">
        <TimesheetWeekNavigator
          weekStart={data?.week_start ?? null}
          onWeekChange={(ws) => void fetchData(ws)}
          onInit={() => void fetchData()}
        />
        <button
          type="button"
          disabled={!data || isLoading}
          onClick={handleExport}
          className="flex items-center gap-2 rounded-md border border-subtle bg-surface-1 px-3 py-1.5 text-13 font-medium text-secondary hover:bg-layer-2 hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {t("workspace_views.export.button")}
        </button>
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
          <span className="text-13 text-secondary">{t("analytics_timesheet_no_data")}</span>
        </div>
      )}

      {/* Data table */}
      {!isLoading && !error && data && !isEmpty && (
        <AnalyticsTimesheetTable
          weekStart={data.week_start}
          rows={data.rows}
          dailyTotals={data.daily_totals}
          grandTotal={data.grand_total_minutes}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
        />
      )}
    </div>
  );
});
