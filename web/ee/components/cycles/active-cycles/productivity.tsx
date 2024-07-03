import { FC, Fragment, useState } from "react";
import isEmpty from "lodash/isEmpty";
import { observer } from "mobx-react";
import { ICycle, TCyclePlotType } from "@plane/types";
import { CustomSelect } from "@plane/ui";
// components
import ProgressChart from "@/components/core/sidebar/progress-chart";

export type ActiveCycleProductivityProps = {
  cycle: ICycle;
};

const cycleBurnDownChartOptions = [
  { value: "burndown", label: "Issues" },
  { value: "points", label: "Points" },
];

export const ActiveCycleProductivity: FC<ActiveCycleProductivityProps> = observer((props) => {
  const { cycle } = props;
  // state
  const [plotType, setPlotType] = useState<TCyclePlotType>("burndown");
  const isCurrentEstimateTypeIsPoints = !isEmpty(cycle?.estimate_distribution);

  // derived values
  const chartDistributionData = plotType === "points" ? cycle?.estimate_distribution : cycle?.distribution || undefined;
  const completionChartDistributionData = chartDistributionData?.completion_chart || undefined;

  return (
    <div className="flex flex-col gap-4 p-4 min-h-52 border border-custom-border-200 rounded-lg">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg text-custom-text-300 font-medium">Issue burndown</h3>
        {isCurrentEstimateTypeIsPoints && (
          <div className="flex items-center gap-2">
            <CustomSelect
              value={plotType}
              label={<span>{cycleBurnDownChartOptions.find((v) => v.value === plotType)?.label ?? "None"}</span>}
              onChange={(value: TCyclePlotType) => setPlotType(value)}
              maxHeight="lg"
            >
              {cycleBurnDownChartOptions.map((item) => (
                <CustomSelect.Option key={item.value} value={item.value}>
                  {item.label}
                </CustomSelect.Option>
              ))}
            </CustomSelect>
          </div>
        )}
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
          {plotType === "points" ? (
            <span>{`Pending points - ${cycle.backlog_estimate_points + cycle.unstarted_estimate_points + cycle.started_estimate_points}`}</span>
          ) : (
            <span>{`Pending issues - ${cycle.backlog_issues + cycle.unstarted_issues + cycle.started_issues}`}</span>
          )}
        </div>
        <div className="relative -mt-4">
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
    </div>
  );
});
