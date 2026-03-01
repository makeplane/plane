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

import { useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import useSWR from "swr";
// plane package imports
import { CHART_COLOR_PALETTES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { BarChart } from "@plane/propel/charts/bar-chart";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import type { IChartResponse, TBarItem, TChartData } from "@plane/types";
import { renderFormattedDate } from "@plane/utils";
// hooks
import AnalyticsSectionWrapper from "@/components/analytics/analytics-section-wrapper";
import { ChartLoader } from "@/components/analytics/loaders";
import { generateExtendedColors } from "@/components/chart/utils";
import { useAnalytics } from "@/hooks/store/use-analytics";
// services
import { AnalyticsService } from "@/services/analytics.service";
// plane web components

const analyticsService = new AnalyticsService();
const ProjectsByStatus = observer(function ProjectsByStatus() {
  const { selectedDuration, selectedDurationLabel, selectedProjects, selectedCycle, selectedModule, isPeekView } =
    useAnalytics();
  const params = useParams();
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const workspaceSlug = params.workspaceSlug.toString();
  const { data: projectsByStatusData, isLoading: isProjectsByStatusLoading } = useSWR(
    `projects-by-status-${workspaceSlug}-${selectedDuration}-${selectedProjects}-${selectedCycle}-${selectedModule}-${isPeekView}`,
    () =>
      analyticsService.getAdvanceAnalyticsCharts<IChartResponse>(
        workspaceSlug,
        "project-status",
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
    if (!projectsByStatusData?.data) return [];
    return projectsByStatusData.data.map((datum) => ({
      ...datum,
      [datum.key]: datum.count,
      name: renderFormattedDate(datum.key) ?? datum.key,
    }));
  }, [projectsByStatusData]);

  const baseColors = CHART_COLOR_PALETTES[0]?.[resolvedTheme === "dark" ? "dark" : "light"];

  const parsedBars: TBarItem<string>[] | undefined = useMemo(
    () =>
      projectsByStatusData?.data?.map(
        (data, index) =>
          ({
            key: data.key,
            label: data.key,
            fill: generateExtendedColors(baseColors ?? [], projectsByStatusData?.data?.length ?? 0)[index],
            stackId: "count",
            textClassName: "",
            showTopBorderRadius: () => true,
          }) as TBarItem<string>
      ),
    [projectsByStatusData, baseColors]
  );

  return (
    <AnalyticsSectionWrapper
      title={t("workspace_analytics.projects_by_status")}
      subtitle={selectedDurationLabel}
      className="col-span-1"
    >
      {isProjectsByStatusLoading ? (
        <ChartLoader />
      ) : parsedData && parsedData.length > 0 ? (
        <BarChart
          className="h-[350px] w-full"
          data={parsedData}
          bars={parsedBars || []}
          xAxis={{
            key: "name",
            label: t("project_settings.states.heading"),
          }}
          yAxis={{
            key: "count",
            label: t("common.no_of", { entity: t("common.projects") }),
          }}
          margin={{
            top: 10,
            right: 10,
            bottom: 40,
            left: 10,
          }}
        />
      ) : (
        <EmptyStateCompact
          assetKey="unknown"
          assetClassName="size-20"
          rootClassName="border border-subtle px-5 py-10 md:py-20 md:px-20"
          title={t("workspace_empty_state.analytics_projects.title")}
        />
      )}
    </AnalyticsSectionWrapper>
  );
});

export default ProjectsByStatus;
