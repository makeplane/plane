import React from "react";
import { TCycleEstimateType } from "@plane/types";
import { CustomSelect } from "@plane/ui";
import { useCycle, useProjectEstimates } from "@/hooks/store";
import { cycleEstimateOptions } from "../analytics-sidebar";

type TProps = {
  value: TCycleEstimateType;
  onChange: (value: TCycleEstimateType) => Promise<void>;
  showDefault?: boolean;
  projectId: string;
  cycleId: string;
};

export const EstimateTypeDropdown = (props: TProps) => {
  const { value, onChange, projectId, cycleId, showDefault = false } = props;
  const { getIsPointsDataAvailable } = useCycle();
  const { areEstimateEnabledByProjectId } = useProjectEstimates();
  const isCurrentProjectEstimateEnabled = projectId && areEstimateEnabledByProjectId(projectId) ? true : false;
  return getIsPointsDataAvailable(cycleId) || isCurrentProjectEstimateEnabled ? (
    <div className="relative flex items-center gap-2">
      <CustomSelect
        value={value}
        label={<span>{cycleEstimateOptions.find((v) => v.value === value)?.label ?? "None"}</span>}
        onChange={onChange}
        maxHeight="lg"
        buttonClassName="bg-custom-background-90 border-none rounded text-sm font-medium "
      >
        {cycleEstimateOptions.map((item) => (
          <CustomSelect.Option key={item.value} value={item.value}>
            {item.label}
          </CustomSelect.Option>
        ))}
      </CustomSelect>
    </div>
  ) : showDefault ? (
    <span className="capitalize">{value}</span>
  ) : null;
};
