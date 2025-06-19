import React, { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { MODULE_STATUS, MODULE_STATUS_COLORS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { ScatterChart } from "@plane/propel/charts/scatter-chart";
import { IChartResponse, TChartData, TModuleStatus, TScatterPointItem } from "@plane/types";
import { IModuleProgressData } from "@plane/types/src/analytics-extended";
import { renderFormattedDate } from "@plane/utils";
import AnalyticsSectionWrapper from "@/components/analytics/analytics-section-wrapper";
import AnalyticsEmptyState from "@/components/analytics/empty-state";
import { ChartLoader } from "@/components/analytics/loaders";
import { useAnalytics } from "@/hooks/store/use-analytics";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
import { AnalyticsService } from "@/services/analytics.service";
import ModulesCyclesTooltip, { ICycleModuleTooltipProps } from "../modules-cycles-tooltip";

const analyticsService = new AnalyticsService();
const ModuleProgress = observer(() => {
  const params = useParams();
  const { t } = useTranslation();
  const workspaceSlug = params.workspaceSlug.toString();
  const { selectedDuration, selectedDurationLabel, selectedProjects, selectedCycle, selectedModule, isPeekView } =
    useAnalytics();
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/analytics/empty-chart-radar" });

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

  const scatterPoints: TScatterPointItem<string>[] = useMemo(() => {
    if (!parsedData) return [];
    return parsedData.map((datum) => ({
      key: datum.key,
      label: datum.name,
      x: datum.key,
      y: datum.count,
      fill: MODULE_STATUS_COLORS[datum.status.toLowerCase() as TModuleStatus],
      stroke: MODULE_STATUS_COLORS[datum.status.toLowerCase() as TModuleStatus],
    }));
  }, [parsedData]);

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
          <ScatterChart
            data={parsedData}
            scatterPoints={scatterPoints}
            className="h-full"
            xAxis={{
              key: "name",
              label: t("common.modules"),
            }}
            yAxis={{
              key: "count",
              label: t("common.completion") + " " + "%",
              offset: -30,
              dx: -25,
              domain: [0, 100],
            }}
            tickCount={{
              y: 100,
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
                <span className="text-sm opacity-50">
                  {t(MODULE_STATUS.find((status) => status.value === key)?.i18n_label || "")}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <AnalyticsEmptyState
          title={t("workspace_analytics.empty_state.module_progress.title")}
          description={t("workspace_analytics.empty_state.module_progress.description")}
          className="h-[350px]"
          assetPath={resolvedPath}
        />
      )}
    </AnalyticsSectionWrapper>
  );
});

export default ModuleProgress;
