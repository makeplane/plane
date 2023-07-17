import React from "react";

import { useRouter } from "next/router";

// ui
import { CustomSelect, Tooltip } from "components/ui";
// icons
import { getPriorityIcon } from "components/icons/priority-icon";
// types
import { ICurrentUserResponse, IIssue } from "types";
// constants
import { PRIORITIES } from "constants/project";
// services
import trackEventServices from "services/track-event.service";
// helper
import { capitalizeFirstLetter } from "helpers/string.helper";

type Props = {
  issue: IIssue;
  partialUpdateIssue: (formData: Partial<IIssue>, issue: IIssue) => void;
  position?: "left" | "right";
  tooltipPosition?: "top" | "bottom";
  selfPositioned?: boolean;
  noBorder?: boolean;
  user: ICurrentUserResponse | undefined;
  isNotAllowed: boolean;
};

export const ViewPrioritySelect: React.FC<Props> = ({
  issue,
  partialUpdateIssue,
  position = "left",
  tooltipPosition = "top",
  selfPositioned = false,
  noBorder = false,
  user,
  isNotAllowed,
}) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  return (
    <CustomSelect
      value={issue.priority}
      onChange={(data: string) => {
        partialUpdateIssue({ priority: data }, issue);
        trackEventServices.trackIssuePartialPropertyUpdateEvent(
          {
            workspaceSlug,
            workspaceId: issue.workspace,
            projectId: issue.project_detail.id,
            projectIdentifier: issue.project_detail.identifier,
            projectName: issue.project_detail.name,
            issueId: issue.id,
          },
          "ISSUE_PROPERTY_UPDATE_PRIORITY",
          user
        );
      }}
      maxHeight="md"
      customButton={
        <button
          type="button"
          className={`grid place-items-center rounded ${
            isNotAllowed ? "cursor-not-allowed" : "cursor-pointer"
          } ${noBorder ? "" : "h-6 w-6 border shadow-sm"} ${
            noBorder
              ? ""
              : issue.priority === "urgent"
              ? "border-red-500/20 bg-red-500/20"
              : issue.priority === "high"
              ? "border-orange-500/20 bg-orange-500/20"
              : issue.priority === "medium"
              ? "border-yellow-500/20 bg-yellow-500/20"
              : issue.priority === "low"
              ? "border-green-500/20 bg-green-500/20"
              : "border-custom-border-200 bg-custom-background-80"
          } items-center`}
        >
          <Tooltip
            tooltipHeading="Priority"
            tooltipContent={issue.priority ?? "None"}
            position={tooltipPosition}
          >
            <span className="flex gap-1 items-center text-custom-text-200 text-xs">
              {getPriorityIcon(
                issue.priority && issue.priority !== "" ? issue.priority ?? "" : "None",
                `text-sm ${
                  issue.priority === "urgent"
                    ? "text-red-500"
                    : issue.priority === "high"
                    ? "text-orange-500"
                    : issue.priority === "medium"
                    ? "text-yellow-500"
                    : issue.priority === "low"
                    ? "text-green-500"
                    : "text-custom-text-200"
                }`
              )}
              {noBorder
                ? issue.priority && issue.priority !== ""
                  ? capitalizeFirstLetter(issue.priority) ?? ""
                  : "None"
                : ""}
            </span>
          </Tooltip>
        </button>
      }
      noChevron
      disabled={isNotAllowed}
      position={position}
      selfPositioned={selfPositioned}
    >
      {PRIORITIES?.map((priority) => (
        <CustomSelect.Option key={priority} value={priority} className="capitalize">
          <>
            {getPriorityIcon(priority, "text-sm")}
            {priority ?? "None"}
          </>
        </CustomSelect.Option>
      ))}
    </CustomSelect>
  );
};
