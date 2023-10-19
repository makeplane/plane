import React from "react";
// hooks
import useEstimateOption from "hooks/use-estimate-option";
// ui
import { CustomSelect, Tooltip } from "@plane/ui";
// icons
import { Triangle } from "lucide-react";
// types
import { IIssue } from "types";

type Props = {
  issue: IIssue;
  onChange: (data: number) => void;
  tooltipPosition?: "top" | "bottom";
  customButton?: boolean;
  disabled: boolean;
};

export const ViewEstimateSelect: React.FC<Props> = ({
  issue,
  onChange,
  tooltipPosition = "top",
  customButton = false,
  disabled,
}) => {
  const { isEstimateActive, estimatePoints } = useEstimateOption(issue.estimate_point);

  const estimateValue = estimatePoints?.find((e) => e.key === issue.estimate_point)?.value;

  const estimateLabels = (
    <Tooltip tooltipHeading="Estimate" tooltipContent={estimateValue} position={tooltipPosition}>
      <div className="flex items-center gap-1 text-custom-text-200">
        <Triangle className="h-3 w-3" />
        {estimateValue ?? "None"}
      </div>
    </Tooltip>
  );

  if (!isEstimateActive) return null;

  return (
    <CustomSelect
      value={issue.estimate_point}
      onChange={onChange}
      {...(customButton ? { customButton: estimateLabels } : { label: estimateLabels })}
      maxHeight="md"
      noChevron
      disabled={disabled}
      width="w-full min-w-[8rem]"
    >
      <CustomSelect.Option value={null}>
        <>
          <span>
            <Triangle className="h-3 w-3" />
          </span>
          None
        </>
      </CustomSelect.Option>
      {estimatePoints?.map((estimate) => (
        <CustomSelect.Option key={estimate.id} value={estimate.key}>
          <>
            <Triangle className="h-3 w-3" />
            {estimate.value}
          </>
        </CustomSelect.Option>
      ))}
    </CustomSelect>
  );
};
