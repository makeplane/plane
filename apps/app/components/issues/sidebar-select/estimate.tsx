import React from "react";

// hooks
import useEstimateOption from "hooks/use-estimate-option";
// ui
import { CustomSelect } from "components/ui";
// icons
import { PlayIcon } from "@heroicons/react/24/outline";

type Props = {
  value: number | null;
  onChange: (val: number | null) => void;
  disabled?: boolean;
};

export const SidebarEstimateSelect: React.FC<Props> = ({ value, onChange, disabled = false }) => {
  const { isEstimateActive, estimatePoints } = useEstimateOption();

  if (!isEstimateActive) return null;

  return (
    <CustomSelect
      value={value}
      label={
        <div className="flex items-center gap-2 text-xs">
          <PlayIcon
            className={`h-4 w-4 -rotate-90 ${
              value !== null ? "text-custom-text-100" : "text-custom-text-200"
            }`}
          />
          {estimatePoints?.find((e) => e.key === value)?.value ?? (
            <span className="text-custom-text-200">No estimates</span>
          )}
        </div>
      }
      onChange={onChange}
      position="right"
      width="w-full"
      disabled={disabled}
    >
      <CustomSelect.Option value={null}>
        <>
          <span>
            <PlayIcon className="h-4 w-4 -rotate-90" />
          </span>
          None
        </>
      </CustomSelect.Option>
      {estimatePoints &&
        estimatePoints.map((point) => (
          <CustomSelect.Option key={point.key} value={point.key}>
            <>
              <span>
                <PlayIcon className="h-4 w-4 -rotate-90" />
              </span>
              {point.value}
            </>
          </CustomSelect.Option>
        ))}
    </CustomSelect>
  );
};
