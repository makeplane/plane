/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import React, { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import { BarChart } from "@plane/propel/charts/bar-chart";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { CYCLE_GROUP_COLORS, CYCLE_GROUP_I18N_LABELS } from "@plane/propel/icons";
import type { ICycleProgressData, IChartResponse, TChartData, TCycleGroups } from "@plane/types";
import { renderFormattedDate } from "@plane/utils";
// components
import AnalyticsSectionWrapper from "@/components/analytics/analytics-section-wrapper";
import { ChartLoader } from "@/components/analytics/loaders";
// hooks
import { useAnalytics } from "@/hooks/store/use-analytics";
// services
import { AnalyticsService } from "@/services/analytics.service";
// local components
import type { ICycleModuleTooltipProps } from "../modules-cycles-tooltip";
import ModulesCyclesTooltip from "../modules-cycles-tooltip";

const analyticsService = new AnalyticsService();
const CycleProgress = observer(function CycleProgress() {
  const params = useParams();
  const { t } = useTranslation();
  const workspaceSlug = params.workspaceSlug.toString();
  const { selectedDuration, selectedDurationLabel, selectedProjects, selectedCycle, selectedModule, isPeekView } =
    useAnalytics();

  const { data: cycleInsightsData, isLoading: isLoadingCycleInsight } = useSWR(
    `radar-chart-cycle-progress-${workspaceSlug}-${selectedDuration}-${selectedProjects}-${selectedCycle}-${selectedModule}-${isPeekView}`,
    () =>
      analyticsService.getAdvanceAnalyticsCharts<IChartResponse>(
        workspaceSlug,
        "cycles",
        {
          // date_filter: selectedDuration,
          ...(selectedProjects?.length > 0 && { project_ids: selectedProjects?.join(",") }),
          ...(selectedCycle ? { cycle_id: selectedCycle } : {}),
          ...(selectedModule ? { module_id: selectedModule } : {}),
        },
        isPeekView
      )
  );

  const parsedData: TChartData<string, string>[] = useMemo(() => {
    if (!cycleInsightsData?.data) return [];
    return cycleInsightsData.data.map((datum) => ({
      ...datum,
      [datum.key]: datum.count,
      name: renderFormattedDate(datum.key) ?? datum.key,
    }));
  }, [cycleInsightsData]);

  const tooltipRows = useCallback(
    (data: ICycleProgressData) => [
      {
        label: t("workspace_analytics.total", {
          entity: t("common.work_items"),
        }),
        value: data.total_issues,
      },
      {
        label: t("workspace_projects.state.completed"),
        value: data.completed_issues,
      },
      {
        label: t("workspace_projects.state.started"),
        value: data.started_issues,
      },
      {
        label: t("workspace_projects.state.unstarted"),
        value: data.unstarted_issues,
      },
      {
        label: t("workspace_projects.state.backlog"),
        value: data.backlog_issues,
      },
      {
        label: t("workspace_projects.state.cancelled"),
        value: data.cancelled_issues,
      },
    ],
    [t]
  );

  return (
    <AnalyticsSectionWrapper title="Cycle Progress" subtitle={selectedDurationLabel} className="col-span-1 ">
      {isLoadingCycleInsight ? (
        <ChartLoader />
      ) : cycleInsightsData && cycleInsightsData?.data?.length > 0 ? (
        <div className="h-[350px] flex flex-col gap-4">
          <BarChart
            data={parsedData}
            bars={[
              {
                key: "count",
                label: t("common.completion"),
                fill: (payload: any) => CYCLE_GROUP_COLORS[payload.status.toLowerCase() as TCycleGroups],
                textClassName: "text-11",
                stackId: "a",
                shapeVariant: "lollipop",
              },
            ]}
            className="h-full"
            xAxis={{
              key: "name",
              label: t("common.cycles"),
            }}
            yAxis={{
              key: "count",
              label: t("common.completion") + " %",
              domain: [0, 100],
              dx: -25,
            }}
            margin={{
              top: 20,
              right: 20,
              bottom: 35,
              left: 20,
            }}
            showTooltip
            customTooltipContent={({ active, label, payload }) => {
              if (!active) return null;
              const data: ICycleProgressData = payload[0]?.payload as ICycleProgressData;
              const tooltipProps: ICycleModuleTooltipProps = {
                title: data.name,
                startDate: data.start_date,
                endDate: data.end_date,
                rows: tooltipRows(data),
                totalCount: data.total_issues,
                completedCount: data.completed_issues,
              };
              return <ModulesCyclesTooltip {...tooltipProps} />;
            }}
          />
          <div className="flex gap-4 pl-12">
            {Object.entries(CYCLE_GROUP_COLORS).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: value }} />
                <span className="text-13 opacity-50">{t(CYCLE_GROUP_I18N_LABELS[key as TCycleGroups])}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyStateCompact
          assetKey="unknown"
          assetClassName="size-20"
          rootClassName="border border-subtle px-5 py-10 md:py-20 md:px-20"
          title={t("workspace_empty_state.analytics_no_cycle.title")}
        />
      )}
    </AnalyticsSectionWrapper>
  );
});

export default CycleProgress;
