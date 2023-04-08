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
  const { isEstimateActive, estimatePoints, estimateValue } = useEstimateOption(
    issue.estimate_point
  );

  return (
    <CustomSelect
      value={issue.priority}
      onChange={(data: string) => {
        partialUpdateIssue({ priority: data, state: issue.state, target_date: issue.target_date });
        trackEventServices.trackIssuePartialPropertyUpdateEvent(
          {
            workspaceSlug: issue.workspace_detail.slug,
            workspaceId: issue.workspace_detail.id,
            projectId: issue.project_detail.id,
            projectIdentifier: issue.project_detail.identifier,
            projectName: issue.project_detail.name,
            issueId: issue.id,
          },
          "ISSUE_PROPERTY_UPDATE_PRIORITY"
        );
      }}
      label={
        <Tooltip tooltipHeading="Estimate" tooltipContent={estimateValue}>
          <>{estimateValue}</>
        </Tooltip>
      }
      maxHeight="md"
      noChevron
      disabled={isNotAllowed}
      position={position}
      selfPositioned={selfPositioned}
    >
      {estimatePoints?.map((estimate) => (
        <CustomSelect.Option key={estimate.id} value={estimate.key} className="capitalize">
          <>{estimate.value}</>
        </CustomSelect.Option>
      ))}
    </CustomSelect>
  );
};
