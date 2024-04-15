// ui
import { TYAxisValues } from "@plane/types";
import { CustomSelect } from "@plane/ui";
// types
import { ANALYTICS_Y_AXIS_VALUES } from "@/constants/analytics";
// constants

type Props = {
  value: TYAxisValues;
  onChange: () => void;
};

export const SelectYAxis: React.FC<Props> = ({ value, onChange }) => (
  <CustomSelect
    value={value}
    label={<span>{ANALYTICS_Y_AXIS_VALUES.find((v) => v.value === value)?.label ?? "None"}</span>}
    onChange={onChange}
    maxHeight="lg"
  >
    {ANALYTICS_Y_AXIS_VALUES.map((item) => (
      <CustomSelect.Option key={item.value} value={item.value}>
        {item.label}
      </CustomSelect.Option>
    ))}
  </CustomSelect>
);
