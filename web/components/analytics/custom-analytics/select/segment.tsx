import { useRouter } from "next/router";
import { IAnalyticsParams, TXAxisValues } from "@plane/types";

// ui
import { CustomSelect } from "@plane/ui";

type Props = {
  value: TXAxisValues | null | undefined;
  onChange: () => void;
  params: IAnalyticsParams;
  analyticsOptions: { value: TXAxisValues; label: string }[];
};

export const SelectSegment: React.FC<Props> = ({ value, onChange, params, analyticsOptions }) => {
  const router = useRouter();
  const { cycleId, moduleId } = router.query;

  return (
    <CustomSelect
      value={value}
      label={
        <span>
          {analyticsOptions.find((v) => v.value === value)?.label ?? (
            <span className="text-custom-text-200">No value</span>
          )}
        </span>
      }
      onChange={onChange}
      maxHeight="lg"
    >
      <CustomSelect.Option value={null}>No value</CustomSelect.Option>
      {analyticsOptions.map((item) => {
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
