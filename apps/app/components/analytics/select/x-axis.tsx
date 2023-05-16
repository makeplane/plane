// ui
import { CustomSelect } from "components/ui";
// types
import { IAnalyticsParams, TXAxisValues, TYAxisValues } from "types";
// constants
import { ANALYTICS_X_AXIS_VALUES, ANALYTICS_Y_AXIS_VALUES } from "constants/analytics";

type Props = {
  value: TXAxisValues;
  onChange: (val: string) => void;
};

export const SelectXAxis: React.FC<Props> = ({ value, onChange }) => (
  <CustomSelect
    value={value}
    label={<span>{ANALYTICS_X_AXIS_VALUES.find((v) => v.value === value)?.label}</span>}
    onChange={onChange}
    width="w-full"
    maxHeight="lg"
  >
    {ANALYTICS_X_AXIS_VALUES.map((item) => (
      <CustomSelect.Option key={item.value} value={item.value}>
        {item.label}
      </CustomSelect.Option>
    ))}
  </CustomSelect>
);
