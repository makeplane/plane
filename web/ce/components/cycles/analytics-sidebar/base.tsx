"use client";
import { FC, Fragment } from "react";
import { observer } from "mobx-react";
// plane ui
import { useTranslation } from "@plane/i18n";
import { TCycleEstimateType } from "@plane/types";
import { Loader } from "@plane/ui";
// components
import { getDate } from "@plane/utils";
import ProgressChart from "@/components/core/sidebar/progress-chart";
import { EstimateTypeDropdown, validateCycleSnapshot } from "@/components/cycles";
// helpers
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
  const { t } = useTranslation();

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
    <div>
      <div className="relative flex items-center justify-between gap-2 pt-4">
        <EstimateTypeDropdown value={estimateType} onChange={onChange} cycleId={cycleId} projectId={projectId} />
      </div>
      <div className="py-4">
        <div>
          {cycleStartDate && cycleEndDate && completionChartDistributionData ? (
            <Fragment>
              <ProgressChart
                distribution={completionChartDistributionData}
                totalIssues={estimateType === "points" ? totalEstimatePoints : totalIssues}
                plotTitle={estimateType === "points" ? t("points") : t("work_items")}
              />
            </Fragment>
          ) : (
            <Loader className="w-full h-[160px] mt-4">
              <Loader.Item width="100%" height="100%" />
            </Loader>
          )}
        </div>
      </div>
    </div>
  );
});
