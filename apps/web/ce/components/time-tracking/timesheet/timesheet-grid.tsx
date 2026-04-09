/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useState } from "react";
import type { FC } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import { useWorklog } from "@/hooks/store/use-worklog";
import { TimesheetWeekNavigator } from "./timesheet-week-navigator";
import { TimesheetTable } from "./timesheet-table";

interface TimesheetGridProps {
  workspaceSlug: string;
  projectId?: string;
  defaultCrossWorkspace?: boolean;
}

/**
 * Main Timesheet Grid — the "My Timesheet" tab.
 * Read-only view of the current user's worklogs for a given week.
 * Supports a "Cross Workspaces" toggle to show data across all user workspaces.
 */
export const TimesheetGrid: FC<TimesheetGridProps> = observer(({ workspaceSlug, projectId, defaultCrossWorkspace }) => {
  if (!projectId && !defaultCrossWorkspace) {
    throw new Error("TimesheetGrid requires either projectId or defaultCrossWorkspace");
  }
  const { t } = useTranslation();
  const worklogStore = useWorklog();
  const [error, setError] = useState<string | null>(null);
  const [isCrossWorkspace, setIsCrossWorkspace] = useState(defaultCrossWorkspace ?? false);

  const fetchData = useCallback(
    async (weekStart?: string) => {
      setError(null);
      try {
        if (isCrossWorkspace) {
          await worklogStore.fetchCrossWorkspaceTimesheet(workspaceSlug, weekStart);
        } else {
          await worklogStore.fetchTimesheetGrid(workspaceSlug, projectId!, weekStart);
        }
      } catch {
        setError(t("timesheet_load_error"));
      }
    },
    [workspaceSlug, projectId, worklogStore, isCrossWorkspace, t]
  );

  // Re-fetch when cross-workspace toggle changes
  useEffect(() => {
    void fetchData(data?.week_start);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: only re-fetch on toggle change
  }, [isCrossWorkspace]);

  const data = worklogStore.timesheetData;
  const isLoading = worklogStore.isTimesheetLoading;
  const isEmpty = data && data.rows.length === 0;

  return (
    <div className="flex flex-col gap-4 p-6 h-full overflow-y-auto custom-scrollbar">
      {/* Header controls (Week navigator + Cross Workspaces toggle) */}
      <div className="flex items-center justify-between">
        <TimesheetWeekNavigator
          weekStart={data?.week_start ?? null}
          onWeekChange={(ws) => void fetchData(ws)}
          onInit={() => void fetchData()}
        />

        {!defaultCrossWorkspace && (
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
          </button>
        )}
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
