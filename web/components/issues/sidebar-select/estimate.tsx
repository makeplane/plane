import React from "react";

// hooks
import useEstimateOption from "hooks/use-estimate-option";
// ui
import { CustomSelect } from "components/ui";
// icons
import { Triangle } from "lucide-react";

type Props = {
  value: number | null;
  onChange: (val: number | null) => void;
  disabled?: boolean;
};

export const SidebarEstimateSelect: React.FC<Props> = ({ value, onChange, disabled = false }) => {
  const { estimatePoints } = useEstimateOption();

  return (
    <CustomSelect
      value={value}
      customButton={
        <div className="flex items-center gap-1.5 !text-sm bg-custom-background-80 rounded px-2.5 py-0.5">
          <Triangle className={`h-4 w-4 ${value !== null ? "text-custom-text-100" : "text-custom-text-200"}`} />
          {estimatePoints?.find((e) => e.key === value)?.value ?? "No estimate"}
        </div>
      }
      onChange={onChange}
      disabled={disabled}
    >
      <CustomSelect.Option value={null}>
        <>
          <span>
            <Triangle className="h-4 w-4" />
          </span>
          None
        </>
      </CustomSelect.Option>
      {estimatePoints &&
        estimatePoints.map((point) => (
          <CustomSelect.Option key={point.key} value={point.key}>
            <>
              <span>
                <Triangle className="h-4 w-4" />
              </span>
              {point.value}
            </>
          </CustomSelect.Option>
        ))}
    </CustomSelect>
  );
};
