"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { ANALYTICS_V2_Y_AXIS_VALUES, ChartYAxisMetric } from "@plane/constants";
import { CustomSelect } from "@plane/ui";
// hooks
import { useProjectEstimates } from "@/hooks/store";
// plane web constants
import { EEstimateSystem } from "@/plane-web/constants/estimates";

type Props = {
  value: ChartYAxisMetric;
  onChange: (val: string) => void;
  hiddenOptions?: ChartYAxisMetric[];
};

export const SelectYAxis: React.FC<Props> = observer(({ value, onChange, hiddenOptions }) => {
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
      label={<span>{ANALYTICS_V2_Y_AXIS_VALUES.find((v) => v.value === value)?.label ?? "Add Metric"}</span>}
      onChange={onChange}
      maxHeight="lg"
    >
      {ANALYTICS_V2_Y_AXIS_VALUES.filter((item) => !hiddenOptions?.includes(item.value)).map(
        (item) =>
          isEstimateEnabled(item.value) && (
            <CustomSelect.Option key={item.value} value={item.value}>
              {item.label}
            </CustomSelect.Option>
          )
      )}
    </CustomSelect>
  );
});
