import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
/**
 * Plane  imports
 */
import { useTranslation } from "@plane/i18n";
import { BarChart } from "@plane/propel/charts/bar-chart";
import { TChartData, UserInsightColumns } from "@plane/types";

/**
 * Local imports
 */
import AnalyticsSectionWrapper from "@/components/analytics/analytics-section-wrapper";
import AnalyticsEmptyState from "@/components/analytics/empty-state";
import { ChartLoader } from "@/components/analytics/loaders";

import { useMember } from "@/hooks/store/use-member";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
import { UserAvatarName } from "../../user-avatar-name";
import { CustomTooltip } from "./tooltip";

interface WiResolvedVsPendingProps {
  data?: UserInsightColumns[];
  isLoading: boolean;
  selectedDurationLabel: string;
}

const WiResolvedVsPending = observer(
  ({
    data: resolvedVsPendingData,
    isLoading: isResolvedVsPendingLoading,
    selectedDurationLabel,
  }: WiResolvedVsPendingProps) => {
    const { t } = useTranslation();
    const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/analytics/empty-chart-area" });
    const { getUserDetails } = useMember();

    /**
     * derived values
     */

    const resolvedVsPendingParsedData: TChartData<string, string>[] = useMemo(() => {
      if (!resolvedVsPendingData) return [];
      return resolvedVsPendingData.map((datum) => {
        const userDetails = getUserDetails(datum.user_id);
        return {
          ...datum,
          pending: datum.started_work_items + datum.un_started_work_items + datum.backlog_work_items,
          total:
            datum.completed_work_items +
            datum.started_work_items +
            datum.un_started_work_items +
            datum.backlog_work_items,
          name: userDetails?.display_name ?? "",
        };
      });
    }, [resolvedVsPendingData, getUserDetails]);

    const CustomStyledXAxisTick = useCallback(
      ({ x, y, payload }: any) => (
        <g transform={`translate(${x - 8},${y})`}>
          <foreignObject width={100} height={100}>
            <UserAvatarName userId={payload.value} showName={false} />
          </foreignObject>
        </g>
      ),
      []
    );

    return (
      <AnalyticsSectionWrapper
        title={t("workspace_analytics.workitem_resolved_vs_pending")}
        subtitle={selectedDurationLabel}
        className="col-span-1"
      >
        {isResolvedVsPendingLoading ? (
          <ChartLoader />
        ) : resolvedVsPendingParsedData && resolvedVsPendingParsedData.length > 0 ? (
          <BarChart
            className="h-[350px] w-full"
            data={resolvedVsPendingParsedData}
            bars={[
              {
                key: "pending",
                label: "Pending",
                fill: "#D7D7D7",
                stackId: "bar-one",
                textClassName: "",
              },
              {
                key: "completed_work_items",
                label: "Resolved",
                fill: "#7CC474",
                stackId: "bar-one",
                textClassName: "",
              },
            ]}
            xAxis={{
              key: "user_id",
              label: t("common.users"),
            }}
            yAxis={{
              key: "count",
              label: t("common.no_of", { entity: t("work_items") }),
              offset: -30,
              dx: -22,
            }}
            customTicks={{
              x: CustomStyledXAxisTick,
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
            customTooltipContent={({ active, label, payload }) => (
              <CustomTooltip active={active} label={label} payload={payload} member={getUserDetails(label)} />
            )}
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
  }
);

export default WiResolvedVsPending;
