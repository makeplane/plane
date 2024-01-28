import { FC } from "react";
// components
import ProgressChart from "components/core/sidebar/progress-chart";
// types
import { ICycle } from "@plane/types";

export type ActiveCycleProductivityProps = {
  cycle: ICycle;
};

export const ActiveCycleProductivity: FC<ActiveCycleProductivityProps> = (props) => {
  const { cycle } = props;

  return (
    <div className="flex flex-col gap-4 px-3 pt-2 min-h-52 border-r-0 border-t border-custom-border-300 lg:border-r">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-medium">Issue Burndown</h3>
      </div>

      <div className="relative ">
        <ProgressChart
          distribution={cycle.distribution?.completion_chart ?? {}}
          startDate={cycle.start_date ?? ""}
          endDate={cycle.end_date ?? ""}
          totalIssues={cycle.total_issues}
        />
      </div>
    </div>
  );
};
