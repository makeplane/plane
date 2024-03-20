import { FC } from "react";
// types
import { ICycle } from "@plane/types";
// components
import ProgressChart from "@/components/core/sidebar/progress-chart";

export type ActiveCycleProductivityProps = {
  cycle: ICycle;
};

export const ActiveCycleProductivity: FC<ActiveCycleProductivityProps> = (props) => {
  const { cycle } = props;

  return (
    <div className="flex flex-col gap-4 p-4 min-h-52 border border-custom-border-200 rounded-lg">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg text-custom-text-300 font-medium">Issue burndown</h3>
      </div>

      <div className="h-full w-full">
        <div className="flex items-center justify-between gap-4 py-1 text-xs text-custom-text-300">
          <div className="flex items-center gap-3 text-custom-text-300">
            <div className="flex items-center justify-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-[#A9BBD0]" />
              <span>Ideal</span>
            </div>
            <div className="flex items-center justify-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-[#4C8FFF]" />
              <span>Current</span>
            </div>
          </div>
          <span>{`Pending issues - ${cycle.backlog_issues + cycle.unstarted_issues + cycle.started_issues}`}</span>
        </div>
        <div className="relative -mt-4">
          <ProgressChart
            distribution={cycle.distribution?.completion_chart ?? {}}
            startDate={cycle.start_date ?? ""}
            endDate={cycle.end_date ?? ""}
            totalIssues={cycle.total_issues}
          />
        </div>
      </div>
    </div>
  );
};
