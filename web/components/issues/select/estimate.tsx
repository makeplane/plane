import React from "react";

// ui
import { CustomSelect } from "@plane/ui";
// icons
import { Triangle } from "lucide-react";
// fetch-keys
import useEstimateOption from "hooks/use-estimate-option";

type Props = {
  value: number | null;
  onChange: (value: number | null) => void;
};

export const IssueEstimateSelect: React.FC<Props> = ({ value, onChange }) => {
  const { isEstimateActive, estimatePoints } = useEstimateOption();

  if (!isEstimateActive) return null;

  return (
    <CustomSelect
      value={value}
      label={
        <div className="flex items-center justify-center gap-1 text-xs">
          <Triangle className={`h-3 w-3 ${value !== null ? "text-custom-text-200" : "text-custom-text-300"}`} />
          <span className={value !== null ? "text-custom-text-200" : "text-custom-text-300"}>
            {estimatePoints?.find((e) => e.key === value)?.value ?? "Estimate"}
          </span>
        </div>
      }
      onChange={onChange}
      width="w-full min-w-[8rem]"
      noChevron
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
