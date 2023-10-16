import React from "react";
import { useRouter } from "next/router";
// services
import { TrackEventService } from "services/track_event.service";
// hooks
import useEstimateOption from "hooks/use-estimate-option";
// ui
import { CustomSelect } from "components/ui";
import { Tooltip } from "@plane/ui";
// icons
import { PlayIcon } from "@heroicons/react/24/outline";
// types
import { IUser, IIssue } from "types";

type Props = {
  issue: IIssue;
  partialUpdateIssue: (formData: Partial<IIssue>, issue: IIssue) => void;
  position?: "left" | "right";
  tooltipPosition?: "top" | "bottom";
  selfPositioned?: boolean;
  customButton?: boolean;
  user: IUser | undefined;
  isNotAllowed: boolean;
};

const trackEventService = new TrackEventService();

export const ViewEstimateSelect: React.FC<Props> = ({
  issue,
  partialUpdateIssue,
  // position = "left",
  tooltipPosition = "top",
  // selfPositioned = false,
  customButton = false,
  user,
  isNotAllowed,
}) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

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
      onChange={(val: number) => {
        partialUpdateIssue({ estimate_point: val }, issue);
        trackEventService.trackIssuePartialPropertyUpdateEvent(
          {
            workspaceSlug,
            workspaceId: issue.workspace,
            projectId: issue.project_detail.id,
            projectIdentifier: issue.project_detail.identifier,
            projectName: issue.project_detail.name,
            issueId: issue.id,
          },
          "ISSUE_PROPERTY_UPDATE_ESTIMATE",
          user as IUser
        );
      }}
      {...(customButton ? { customButton: estimateLabels } : { label: estimateLabels })}
      maxHeight="md"
      noChevron
      disabled={isNotAllowed}
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
