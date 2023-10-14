import React from "react";
import { useRouter } from "next/router";
// services
import { TrackEventService } from "services/track_event.service";
// ui
import { CustomSelect } from "components/ui";
import { Tooltip } from "@plane/ui";
// icons
import { PriorityIcon } from "components/icons/priority-icon";
// helpers
import { capitalizeFirstLetter } from "helpers/string.helper";
// types
import { IUser, IIssue, TIssuePriorities } from "types";
// constants
import { PRIORITIES } from "constants/project";

type Props = {
  issue: IIssue;
  partialUpdateIssue: (formData: Partial<IIssue>, issue: IIssue) => void;
  position?: "left" | "right";
  tooltipPosition?: "top" | "bottom";
  selfPositioned?: boolean;
  noBorder?: boolean;
  user: IUser | undefined;
  isNotAllowed: boolean;
};

const trackEventService = new TrackEventService();

export const ViewPrioritySelect: React.FC<Props> = ({
  issue,
  partialUpdateIssue,
  // position = "left",
  tooltipPosition = "top",
  // selfPositioned = false,
  noBorder = false,
  user,
  isNotAllowed,
}) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  return (
    <CustomSelect
      value={issue.priority}
      onChange={(data: TIssuePriorities) => {
        partialUpdateIssue({ priority: data }, issue);
        trackEventService.trackIssuePartialPropertyUpdateEvent(
          {
            workspaceSlug,
            workspaceId: issue.workspace,
            projectId: issue.project_detail.id,
            projectIdentifier: issue.project_detail.identifier,
            projectName: issue.project_detail.name,
            issueId: issue.id,
          },
          "ISSUE_PROPERTY_UPDATE_PRIORITY",
          user as IUser
        );
      }}
      maxHeight="md"
      customButton={
        <button
          type="button"
          className={`grid place-items-center rounded ${isNotAllowed ? "cursor-not-allowed" : "cursor-pointer"} ${
            noBorder ? "" : "h-6 w-6 border shadow-sm"
          } ${
            noBorder
              ? ""
              : issue.priority === "urgent"
              ? "border-red-500/20 bg-red-500"
              : "border-custom-border-300 bg-custom-background-100"
          } items-center`}
        >
          <Tooltip tooltipHeading="Priority" tooltipContent={issue.priority ?? "None"} position={tooltipPosition}>
            <span className="flex gap-1 items-center text-custom-text-200 text-xs">
              <PriorityIcon
                priority={issue.priority}
                className={`text-sm ${
                  issue.priority === "urgent"
                    ? "text-white"
                    : issue.priority === "high"
                    ? "text-orange-500"
                    : issue.priority === "medium"
                    ? "text-yellow-500"
                    : issue.priority === "low"
                    ? "text-green-500"
                    : "text-custom-text-200"
                }`}
              />
              {noBorder ? capitalizeFirstLetter(issue.priority ?? "None") : ""}
            </span>
          </Tooltip>
        </button>
      }
      noChevron
      disabled={isNotAllowed}
    >
      {PRIORITIES?.map((priority) => (
        <CustomSelect.Option key={priority} value={priority} className="capitalize">
          <>
            <PriorityIcon priority={priority} className="text-sm" />
            {priority ?? "None"}
          </>
        </CustomSelect.Option>
      ))}
    </CustomSelect>
  );
};
