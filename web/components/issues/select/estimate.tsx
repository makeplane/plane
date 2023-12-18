import React from "react";
import { observer } from "mobx-react-lite";
import { Triangle } from "lucide-react";
// store hooks
import { useEstimate } from "hooks/store";
// ui
import { CustomSelect } from "@plane/ui";

type Props = {
  value: number | null;
  onChange: (value: number | null) => void;
};

export const IssueEstimateSelect: React.FC<Props> = observer((props) => {
  const { value, onChange } = props;

  const { areEstimatesEnabledForCurrentProject, activeEstimateDetails } = useEstimate();

  if (!areEstimatesEnabledForCurrentProject) return null;

  return (
    <CustomSelect
      value={value}
      label={
        <div className="flex items-center justify-center gap-1 text-xs">
          <Triangle className={`h-3 w-3 ${value !== null ? "text-custom-text-200" : "text-custom-text-300"}`} />
          <span className={value !== null ? "text-custom-text-200" : "text-custom-text-300"}>
            {activeEstimateDetails?.points?.find((e) => e.key === value)?.value ?? "Estimate"}
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
      {activeEstimateDetails?.points &&
        activeEstimateDetails.points?.map((point) => (
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
});
