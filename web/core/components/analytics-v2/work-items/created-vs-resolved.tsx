import { useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane package imports
import { useTranslation } from "@plane/i18n";
import { AreaChart } from "@plane/propel/charts/area-chart";
import { IChartResponseV2, TChartData } from "@plane/types";
import { renderFormattedDate } from "@plane/utils";
// hooks
import { useAnalyticsV2 } from "@/hooks/store/use-analytics-v2";
// services
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
import { AnalyticsV2Service } from "@/services/analytics-v2.service";
// plane web components
import AnalyticsSectionWrapper from "../analytics-section-wrapper";
import AnalyticsV2EmptyState from "../empty-state";
import { ChartLoader } from "../loaders";

const analyticsV2Service = new AnalyticsV2Service();
const CreatedVsResolved = observer(() => {
  const {
    selectedDuration,
    selectedDurationLabel,
    selectedProjects,
    selectedCycle,
    selectedModule,
    isPeekView,
    isEpic,
  } = useAnalyticsV2();
  const params = useParams();
  const { t } = useTranslation();
  const workspaceSlug = params.workspaceSlug.toString();
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/analytics-v2/empty-chart-area" });
  const { data: createdVsResolvedData, isLoading: isCreatedVsResolvedLoading } = useSWR(
    `created-vs-resolved-${workspaceSlug}-${selectedDuration}-${selectedProjects}-${selectedCycle}-${selectedModule}-${isPeekView}`,
    () =>
      analyticsV2Service.getAdvanceAnalyticsCharts<IChartResponseV2>(
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
            label: "Date",
          }}
          yAxis={{
            key: "count",
            label: "Number of Issues",
            offset: -30,
            dx: -22,
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
        <AnalyticsV2EmptyState
          title={t("workspace_analytics.empty_state_v2.created_vs_resolved.title")}
          description={t("workspace_analytics.empty_state_v2.created_vs_resolved.description")}
          className="h-[350px]"
          assetPath={resolvedPath}
        />
      )}
    </AnalyticsSectionWrapper>
  );
});

export default CreatedVsResolved;
