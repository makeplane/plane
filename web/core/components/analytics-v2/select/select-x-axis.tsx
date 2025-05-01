"use client";

import { ChartXAxisProperty } from "@plane/constants";
import { IAnalyticsParams } from "@plane/types";
// ui
import { CustomSelect } from "@plane/ui";

type Props = {
  value?: ChartXAxisProperty;
  onChange: (val: string) => void;
  params: IAnalyticsParams;
  analyticsOptions: { value: ChartXAxisProperty; label: string }[];
  hiddenOptions?: ChartXAxisProperty[];
};

export const SelectXAxis: React.FC<Props> = (props) => {
  const { value, onChange, params, analyticsOptions, hiddenOptions } = props;
  return (
    <CustomSelect
      value={value}
      label={<span>{analyticsOptions.find((v) => v.value === value)?.label || "Add Property"}</span>}
      onChange={onChange}
      maxHeight="lg"
    >
      {analyticsOptions.map((item) => {
        if (params.segment === item.value) return null;
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
