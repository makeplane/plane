import { FC, Fragment, useState } from "react";
import isEmpty from "lodash/isEmpty";
import { observer } from "mobx-react";
import useSWR from "swr";
import { ICycle, TCycleEstimateType, TCyclePlotType } from "@plane/types";
import { CustomSelect, Loader } from "@plane/ui";
// components
import ProgressChart from "@/components/core/sidebar/progress-chart";
// services
import { CycleService } from "@/services/cycle.service";

const cycleService = new CycleService();
export type ActiveCycleProductivityProps = {
  cycle: ICycle;
  workspaceSlug: string;
};

const cycleBurnDownChartOptions = [
  { value: "issues", label: "Work items" },
  { value: "points", label: "Points" },
];

export const ActiveCycleProductivity: FC<ActiveCycleProductivityProps> = observer((props) => {
  const { cycle, workspaceSlug } = props;

  const { data: estimate_distribution } = useSWR(
    `PROJECTS_${cycle.project_detail.id}_CYCLES_ANALYTICS_POINTS_${cycle.id}`,
    workspaceSlug && cycle?.project_detail.id && cycle?.id
      ? () =>
          cycleService.workspaceActiveCyclesAnalytics(
            workspaceSlug.toString(),
            cycle.project_detail.id,
            cycle.id,
            "points"
          )
      : null,
    {
      revalidateOnFocus: false,
    }
  );
  const { data: distribution } = useSWR(
    `PROJECTS_${cycle.project_detail.id}_CYCLES_ANALYTICS_ISSUES_${cycle.id}`,
    workspaceSlug && cycle?.project_detail?.id && cycle?.id
      ? () =>
          cycleService.workspaceActiveCyclesAnalytics(
            workspaceSlug.toString(),
            cycle.project_detail.id,
            cycle.id,
            "issues"
          )
      : null,
    {
      revalidateOnFocus: false,
    }
  );

  // state
  const [plotType, setPlotType] = useState<TCycleEstimateType>("issues");
  const isCurrentEstimateTypeIsPoints = estimate_distribution && !isEmpty(estimate_distribution.completion_chart);

  // derived values
  const chartDistributionData = plotType === "points" ? estimate_distribution : distribution || undefined;
  const completionChartDistributionData = chartDistributionData?.completion_chart || undefined;

  return (
    <div className="flex flex-col gap-4 p-4 min-h-52 border border-custom-border-200 rounded-lg">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg text-custom-text-300 font-medium">Work item burndown</h3>
        {estimate_distribution ? (
          isCurrentEstimateTypeIsPoints && (
            <div className="flex items-center gap-2">
              <CustomSelect
                value={plotType}
                label={<span>{cycleBurnDownChartOptions.find((v) => v.value === plotType)?.label ?? "None"}</span>}
                onChange={(value: TCycleEstimateType) => setPlotType(value)}
                maxHeight="lg"
              >
                {cycleBurnDownChartOptions.map((item) => (
                  <CustomSelect.Option key={item.value} value={item.value}>
                    {item.label}
                  </CustomSelect.Option>
                ))}
              </CustomSelect>
            </div>
          )
        ) : (
          <Loader>
            <Loader.Item width="50px" height="20px" />
          </Loader>
        )}
      </div>

      <div className="h-full w-full">
        {estimate_distribution && (
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
              <span>{`Pending work items - ${cycle.backlog_issues + cycle.unstarted_issues + cycle.started_issues}`}</span>
            )}
          </div>
        )}
        <div className="relative -mt-4">
          {estimate_distribution ? (
            completionChartDistributionData && (
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
                    plotTitle={"work items"}
                  />
                )}
              </Fragment>
            )
          ) : (
            <Loader>
              <Loader.Item width="100%" height="150px" />
            </Loader>
          )}
        </div>
      </div>
    </div>
  );
});
