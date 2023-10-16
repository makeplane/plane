import React from "react";
// hooks
import useEstimateOption from "hooks/use-estimate-option";
// ui
import { CustomSelect } from "components/ui";
import { Tooltip } from "@plane/ui";
// icons
import { PlayIcon } from "@heroicons/react/24/outline";
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
        <PlayIcon className="h-3.5 w-3.5 -rotate-90" />
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
            <PlayIcon className="h-4 w-4 -rotate-90" />
          </span>
          None
        </>
      </CustomSelect.Option>
      {estimatePoints?.map((estimate) => (
        <CustomSelect.Option key={estimate.id} value={estimate.key}>
          <>
            <span>
              <PlayIcon className="h-4 w-4 -rotate-90" />
            </span>
            {estimate.value}
          </>
        </CustomSelect.Option>
      ))}
    </CustomSelect>
  );
};
