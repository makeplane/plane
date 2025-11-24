import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { EEstimateSystem } from "@plane/constants";
import { ProjectIcon } from "@plane/propel/icons";
import type { ChartYAxisMetric } from "@plane/types";
// plane package imports
import { CustomSelect } from "@plane/ui";
// hooks
import { useProjectEstimates } from "@/hooks/store/estimates";
// plane web constants
type Props = {
  value: ChartYAxisMetric;
  onChange: (val: ChartYAxisMetric | null) => void;
  hiddenOptions?: ChartYAxisMetric[];
  options: { value: ChartYAxisMetric; label: string }[];
};

export const SelectYAxis = observer(function SelectYAxis({ value, onChange, hiddenOptions, options }: Props) {
  // hooks
  const { projectId } = useParams();
  const { areEstimateEnabledByProjectId, currentActiveEstimateId, estimateById } = useProjectEstimates();

  const isEstimateEnabled = (analyticsOption: string) => {
    if (analyticsOption === "estimate") {
      if (
        projectId &&
        currentActiveEstimateId &&
        areEstimateEnabledByProjectId(projectId.toString()) &&
        estimateById(currentActiveEstimateId)?.type === EEstimateSystem.POINTS
      ) {
        return true;
      } else {
        return false;
      }
    }

    return true;
  };

  return (
    <CustomSelect
      value={value}
      label={
        <div className="flex items-center gap-2">
          <ProjectIcon className="h-3 w-3" />
          <span>{options.find((v) => v.value === value)?.label ?? "Add Metric"}</span>
        </div>
      }
      onChange={onChange}
      maxHeight="lg"
    >
      {options.map((item) => {
        if (hiddenOptions?.includes(item.value)) return null;
        return (
          isEstimateEnabled(item.value) && (
            <CustomSelect.Option key={item.value} value={item.value}>
              {item.label}
            </CustomSelect.Option>
          )
        );
      })}
    </CustomSelect>
  );
});
