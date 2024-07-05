import { FC, Fragment, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { ICycle, TCyclePlotType } from "@plane/types";
import { CustomSelect, Spinner } from "@plane/ui";
// components
import ProgressChart from "@/components/core/sidebar/progress-chart";
import { EmptyState } from "@/components/empty-state";
// constants
import { EmptyStateType } from "@/constants/empty-state";
import { useCycle, useProjectEstimates } from "@/hooks/store";
// plane web constants
import { EEstimateSystem } from "@/plane-web/constants/estimates";

export type ActiveCycleProductivityProps = {
  workspaceSlug: string;
  projectId: string;
  cycle: ICycle;
};

const cycleBurnDownChartOptions = [
  { value: "burndown", label: "Issues" },
  { value: "points", label: "Points" },
];

export const ActiveCycleProductivity: FC<ActiveCycleProductivityProps> = observer((props) => {
  const { workspaceSlug, projectId, cycle } = props;
  // hooks
  const { getPlotTypeByCycleId, setPlotType, fetchCycleDetails } = useCycle();
  const { currentActiveEstimateId, areEstimateEnabledByProjectId, estimateById } = useProjectEstimates();
  // state
  const [loader, setLoader] = useState(false);
  // derived values
  const plotType: TCyclePlotType = (cycle && getPlotTypeByCycleId(cycle.id)) || "burndown";

  const onChange = async (value: TCyclePlotType) => {
    if (!workspaceSlug || !projectId || !cycle || !cycle.id) return;
    setPlotType(cycle.id, value);
    try {
      setLoader(true);
      await fetchCycleDetails(workspaceSlug, projectId, cycle.id);
      setLoader(false);
    } catch (error) {
      setLoader(false);
      setPlotType(cycle.id, plotType);
    }
  };

  const isCurrentProjectEstimateEnabled = projectId && areEstimateEnabledByProjectId(projectId) ? true : false;
  const estimateDetails =
    isCurrentProjectEstimateEnabled && currentActiveEstimateId && estimateById(currentActiveEstimateId);
  const isCurrentEstimateTypeIsPoints = estimateDetails && estimateDetails?.type === EEstimateSystem.POINTS;

  const chartDistributionData = plotType === "points" ? cycle?.estimate_distribution : cycle?.distribution || undefined;
  const completionChartDistributionData = chartDistributionData?.completion_chart || undefined;

  return (
    <div className="flex flex-col justify-center min-h-[17rem] gap-5 px-3.5 py-4 bg-custom-background-100 border border-custom-border-200 rounded-lg">
      <div className="relative flex items-center justify-between gap-4 -mt-7">
        <Link href={`/${workspaceSlug}/projects/${projectId}/cycles/${cycle?.id}`}>
          <h3 className="text-base text-custom-text-300 font-semibold">Issue burndown</h3>
        </Link>
        {isCurrentEstimateTypeIsPoints && (
          <div className="relative flex items-center gap-2">
            <CustomSelect
              value={plotType}
              label={<span>{cycleBurnDownChartOptions.find((v) => v.value === plotType)?.label ?? "None"}</span>}
              onChange={onChange}
              maxHeight="lg"
            >
              {cycleBurnDownChartOptions.map((item) => (
                <CustomSelect.Option key={item.value} value={item.value}>
                  {item.label}
                </CustomSelect.Option>
              ))}
            </CustomSelect>
            {loader && <Spinner className="h-3 w-3" />}
          </div>
        )}
      </div>

      <Link href={`/${workspaceSlug}/projects/${projectId}/cycles/${cycle?.id}`}>
        {cycle.total_issues > 0 ? (
          <>
            <div className="h-full w-full px-2">
              <div className="flex items-center justify-between gap-4 py-1 text-xs text-custom-text-300">
                <div className="flex items-center gap-3 text-custom-text-300">
                  <div className="flex items-center justify-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-[#A9BBD0]" />
                    <span>Ideal</span>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-[#4C8FFF]" />
                    <span>Current</span>
                  </div>
                </div>
                {plotType === "points" ? (
                  <span>{`Pending points - ${cycle.backlog_estimate_points + cycle.unstarted_estimate_points + cycle.started_estimate_points}`}</span>
                ) : (
                  <span>{`Pending issues - ${cycle.backlog_issues + cycle.unstarted_issues + cycle.started_issues}`}</span>
                )}
              </div>

              <div className="relative  h-full">
                {completionChartDistributionData && (
                  <Fragment>
                    {plotType === "points" ? (
                      <ProgressChart
                        distribution={completionChartDistributionData}
                        startDate={cycle.start_date ?? ""}
                        endDate={cycle.end_date ?? ""}
                        totalIssues={cycle.total_estimate_points || 0}
                        plotTitle={"points"}
                      />
                    ) : (
                      <ProgressChart
                        distribution={completionChartDistributionData}
                        startDate={cycle.start_date ?? ""}
                        endDate={cycle.end_date ?? ""}
                        totalIssues={cycle.total_issues || 0}
                        plotTitle={"issues"}
                      />
                    )}
                  </Fragment>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center h-full w-full">
              <EmptyState type={EmptyStateType.ACTIVE_CYCLE_CHART_EMPTY_STATE} layout="screen-simple" size="sm" />
            </div>
          </>
        )}
      </Link>
    </div>
  );
});
