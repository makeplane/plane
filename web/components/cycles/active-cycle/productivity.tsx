import { FC } from "react";
// types
import { ICycle } from "@plane/types";
// components
import ProgressChart from "@/components/core/sidebar/progress-chart";
import { EmptyState } from "@/components/empty-state";
// constants
import { EmptyStateType } from "@/constants/empty-state";

export type ActiveCycleProductivityProps = {
  cycle: ICycle;
};

export const ActiveCycleProductivity: FC<ActiveCycleProductivityProps> = (props) => {
  const { cycle } = props;

  return (
    <div className="flex flex-col justify-center min-h-[17rem] gap-5 py-4 px-3.5 bg-custom-background-100 border border-custom-border-200 rounded-lg">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-base text-custom-text-300 font-semibold">Issue burndown</h3>
      </div>
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
              <span>{`Pending issues - ${cycle.backlog_issues + cycle.unstarted_issues + cycle.started_issues}`}</span>
            </div>
            <div className="relative  h-full">
              <ProgressChart
                className="h-full"
                distribution={cycle.distribution?.completion_chart ?? {}}
                startDate={cycle.start_date ?? ""}
                endDate={cycle.end_date ?? ""}
                totalIssues={cycle.total_issues}
              />
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
    </div>
  );
};
