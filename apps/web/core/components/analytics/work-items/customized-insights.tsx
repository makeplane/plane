/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
// plane package imports
import { useTranslation } from "@plane/i18n";
import type {
  IAnalyticsParams,
  TAnalyticsDateBasis,
  TPeriodPreset,
  TDateBucket,
  TBusinessFilters,
} from "@plane/types";
import { ChartXAxisProperty, ChartYAxisMetric } from "@plane/types";
import { cn } from "@plane/utils";
// plane web components
import AnalyticsSectionWrapper from "../analytics-section-wrapper";
import { AnalyticsSelectParams } from "../select/analytics-params";
import { useAnalytics } from "@/hooks/store/use-analytics";
import InsightChart from "./insight-chart";
import { buildInsightQuery } from "../v2";

/**
 * Optional inherited scope — when supplied, the Customized Insights
 * surface uses these values instead of the global analytics store.
 * The dashboard's Insights deep tab provides this so the V2 controls
 * start with the same period / view_mode / business_filters the
 * user already chose on the Operations Dashboard.
 */
export interface TInheritedAnalyticsScope {
  workspaceSlug: string;
  period_preset: TPeriodPreset;
  /** Granularity (day/week/month) → V2 `time.group`. */
  date_bucket: TDateBucket;
  view_mode: "team" | "my_work";
  business_filters: TBusinessFilters;
  /** Project IDs (top-level `project_ids`, not a business filter). */
  projectIds: string[];
}

const CustomizedInsights = observer(function CustomizedInsights({
  peekView,
  isEpic,
  inheritedScope,
}: {
  peekView?: boolean;
  isEpic?: boolean;
  /**
   * When provided, the V2 controls inherit the dashboard scope:
   * - `workspaceSlug` overrides the `useParams()` slug
   * - `period_preset` → `selectedDuration`
   * - `date_bucket` → `selectedDateBasis`
   * - The form still allows the user to override locally; the
   *   inheritance only applies to the initial defaults.
   */
  inheritedScope?: TInheritedAnalyticsScope | null;
}) {
  const { t } = useTranslation();
  const paramsRoute = useParams();
  const analytics = useAnalytics();
  const workspaceSlug = inheritedScope?.workspaceSlug ?? paramsRoute.workspaceSlug?.toString() ?? "";

  // Map the dashboard scope onto the analytics store's selected*
  // values when an inherited scope is supplied. The local form
  // still uses its own state for x_axis / y_axis / group_by etc.,
  // so the user can interact with the V2 controls independently.
  const inheritedDuration = inheritedScope ? mapPeriodToDuration(inheritedScope.period_preset) : null;
  // Project IDs live at the top-level payload level (project_ids),
  // not under business_filters. TBusinessFilterKey doesn't include
  // project_id — read from `inheritedScope.projectIds` directly.
  const inheritedProjectIds = inheritedScope?.projectIds ?? null;

  const selectedDuration = inheritedDuration ?? analytics.selectedDuration;
  // The dashboard's `date_bucket` is a GRANULARITY (day/week/month).
  // V2's `time.basis` is a TIMESTAMP (created_at / completed_at);
  // they're different axes. In inherited mode we keep the analytics
  // store's existing time.basis so the user can still toggle it
  // locally. The dashboard's bucket flows through `time.group` via
  // `date_grouping` (see `buildInsightQuery`).
  const selectedDateBasis = analytics.selectedDateBasis;
  const selectedProjects = inheritedProjectIds ?? analytics.selectedProjects;
  const selectedCycle = analytics.selectedCycle;
  const selectedModule = analytics.selectedModule;

  const { control, watch, setValue } = useForm<IAnalyticsParams>({
    defaultValues: {
      x_axis: ChartXAxisProperty.PRIORITY,
      y_axis: isEpic ? ChartYAxisMetric.EPIC_WORK_ITEM_COUNT : ChartYAxisMetric.WORK_ITEM_COUNT,
      date_grouping: (inheritedScope?.date_bucket ?? "day") as IAnalyticsParams["date_grouping"],
      display: "value",
      normalization: "none",
      allocation: "full_credit",
    },
  });

  const params = {
    x_axis: watch("x_axis"),
    y_axis: watch("y_axis"),
    group_by: watch("group_by"),
    date_grouping: watch("date_grouping"),
    display: watch("display") ?? "value",
    normalization: watch("normalization") ?? "none",
    allocation: watch("allocation") ?? "full_credit",
  };

  const query = useMemo(
    () =>
      buildInsightQuery({
        xAxis: params.x_axis,
        yAxis: params.y_axis,
        groupBy: params.group_by,
        dateGrouping: params.date_grouping,
        display: params.display,
        normalization: params.normalization,
        allocation: params.allocation,
        duration: selectedDuration,
        dateBasis: selectedDateBasis,
        projectIds: selectedProjects,
        cycleId: selectedCycle,
        moduleId: selectedModule,
      }),
    [
      params.allocation,
      params.date_grouping,
      params.display,
      params.group_by,
      params.normalization,
      params.x_axis,
      params.y_axis,
      selectedCycle,
      selectedDateBasis,
      selectedDuration,
      selectedModule,
      selectedProjects,
    ]
  );

  return (
    <AnalyticsSectionWrapper
      title={t("workspace_analytics.customized_insights")}
      className="col-span-1"
      headerClassName={cn(peekView ? "flex-col items-start" : "")}
      actions={
        <AnalyticsSelectParams
          control={control}
          setValue={setValue}
          params={params}
          workspaceSlug={workspaceSlug}
          isEpic={isEpic}
          classNames="w-full"
        />
      }
    >
      <InsightChart
        query={query}
        x_axis={params.x_axis}
        y_axis={params.y_axis}
        group_by={params.group_by}
        date_grouping={params.date_grouping}
        display={params.display}
      />
    </AnalyticsSectionWrapper>
  );
});

/**
 * Map the dashboard's `period_preset` to the analytics v2
 * `selectedDuration` enum value. The mapping intentionally maps
 * "this_month" → "last_30_days" because the analytics engine
 * rolls up to the same 30-day window; "last_7_days" passes
 * through unchanged. "none" falls back to "last_30_days" so
 * the chart always has data to draw.
 */
function mapPeriodToDuration(preset: TPeriodPreset): string {
  switch (preset) {
    case "this_month":
      return "last_30_days";
    case "last_30_days":
      return "last_30_days";
    case "last_7_days":
      return "last_7_days";
    case "custom":
      return "last_30_days";
    case "none":
      return "last_30_days";
  }
}

export default CustomizedInsights;