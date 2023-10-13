import React, { useState } from "react";
import { useRouter } from "next/router";
// services
import { TrackEventService } from "services/track_event.service";
// ui
import { AssigneesList, Avatar, CustomSearchSelect, Icon } from "components/ui";
import { Tooltip } from "@plane/ui";
// types
import { IUser, IIssue } from "types";
// hooks
import useProjectMembers from "hooks/use-project-members";

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

export const ViewAssigneeSelect: React.FC<Props> = ({
  issue,
  partialUpdateIssue,
  // position = "left",
  // selfPositioned = false,
  tooltipPosition = "top",
  user,
  isNotAllowed,
  customButton = false,
}) => {
  const [fetchAssignees, setFetchAssignees] = useState(false);

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { members } = useProjectMembers(workspaceSlug?.toString(), issue.project, fetchAssignees);

  const options = members?.map((member: any) => ({
    value: member.member.id,
    query: member.member.display_name,
    content: (
      <div className="flex items-center gap-2">
        <Avatar user={member.member} />
        {member.member.display_name}
      </div>
    ),
  }));

  const assigneeLabel = (
    <Tooltip
      position={tooltipPosition}
      tooltipHeading="Assignees"
      tooltipContent={
        issue.assignee_details.length > 0
          ? issue.assignee_details.map((assignee) => assignee?.display_name).join(", ")
          : "No Assignee"
      }
    >
      <div
        className={`flex ${
          isNotAllowed ? "cursor-not-allowed" : "cursor-pointer"
        } items-center gap-2 text-custom-text-200`}
      >
        {issue.assignees && issue.assignees.length > 0 && Array.isArray(issue.assignees) ? (
          <div className="-my-0.5 flex items-center justify-center gap-2">
            <AssigneesList userIds={issue.assignees} length={3} showLength={true} />
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 px-1.5 py-1 rounded shadow-sm border border-custom-border-300">
            <Icon iconName="person" className="text-sm !leading-4" />
          </div>
        )}
      </div>
    </Tooltip>
  );

  return (
    <CustomSearchSelect
      value={issue.assignees}
      buttonClassName="!p-0"
      onChange={(data: any) => {
        const newData = issue.assignees ?? [];

        if (newData.includes(data)) newData.splice(newData.indexOf(data), 1);
        else newData.push(data);

        partialUpdateIssue({ assignees_list: data }, issue);

        trackEventService.trackIssuePartialPropertyUpdateEvent(
          {
            workspaceSlug,
            workspaceId: issue.workspace,
            projectId: issue.project_detail.id,
            projectIdentifier: issue.project_detail.identifier,
            projectName: issue.project_detail.name,
            issueId: issue.id,
          },
          "ISSUE_PROPERTY_UPDATE_ASSIGNEE",
          user as IUser
        );
      }}
      options={options}
      {...(customButton ? { customButton: assigneeLabel } : { label: assigneeLabel })}
      multiple
      noChevron
      disabled={isNotAllowed}
      onOpen={() => setFetchAssignees(true)}
      width="w-full min-w-[12rem]"
    />
  );
};
