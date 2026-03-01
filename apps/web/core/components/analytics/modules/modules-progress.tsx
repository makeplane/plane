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

import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { MODULE_STATUS, MODULE_STATUS_COLORS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { BarChart } from "@plane/propel/charts/bar-chart";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import type { IModuleProgressData, IChartResponse, TChartData, TModuleStatus } from "@plane/types";
import { renderFormattedDate } from "@plane/utils";
// components
import AnalyticsSectionWrapper from "@/components/analytics/analytics-section-wrapper";
import { ChartLoader } from "@/components/analytics/loaders";
// hooks
import { useAnalytics } from "@/hooks/store/use-analytics";
// services
import { AnalyticsService } from "@/services/analytics.service";
import type { ICycleModuleTooltipProps } from "../modules-cycles-tooltip";
import ModulesCyclesTooltip from "../modules-cycles-tooltip";

const analyticsService = new AnalyticsService();
const ModuleProgress = observer(function ModuleProgress() {
  const params = useParams();
  const { t } = useTranslation();
  const workspaceSlug = params.workspaceSlug.toString();
  const { selectedDuration, selectedDurationLabel, selectedProjects, selectedCycle, selectedModule, isPeekView } =
    useAnalytics();

  const { data: moduleInsightsData, isLoading: isLoadingModuleInsight } = useSWR(
    `radar-chart-module-progress-${workspaceSlug}-${selectedDuration}-${selectedProjects}-${selectedCycle}-${selectedModule}-${isPeekView}`,
    () =>
      analyticsService.getAdvanceAnalyticsCharts<IChartResponse>(
        workspaceSlug,
        "modules",
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
    if (!moduleInsightsData?.data) return [];
    return moduleInsightsData.data.map((datum) => ({
      ...datum,
      [datum.key]: datum.count,
      name: renderFormattedDate(datum.key) ?? datum.key,
    }));
  }, [moduleInsightsData]);

  const tooltipRows = useCallback(
    (data: IModuleProgressData) => [
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
        label: t("workspace_projects.state.cancelled"),
        value: data.cancelled_issues,
      },
    ],
    [t]
  );

  return (
    <AnalyticsSectionWrapper title="Module Progress" subtitle={selectedDurationLabel} className="col-span-1 ">
      {isLoadingModuleInsight ? (
        <ChartLoader />
      ) : moduleInsightsData && moduleInsightsData?.data?.length > 0 ? (
        <div className="h-[350px] flex flex-col gap-4">
          <BarChart
            data={parsedData}
            bars={[
              {
                key: "count",
                label: t("common.completion"),
                fill: (payload: any) => MODULE_STATUS_COLORS[payload.status.toLowerCase() as TModuleStatus],
                textClassName: "text-11",
                stackId: "a",
                shapeVariant: "lollipop",
              },
            ]}
            className="h-full"
            xAxis={{
              key: "name",
              label: t("common.modules"),
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
              const data: IModuleProgressData = payload[0]?.payload as IModuleProgressData;
              const tooltipProps: ICycleModuleTooltipProps = {
                title: data.name,
                startDate: data.start_date,
                endDate: data.target_date,
                rows: tooltipRows(data),
                totalCount: data.total_issues,
                completedCount: data.completed_issues,
              };
              return <ModulesCyclesTooltip {...tooltipProps} />;
            }}
          />
          <div className="flex gap-4 pl-12">
            {Object.entries(MODULE_STATUS_COLORS).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2 ">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: value }} />
                <span className="text-13 opacity-50">
                  {t(MODULE_STATUS.find((status) => status.value === key)?.i18n_label || "")}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyStateCompact
          assetKey="unknown"
          assetClassName="size-20"
          rootClassName="border border-subtle px-5 py-10 md:py-20 md:px-20"
          title={t("workspace_empty_state.analytics_no_module.title")}
        />
      )}
    </AnalyticsSectionWrapper>
  );
});

export default ModuleProgress;
