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
const IntakeTrends = observer(() => {
  const { selectedDuration, selectedDurationLabel, selectedProjects, selectedCycle, selectedModule, isPeekView } =
    useAnalytics();
  const params = useParams();
  const { t } = useTranslation();
  const workspaceSlug = params.workspaceSlug.toString();
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/analytics/empty-chart-area" });
  const { data: intakeData, isLoading: isIntakeLoading } = useSWR(
    `intake-trends-${workspaceSlug}-${selectedDuration}-${selectedProjects}-${selectedCycle}-${selectedModule}-${isPeekView}`,
    () =>
      analyticsService.getAdvanceAnalyticsCharts<IChartResponse>(
        workspaceSlug,
        "intake",
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
    if (!intakeData?.data) return [];
    return intakeData.data.map((datum) => ({
      ...datum,
      [datum.key]: datum.count,
      name: renderFormattedDate(datum.key) ?? datum.key,
    }));
  }, [intakeData]);

  return (
    <AnalyticsSectionWrapper
      title={t("workspace_analytics.intake_trends")}
      subtitle={selectedDurationLabel}
      className="col-span-1"
    >
      {isIntakeLoading ? (
        <ChartLoader />
      ) : parsedData && parsedData.length > 0 ? (
        <LineChart
          className="h-[350px] w-full"
          data={parsedData}
          lines={[
            {
              key: "accepted_count",
              label: t("inbox_issue.status.accepted.title"),
              fill: "#1192E833",
              showDot: false,
              smoothCurves: true,
              stroke: "#1192E8",
              dashedLine: false,
            },
            {
              key: "rejected_count",
              label: t("inbox_issue.status.declined.title"),
              fill: "#FA4D56",
              showDot: false,
              smoothCurves: true,
              dashedLine: false,
              stroke: "#FA4D56",
            },
          ]}
          xAxis={{
            key: "name",
            label: t("common.timeline"),
          }}
          yAxis={{
            key: "count",
            label: t("common.completion") + " %",
            dx: -28,
            offset: -24,
          }}
          legend={{
            align: "right",
            verticalAlign: "top",
            layout: "horizontal",
            wrapperStyles: {
              justifyContent: "flex-start",
            },
          }}
          margin={{
            top: 20,
            right: 20,
            bottom: 65,
            left: 20,
          }}
        />
      ) : (
        <AnalyticsEmptyState
          title={t("workspace_analytics.empty_state.intake_trends.title")}
          description={t("workspace_analytics.empty_state.intake_trends.description")}
          className="h-[350px]"
          assetPath={resolvedPath}
        />
      )}
    </AnalyticsSectionWrapper>
  );
});

export default IntakeTrends;
