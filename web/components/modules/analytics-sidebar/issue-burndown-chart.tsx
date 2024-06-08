import { FC, useState } from "react";
import { CustomSelect } from "@plane/ui";
// components
import ProgressChart from "@/components/core/sidebar/progress-chart";
// constants
import { EEstimateSystem } from "@/constants/estimates";
// hooks
import { useAppRouter, useModule, useProjectEstimates } from "@/hooks/store";

type TModuleIssuesBurnDownChart = {
  moduleId: string;
};

const moduleBurnDownChartOptions = [
  { value: "issue_count", label: "Issues" },
  { value: "estimate", label: "Points" },
];

export const ModuleIssuesBurnDownChart: FC<TModuleIssuesBurnDownChart> = (props) => {
  const { moduleId } = props;
  // hooks
  const { getModuleById } = useModule();
  // state
  const [value, setValue] = useState<string>("issue_count");
  // handlers
  const onChange = (value: string) => {
    setValue(value);
    // refetch the module details
  };

  // derived values
  const moduleDetails = getModuleById(moduleId);
  const { projectId } = useAppRouter();
  const { currentActiveEstimateId, areEstimateEnabledByProjectId, estimateById } = useProjectEstimates();

  const isEstimateEnabled = (analyticsOption: string) => {
    if (analyticsOption === "estimate") {
      if (
        projectId &&
        currentActiveEstimateId &&
        areEstimateEnabledByProjectId(projectId) &&
        estimateById(currentActiveEstimateId)?.type === EEstimateSystem.POINTS
      ) {
        return true;
      } else {
        return false;
      }
    }
    return true;
  };

  if (!moduleDetails || !moduleDetails.start_date || !moduleDetails.target_date) return <></>;
  return (
    <div className=" h-full w-full pt-4">
      <div className="relative py-2 flex items-center gap-3 text-custom-text-100">
        <div className="flex items-center justify-center gap-1 text-xs">
          <span className="h-2.5 w-2.5 rounded-full bg-[#A9BBD0]" />
          <span>Ideal</span>
        </div>
        <div className="flex items-center justify-center gap-1 text-xs">
          <span className="h-2.5 w-2.5 rounded-full bg-[#4C8FFF]" />
          <span>Current</span>
        </div>
        <div className="text-sm ml-auto">
          <CustomSelect
            value={value}
            label={<span>{moduleBurnDownChartOptions.find((v) => v.value === value)?.label ?? "None"}</span>}
            onChange={onChange}
            maxHeight="lg"
          >
            {moduleBurnDownChartOptions.map(
              (item) =>
                isEstimateEnabled(item.value) && (
                  <CustomSelect.Option key={item.value} value={item.value}>
                    {item.label}
                  </CustomSelect.Option>
                )
            )}
          </CustomSelect>
        </div>
      </div>

      <div className="relative h-40 w-full max-w-80">
        <ProgressChart
          distribution={moduleDetails.distribution?.completion_chart ?? {}}
          startDate={moduleDetails.start_date}
          endDate={moduleDetails.target_date}
          totalIssues={moduleDetails.total_issues}
        />
      </div>
    </div>
  );
};
