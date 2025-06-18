import { useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane package imports
import { useTranslation } from "@plane/i18n";
import { LineChart } from "@plane/propel/charts/line-chart";
import { IChartResponse, TChartData } from "@plane/types";
import { renderFormattedDate } from "@plane/utils";
// hooks
import AnalyticsSectionWrapper from "@/components/analytics/analytics-section-wrapper";
import AnalyticsEmptyState from "@/components/analytics/empty-state";
import { ChartLoader } from "@/components/analytics/loaders";
import { useAnalytics } from "@/hooks/store/use-analytics";
// services
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
import { AnalyticsService } from "@/services/analytics.service";
// plane web components

const analyticsService = new AnalyticsService();
const ActiveUsers = observer(() => {
  const { selectedDuration, selectedDurationLabel, selectedProjects, selectedCycle, selectedModule, isPeekView } =
    useAnalytics();
  const params = useParams();
  const { t } = useTranslation();
  const workspaceSlug = params.workspaceSlug.toString();
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/analytics/empty-chart-area" });
  const { data: activeUsersData, isLoading: isActiveUsersLoading } = useSWR(
    `active-users-${workspaceSlug}-${selectedDuration}-${selectedProjects}-${selectedCycle}-${selectedModule}-${isPeekView}`,
    () =>
      analyticsService.getAdvanceAnalyticsCharts<IChartResponse>(
        workspaceSlug,
        "users",
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
    if (!activeUsersData?.data) return [];
    return activeUsersData.data.map((datum) => ({
      ...datum,
      [datum.key]: datum.count,
      name: renderFormattedDate(datum.key) ?? datum.key,
    }));
  }, [activeUsersData]);

  return (
    <AnalyticsSectionWrapper
      title={t("workspace_analytics.active_users")}
      subtitle={selectedDurationLabel}
      className="col-span-1"
    >
      {isActiveUsersLoading ? (
        <ChartLoader />
      ) : parsedData && parsedData.length > 0 ? (
        <LineChart
          className="h-[350px] w-full"
          data={parsedData}
          lines={[
            {
              key: "active_users",
              label: "Active Users",
              fill: "#19803833",
              showDot: false,
              smoothCurves: true,
              stroke: "#198038",
              dashedLine: false,
            },
            {
              key: "total_users",
              label: "Total Users",
              fill: "#1192E833",
              showDot: false,
              smoothCurves: true,
              dashedLine: false,
              stroke: "#1192E8",
            },
          ]}
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

export default ActiveUsers;
