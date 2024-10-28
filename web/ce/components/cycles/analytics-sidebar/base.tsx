"use client";
import { FC, Fragment } from "react";
import { observer } from "mobx-react";
// plane ui
import { TCycleEstimateType } from "@plane/types";
import { Loader } from "@plane/ui";
// components
import ProgressChart from "@/components/core/sidebar/progress-chart";
import { EstimateTypeDropdown, validateCycleSnapshot } from "@/components/cycles";
// helpers
import { getDate } from "@/helpers/date-time.helper";
// hooks
import { useCycle } from "@/hooks/store";

type ProgressChartProps = {
  workspaceSlug: string;
  projectId: string;
  cycleId: string;
};
export const SidebarChart: FC<ProgressChartProps> = observer((props) => {
  const { workspaceSlug, projectId, cycleId } = props;

  // hooks
  const { getEstimateTypeByCycleId, getCycleById, fetchCycleDetails, fetchArchivedCycleDetails, setEstimateType } =
    useCycle();

  // derived data
  const cycleDetails = validateCycleSnapshot(getCycleById(cycleId));
  const cycleStartDate = getDate(cycleDetails?.start_date);
  const cycleEndDate = getDate(cycleDetails?.end_date);
  const totalEstimatePoints = cycleDetails?.total_estimate_points || 0;
  const totalIssues = cycleDetails?.total_issues || 0;
  const estimateType = getEstimateTypeByCycleId(cycleId);

  const chartDistributionData =
    estimateType === "points" ? cycleDetails?.estimate_distribution : cycleDetails?.distribution || undefined;

  const completionChartDistributionData = chartDistributionData?.completion_chart || undefined;

  if (!workspaceSlug || !projectId || !cycleId) return null;

  const isArchived = !!cycleDetails?.archived_at;

  // handlers
  const onChange = async (value: TCycleEstimateType) => {
    setEstimateType(cycleId, value);
    if (!workspaceSlug || !projectId || !cycleId) return;
    try {
      if (isArchived) {
        await fetchArchivedCycleDetails(workspaceSlug, projectId, cycleId);
      } else {
        await fetchCycleDetails(workspaceSlug, projectId, cycleId);
      }
    } catch (err) {
      console.error(err);
      setEstimateType(cycleId, estimateType);
    }
  };
  return (
    <>
      <div className="relative flex items-center justify-between gap-2 pt-4">
        <EstimateTypeDropdown value={estimateType} onChange={onChange} cycleId={cycleId} projectId={projectId} />
      </div>
      <div className="py-4">
        <div>
          <div className="relative flex items-center gap-2">
            <div className="flex items-center justify-center gap-1 text-xs">
              <span className="h-2.5 w-2.5 rounded-full bg-[#A9BBD0]" />
              <span>Ideal</span>
            </div>
            <div className="flex items-center justify-center gap-1 text-xs">
              <span className="h-2.5 w-2.5 rounded-full bg-[#4C8FFF]" />
              <span>Current</span>
            </div>
          </div>
          {cycleStartDate && cycleEndDate && completionChartDistributionData ? (
            <Fragment>
              <ProgressChart
                distribution={completionChartDistributionData}
                startDate={cycleStartDate}
                endDate={cycleEndDate}
                totalIssues={estimateType === "points" ? totalEstimatePoints : totalIssues}
                plotTitle={estimateType === "points" ? "points" : "issues"}
              />
            </Fragment>
          ) : (
            <Loader className="w-full h-[160px] mt-4">
              <Loader.Item width="100%" height="100%" />
            </Loader>
          )}
        </div>
      </div>
    </>
  );
});
