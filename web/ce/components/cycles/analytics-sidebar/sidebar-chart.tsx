import { Fragment } from "react";
import { TCycleDistribution, TCycleEstimateDistribution } from "@plane/types";
import { Loader } from "@plane/ui";
import ProgressChart from "@/components/core/sidebar/progress-chart";

type ProgressChartProps = {
  chartDistributionData: TCycleEstimateDistribution | TCycleDistribution | undefined;
  cycleStartDate: Date | undefined;
  cycleEndDate: Date | undefined;
  totalEstimatePoints: number;
  totalIssues: number;
  plotType: string;
};
export const SidebarBaseChart = (props: ProgressChartProps) => {
  const { chartDistributionData, cycleStartDate, cycleEndDate, totalEstimatePoints, totalIssues, plotType } = props;
  const completionChartDistributionData = chartDistributionData?.completion_chart || undefined;

  return (
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
          {plotType === "points" ? (
            <ProgressChart
              distribution={completionChartDistributionData}
              startDate={cycleStartDate}
              endDate={cycleEndDate}
              totalIssues={totalEstimatePoints}
              plotTitle={"points"}
            />
          ) : (
            <ProgressChart
              distribution={completionChartDistributionData}
              startDate={cycleStartDate}
              endDate={cycleEndDate}
              totalIssues={totalIssues}
              plotTitle={"issues"}
            />
          )}
        </Fragment>
      ) : (
        <Loader className="w-full h-[160px] mt-4">
          <Loader.Item width="100%" height="100%" />
        </Loader>
      )}
    </div>
  );
};
