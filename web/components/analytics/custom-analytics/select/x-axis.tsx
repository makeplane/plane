import { useRouter } from "next/router";

// ui
import { CustomSelect } from "components/ui";
// types
import { TXAxisValues } from "types";
// constants
import { ANALYTICS_X_AXIS_VALUES } from "constants/analytics";

type Props = {
  value: TXAxisValues;
  onChange: (val: string) => void;
};

export const SelectXAxis: React.FC<Props> = ({ value, onChange }) => {
  const router = useRouter();
  const { cycleId, moduleId } = router.query;

  return (
    <CustomSelect
      value={value}
      label={<span>{ANALYTICS_X_AXIS_VALUES.find((v) => v.value === value)?.label}</span>}
      onChange={onChange}
      width="w-full"
      maxHeight="lg"
    >
      {ANALYTICS_X_AXIS_VALUES.map((item) => {
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
