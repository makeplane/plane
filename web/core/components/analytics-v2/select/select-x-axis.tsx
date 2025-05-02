"use client";

import { ChartXAxisProperty } from "@plane/constants";
import { IAnalyticsV2Params } from "@plane/types";
// ui
import { CustomSelect } from "@plane/ui";
import { cn } from "@plane/utils";

type Props = {
  value?: ChartXAxisProperty;
  onChange: (val: ChartXAxisProperty | null) => void;
  options: { value: ChartXAxisProperty; label: string }[];
  placeholder?: string;
  hiddenOptions?: ChartXAxisProperty[];
  allowNoValue?: boolean;
};

export const SelectXAxis: React.FC<Props> = (props) => {
  const { value, onChange, options, hiddenOptions, placeholder, allowNoValue } = props;
  return (
    <CustomSelect
      value={value}
      label={<span className={cn("text-custom-text-200", value && "text-custom-text-100")}>{options.find((v) => v.value === value)?.label || placeholder || "Add Property"}</span>}
      onChange={onChange}
      maxHeight="lg"
    >
      {allowNoValue && <CustomSelect.Option value={null}>No value</CustomSelect.Option>}
      {options.map((item) => {
        if (hiddenOptions?.includes(item.value)) return null;
        return (
          <CustomSelect.Option key={item.value} value={item.value}>
            {item.label}
          </CustomSelect.Option>
        );
      })}
    </CustomSelect>
  );
};
