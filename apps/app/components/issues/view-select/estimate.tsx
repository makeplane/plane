import React from "react";

// ui
import { CustomSelect, Tooltip } from "components/ui";
// icons
import { getPriorityIcon } from "components/icons/priority-icon";
// types
import { IIssue } from "types";
// constants
import { PRIORITIES } from "constants/project";
// services
import trackEventServices from "services/track-event.service";
import useEstimateOption from "hooks/use-estimate-option";
import { PlayIcon } from "@heroicons/react/24/outline";

type Props = {
  issue: IIssue;
  partialUpdateIssue: (formData: Partial<IIssue>) => void;
  position?: "left" | "right";
  selfPositioned?: boolean;
  isNotAllowed: boolean;
};

export const ViewEstimateSelect: React.FC<Props> = ({
  issue,
  partialUpdateIssue,
  position = "left",
  selfPositioned = false,
  isNotAllowed,
}) => {
  const { isEstimateActive, estimatePoints } = useEstimateOption(issue.estimate_point);

  const estimateValue = estimatePoints?.find((e) => e.key === issue.estimate_point)?.value;

  if (!isEstimateActive) return null;

  return (
    <CustomSelect
      value={issue.estimate_point}
      onChange={(val: number) => {
        partialUpdateIssue({ estimate_point: val });
        trackEventServices.trackIssuePartialPropertyUpdateEvent(
          {
            workspaceSlug: issue.workspace_detail.slug,
            workspaceId: issue.workspace_detail.id,
            projectId: issue.project_detail.id,
            projectIdentifier: issue.project_detail.identifier,
            projectName: issue.project_detail.name,
            issueId: issue.id,
          },
          "ISSUE_PROPERTY_UPDATE_ESTIMATE"
        );
      }}
      label={
        <Tooltip tooltipHeading="Estimate" tooltipContent={estimateValue}>
          <div className="flex items-center gap-1 text-gray-500">
            <PlayIcon className="h-3.5 w-3.5 -rotate-90" />
            {estimateValue}
          </div>
        </Tooltip>
      }
      maxHeight="md"
      noChevron
      disabled={isNotAllowed}
      position={position}
      selfPositioned={selfPositioned}
      width="w-full min-w-[6rem]"
    >
      {estimatePoints?.map((estimate) => (
        <CustomSelect.Option key={estimate.id} value={estimate.key} className="capitalize">
          <>{estimate.value}</>
        </CustomSelect.Option>
      ))}
    </CustomSelect>
  );
};
