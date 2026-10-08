/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useNavigate } from "react-router";
// plane imports
import { TIME_REPORT_DIMENSIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { EmptyStateDetailed } from "@plane/propel/empty-state";
// hooks
import { useUser } from "@/hooks/store/user";
import type { TTimeTrackingFilterPatch } from "@/hooks/time-tracking/use-time-tracking-filters";
import { useTimeTrackingFilters } from "@/hooks/time-tracking/use-time-tracking-filters";
import { useTimeReport } from "@/hooks/time-tracking/use-time-report";
import { useTimeSummary } from "@/hooks/time-tracking/use-time-summary";
// local imports
import { TimeTrackingFiltersBar } from "../filters/filters-bar";
import { TimeTrackingBlockLoader } from "../loaders";
import { BreakdownChart } from "./breakdown-chart";
import { TimeReportExportMenu } from "./export-menu";
import { TimeReportKpiCards } from "./kpi-cards";
import type { TPivotConfig } from "./pivot-table";
import { exportPivotCsv, TimeReportPivotTable } from "./pivot-table";
import { TimeOverTimeChart } from "./time-over-time-chart";
import { TopWorkItems } from "./top-work-items";
import { TimeUnitsToggle, useTimeUnits } from "./units-toggle";

/** The Reports tab: KPIs, charts, pivot, top work items and export (plan 9.5.4). */
export const ReportsRoot = observer(function ReportsRoot({ workspaceSlug }: { workspaceSlug: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: currentUser } = useUser();
  const { apiFilters, searchParams, startOfWeek } = useTimeTrackingFilters();
  const { units, setUnits } = useTimeUnits();
  const { summary, error, isLoading, mutate } = useTimeSummary(workspaceSlug, apiFilters);
  const [pivotConfig, setPivotConfig] = useState<TPivotConfig>({ rows: "user", columns: "project", interval: "week" });
  const pivotParams = useMemo(
    () => ({
      group_by: pivotConfig.rows,
      sub_group_by: pivotConfig.columns,
      interval: pivotConfig.interval,
      week_start: startOfWeek,
    }),
    [pivotConfig, startOfWeek]
  );
  // the same request the pivot table makes (SWR de-duplicates it), for "Pivot (CSV)" in the export menu
  const { report: pivotReport } = useTimeReport(workspaceSlug, apiFilters, pivotParams);

  /** open the Entries tab with the current filters plus the clicked value(s) */
  const drillDown = useCallback(
    (patches: TTimeTrackingFilterPatch[]) => {
      const next = new URLSearchParams(searchParams);
      for (const patch of patches)
        for (const [key, value] of Object.entries(patch)) {
          if (value === null || value === undefined) next.delete(key);
          else next.set(key, Array.isArray(value) ? value.join(",") : String(value));
        }
      navigate(`/${workspaceSlug}/time-tracking/entries/?${next.toString()}`);
    },
    [navigate, searchParams, workspaceSlug]
  );

  const rowsLabel = t(TIME_REPORT_DIMENSIONS.find((option) => option.key === pivotConfig.rows)?.i18n_label ?? "");

  return (
    <div className="flex flex-col gap-4 px-page-x py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <TimeTrackingFiltersBar workspaceSlug={workspaceSlug} className="flex-1" />
        <div className="flex items-center gap-2">
          <TimeUnitsToggle units={units} onChange={setUnits} />
          <TimeReportExportMenu
            workspaceSlug={workspaceSlug}
            filters={apiFilters}
            onExportPivot={
              pivotReport?.groups.length
                ? () => exportPivotCsv(pivotReport, pivotConfig.interval, rowsLabel, `time-pivot-${workspaceSlug}`)
                : undefined
            }
          />
        </div>
      </div>

      {error ? (
        <div className="flex flex-col items-center gap-3 rounded-md border-[0.5px] border-subtle p-8 text-13 text-secondary">
          <span>{t("time-tracking.reports.error")}</span>
          <Button variant="secondary" size="lg" onClick={() => void mutate()}>
            {t("time-tracking.reports.retry")}
          </Button>
        </div>
      ) : isLoading && !summary ? (
        <TimeTrackingBlockLoader height="160px" />
      ) : summary && summary.entry_count === 0 ? (
        <EmptyStateDetailed
          assetKey="search"
          title={t("time-tracking.empty_state.reports_title")}
          description={t("time-tracking.empty_state.reports_description")}
        />
      ) : summary ? (
        <>
          <TimeReportKpiCards
            summary={summary}
            units={units}
            onOpenNeedsReview={() => {
              if (currentUser) drillDown([{ needs_review: true, user_ids: [currentUser.id] }]);
            }}
          />
          <TimeOverTimeChart
            workspaceSlug={workspaceSlug}
            filters={apiFilters}
            weekStart={startOfWeek}
            units={units}
            onDrillDown={drillDown}
          />
          <BreakdownChart workspaceSlug={workspaceSlug} filters={apiFilters} units={units} onDrillDown={drillDown} />
          <TimeReportPivotTable
            workspaceSlug={workspaceSlug}
            filters={apiFilters}
            weekStart={startOfWeek}
            units={units}
            config={pivotConfig}
            onConfigChange={setPivotConfig}
            onDrillDown={drillDown}
          />
          <TopWorkItems workspaceSlug={workspaceSlug} filters={apiFilters} units={units} onDrillDown={drillDown} />
        </>
      ) : null}
    </div>
  );
});
