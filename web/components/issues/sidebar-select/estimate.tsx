import React from "react";

// hooks
import useEstimateOption from "hooks/use-estimate-option";
// ui
import { CustomSelect } from "@plane/ui";
// icons
import { Triangle } from "lucide-react";

type Props = {
  value: number | null;
  onChange: (val: number | null) => void;
  disabled?: boolean;
};

export const SidebarEstimateSelect: React.FC<Props> = ({ value, onChange, disabled = false }) => {
  const { estimatePoints } = useEstimateOption();

  const currentEstimate = estimatePoints?.find((e) => e.key === value)?.value;
  return (
    <CustomSelect
      value={value}
      customButton={
        <div className="flex items-center gap-1.5 text-xs bg-custom-background-80 rounded px-2.5 py-0.5">
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
      {estimatePoints &&
        estimatePoints.map((point) => (
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
};
