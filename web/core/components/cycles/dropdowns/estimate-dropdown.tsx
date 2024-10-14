import React from "react";
import { TCycleEstimateType } from "@plane/types";
import { CustomSelect } from "@plane/ui";
import { useProjectEstimates } from "@/hooks/store";
import { cycleEstimateOptions } from "../analytics-sidebar";

export type TDropdownProps = {
  value: string;
  onChange: (value: TCycleEstimateType) => Promise<void>;
  options: any[];
};

type TProps = {
  showEstimateSelection: boolean | undefined;
  estimateType: TCycleEstimateType;
  handleEstimateChange: (value: TCycleEstimateType) => Promise<void>;
  projectId: string;
  defaultValue?: string | React.ReactNode;
};

const Dropdown = ({ value, onChange, options }: TDropdownProps) => (
  <div className="relative flex items-center gap-2">
    <CustomSelect
      value={value}
      label={<span>{options.find((v) => v.value === value)?.label ?? "None"}</span>}
      onChange={onChange}
      maxHeight="lg"
      buttonClassName="bg-custom-background-90 border-none rounded text-sm font-medium "
    >
      {options.map((item) => (
        <CustomSelect.Option key={item.value} value={item.value}>
          {item.label}
        </CustomSelect.Option>
      ))}
    </CustomSelect>
  </div>
);
export const CycleEstimateOptions = (props: TProps) => {
  const { showEstimateSelection, estimateType, handleEstimateChange, projectId, defaultValue = null } = props;

  const { areEstimateEnabledByProjectId } = useProjectEstimates();
  const isCurrentProjectEstimateEnabled = projectId && areEstimateEnabledByProjectId(projectId) ? true : false;
  return showEstimateSelection && isCurrentProjectEstimateEnabled ? (
    <Dropdown value={estimateType} onChange={handleEstimateChange} options={cycleEstimateOptions} />
  ) : (
    defaultValue
  );
};
