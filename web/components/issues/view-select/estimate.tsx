import React from "react";
import { observer } from "mobx-react-lite";
import { Triangle } from "lucide-react";
import sortBy from "lodash/sortBy";
// store hooks
import { useEstimate } from "hooks/store";
// ui
import { CustomSelect, Tooltip } from "@plane/ui";
// types
import { TIssue } from "@plane/types";

type Props = {
  issue: TIssue;
  onChange: (data: number) => void;
  tooltipPosition?: "top" | "bottom";
  customButton?: boolean;
  disabled: boolean;
};

export const ViewEstimateSelect: React.FC<Props> = observer((props) => {
  const { issue, onChange, tooltipPosition = "top", customButton = false, disabled } = props;
  const { areEstimatesEnabledForCurrentProject, activeEstimateDetails, getEstimatePointValue } = useEstimate();

  const estimateValue = getEstimatePointValue(issue.estimate_point, issue.project_id);

  const estimateLabels = (
    <Tooltip tooltipHeading="Estimate" tooltipContent={estimateValue} position={tooltipPosition}>
      <div className="flex items-center gap-1 text-custom-text-200">
        <Triangle className="h-3 w-3" />
        {estimateValue ?? "None"}
      </div>
    </Tooltip>
  );

  if (!areEstimatesEnabledForCurrentProject) return null;

  return (
    <CustomSelect
      value={issue.estimate_point}
      onChange={onChange}
      {...(customButton ? { customButton: estimateLabels } : { label: estimateLabels })}
      maxHeight="md"
      noChevron
      disabled={disabled}
    >
      <CustomSelect.Option value={null}>
        <>
          <span>
            <Triangle className="h-3 w-3" />
          </span>
          None
        </>
      </CustomSelect.Option>
      {sortBy(activeEstimateDetails?.points, "key")?.map((estimate) => (
        <CustomSelect.Option key={estimate.id} value={estimate.key}>
          <>
            <Triangle className="h-3 w-3" />
            {estimate.value}
          </>
        </CustomSelect.Option>
      ))}
    </CustomSelect>
  );
});
