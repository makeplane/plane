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
        <div className="flex items-center gap-2 text-xs">
          <Triangle className={`h-3.5 w-3.5 ${value !== null ? "text-custom-text-100" : "text-custom-text-200"}`} />
          <span className={value !== null ? "text-custom-text-100" : "text-custom-text-200"}>
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
