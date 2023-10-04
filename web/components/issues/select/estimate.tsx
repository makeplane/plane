import React from "react";

// ui
import { CustomSelect } from "components/ui";
// icons
import { PlayIcon } from "@heroicons/react/24/outline";
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
          <PlayIcon
            className={`h-3.5 w-3.5 -rotate-90 ${
              value !== null ? "text-custom-text-100" : "text-custom-text-200"
            }`}
          />
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
