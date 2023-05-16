// ui
import { CustomSelect } from "components/ui";
// types
import { IAnalyticsParams, TXAxisValues } from "types";
// constants
import { ANALYTICS_X_AXIS_VALUES } from "constants/analytics";

type Props = {
  value: TXAxisValues | null | undefined;
  onChange: () => void;
  params: IAnalyticsParams;
};

export const SelectSegment: React.FC<Props> = ({ value, onChange, params }) => (
  <CustomSelect
    value={value}
    label={
      <span>
        {ANALYTICS_X_AXIS_VALUES.find((v) => v.value === value)?.label ?? (
          <span className="text-brand-secondary">No value</span>
        )}
      </span>
    }
    onChange={onChange}
    width="w-full"
    maxHeight="lg"
  >
    <CustomSelect.Option value={null}>No value</CustomSelect.Option>
    {ANALYTICS_X_AXIS_VALUES.map((item) => {
      if (params.x_axis === item.value) return null;

      return (
        <CustomSelect.Option key={item.value} value={item.value}>
          {item.label}
        </CustomSelect.Option>
      );
    })}
  </CustomSelect>
);
