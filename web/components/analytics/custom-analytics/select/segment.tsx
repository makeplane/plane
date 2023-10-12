import { useRouter } from "next/router";

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

export const SelectSegment: React.FC<Props> = ({ value, onChange, params }) => {
  const router = useRouter();
  const { cycleId, moduleId } = router.query;

  return (
    <CustomSelect
      value={value}
      label={
        <span>
          {ANALYTICS_X_AXIS_VALUES.find((v) => v.value === value)?.label ?? (
            <span className="text-custom-text-200">No value</span>
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
