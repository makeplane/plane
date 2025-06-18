import { useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane package imports
import { useTranslation } from "@plane/i18n";
import { AreaChart } from "@plane/propel/charts/area-chart";
import { IChartResponse, TChartData } from "@plane/types";
import { renderFormattedDate } from "@plane/utils";
// hooks
import { useAnalytics } from "@/hooks/store/use-analytics";
// services
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
import { AnalyticsService } from "@/services/analytics.service";
// plane web components
import AnalyticsSectionWrapper from "../analytics-section-wrapper";
import AnalyticsEmptyState from "../empty-state";
import { ChartLoader } from "../loaders";

const analyticsService = new AnalyticsService();
const CreatedVsResolved = observer(() => {
  const {
    selectedDuration,
    selectedDurationLabel,
    selectedProjects,
    selectedCycle,
    selectedModule,
    isPeekView,
    isEpic,
  } = useAnalytics();
  const params = useParams();
  const { t } = useTranslation();
  const workspaceSlug = params.workspaceSlug.toString();
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/analytics/empty-chart-area" });
  const { data: createdVsResolvedData, isLoading: isCreatedVsResolvedLoading } = useSWR(
    `created-vs-resolved-${workspaceSlug}-${selectedDuration}-${selectedProjects}-${selectedCycle}-${selectedModule}-${isPeekView}-${isEpic}`,
    () =>
      analyticsService.getAdvanceAnalyticsCharts<IChartResponse>(
        workspaceSlug,
        "work-items",
        {
          // date_filter: selectedDuration,
          ...(selectedProjects?.length > 0 && { project_ids: selectedProjects?.join(",") }),
          ...(selectedCycle ? { cycle_id: selectedCycle } : {}),
          ...(selectedModule ? { module_id: selectedModule } : {}),
          ...(isEpic ? { epic: true } : {}),
        },
        isPeekView
      )
  );
  const parsedData: TChartData<string, string>[] = useMemo(() => {
    if (!createdVsResolvedData?.data) return [];
    return createdVsResolvedData.data.map((datum) => ({
      ...datum,
      [datum.key]: datum.count,
      name: renderFormattedDate(datum.key) ?? datum.key,
    }));
  }, [createdVsResolvedData]);

  const areas = useMemo(
    () => [
      {
        key: "completed_issues",
        label: "Resolved",
        fill: "#19803833",
        fillOpacity: 1,
        stackId: "bar-one",
        showDot: false,
        smoothCurves: true,
        strokeColor: "#198038",
        strokeOpacity: 1,
      },
      {
        key: "created_issues",
        label: "Created",
        fill: "#1192E833",
        fillOpacity: 1,
        stackId: "bar-one",
        showDot: false,
        smoothCurves: true,
        strokeColor: "#1192E8",
        strokeOpacity: 1,
      },
    ],
    []
  );

  return (
    <AnalyticsSectionWrapper
      title={t("workspace_analytics.created_vs_resolved")}
      subtitle={selectedDurationLabel}
      className="col-span-1"
    >
      {isCreatedVsResolvedLoading ? (
        <ChartLoader />
      ) : parsedData && parsedData.length > 0 ? (
        <AreaChart
          className="h-[350px] w-full"
          data={parsedData}
          areas={areas}
          xAxis={{
            key: "name",
            label: t("date"),
          }}
          yAxis={{
            key: "count",
            label: t("common.no_of", { entity: isEpic ? t("epics") : t("work_items") }),
            offset: -60,
            dx: -24,
          }}
          legend={{
            align: "left",
            verticalAlign: "bottom",
            layout: "horizontal",
            wrapperStyles: {
              justifyContent: "start",
              alignContent: "start",
              paddingLeft: "40px",
              paddingTop: "10px",
            },
          }}
        />
      ) : (
        <AnalyticsEmptyState
          title={t("workspace_analytics.empty_state.created_vs_resolved.title")}
          description={t("workspace_analytics.empty_state.created_vs_resolved.description")}
          className="h-[350px]"
          assetPath={resolvedPath}
        />
      )}
    </AnalyticsSectionWrapper>
  );
});

export default CreatedVsResolved;
