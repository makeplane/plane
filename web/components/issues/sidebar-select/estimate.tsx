import React from "react";
import { observer } from "mobx-react-lite";
import { Triangle } from "lucide-react";
// store hooks
import { useEstimate } from "hooks/store";
// ui
import { CustomSelect } from "@plane/ui";

type Props = {
  value: number | null;
  onChange: (val: number | null) => void;
  disabled?: boolean;
};

export const SidebarEstimateSelect: React.FC<Props> = observer((props) => {
  const { value, onChange, disabled = false } = props;

  const { activeEstimateDetails, getEstimatePointValue } = useEstimate();

  const currentEstimate = getEstimatePointValue(value);

  return (
    <CustomSelect
      value={value}
      customButton={
        <div className="flex items-center gap-1.5 rounded bg-custom-background-80 px-2.5 py-0.5 text-xs">
          {currentEstimate ? (
            <>
              <Triangle className={`h-3 w-3 ${value !== null ? "text-custom-text-100" : "text-custom-text-200"}`} />
              {currentEstimate}
            </>
          ) : (
            "No Estimate"
          )}
        </div>
      }
      onChange={onChange}
      disabled={disabled}
    >
      <CustomSelect.Option value={null}>
        <>
          <span>
            <Triangle className="h-3.5 w-3" />
          </span>
          None
        </>
      </CustomSelect.Option>
      {activeEstimateDetails?.points &&
        activeEstimateDetails?.points?.map((point) => (
          <CustomSelect.Option key={point.key} value={point.key}>
            <>
              <span>
                <Triangle className="h-3.5 w-3.5" />
              </span>
              {point.value}
            </>
          </CustomSelect.Option>
        ))}
    </CustomSelect>
  );
});
