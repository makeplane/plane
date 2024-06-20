"use client";

import { useParams } from "next/navigation";
import { IAnalyticsParams, TXAxisValues } from "@plane/types";
// ui
import { CustomSelect } from "@plane/ui";

type Props = {
  value: TXAxisValues;
  onChange: (val: string) => void;
  params: IAnalyticsParams;
  analyticsOptions: { value: TXAxisValues; label: string }[];
};

export const SelectXAxis: React.FC<Props> = (props) => {
  const { value, onChange, params, analyticsOptions } = props;

  const { cycleId, moduleId } = useParams();

  return (
    <CustomSelect
      value={value}
      label={<span>{analyticsOptions.find((v) => v.value === value)?.label}</span>}
      onChange={onChange}
      maxHeight="lg"
    >
      {analyticsOptions.map((item) => {
        if (params.segment === item.value) return null;
        if (cycleId && item.value === "issue_cycle__cycle_id") return null;
        if (moduleId && item.value === "issue_module__module_id") return null;

        return (
          <CustomSelect.Option key={item.value} value={item.value}>
            {item.label}
          </CustomSelect.Option>
        );
      })}
    </CustomSelect>
  );
};
