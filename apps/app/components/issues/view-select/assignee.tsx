import React from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import projectService from "services/project.service";
import trackEventServices from "services/track-event.service";
// ui
import { AssigneesList, Avatar, CustomSearchSelect, Tooltip } from "components/ui";
// icons
import { UserGroupIcon } from "@heroicons/react/24/outline";
// types
import { IIssue } from "types";
// fetch-keys
import { PROJECT_MEMBERS } from "constants/fetch-keys";

type Props = {
  issue: IIssue;
  partialUpdateIssue: (formData: Partial<IIssue>, issueId: string) => void;
  position?: "left" | "right";
  selfPositioned?: boolean;
  tooltipPosition?: "left" | "right";
  isNotAllowed: boolean;
};

export const ViewAssigneeSelect: React.FC<Props> = ({
  issue,
  partialUpdateIssue,
  position = "left",
  selfPositioned = false,
  tooltipPosition = "right",
  isNotAllowed,
}) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: members } = useSWR(
    projectId ? PROJECT_MEMBERS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.projectMembers(workspaceSlug as string, projectId as string)
      : null
  );

  const options =
    members?.map((member) => ({
      value: member.member.id,
      query:
        (member.member.first_name && member.member.first_name !== ""
          ? member.member.first_name
          : member.member.email) +
          " " +
          member.member.last_name ?? "",
      content: (
        <div className="flex items-center gap-2">
          <Avatar user={member.member} />
          {member.member.first_name && member.member.first_name !== ""
            ? member.member.first_name
            : member.member.email}
        </div>
      ),
    })) ?? [];

  return (
    <CustomSearchSelect
      value={issue.assignees}
      onChange={(data: any) => {
        const newData = issue.assignees ?? [];

        if (newData.includes(data)) newData.splice(newData.indexOf(data), 1);
        else newData.push(data);

        partialUpdateIssue({ assignees_list: data }, issue.id);

        trackEventServices.trackIssuePartialPropertyUpdateEvent(
          {
            workspaceSlug,
            workspaceId: issue.workspace,
            projectId: issue.project_detail.id,
            projectIdentifier: issue.project_detail.identifier,
            projectName: issue.project_detail.name,
            issueId: issue.id,
          },
          "ISSUE_PROPERTY_UPDATE_ASSIGNEE"
        );
      }}
      options={options}
      label={
        <Tooltip
          position={`top-${tooltipPosition}`}
          tooltipHeading="Assignees"
          tooltipContent={
            issue.assignee_details.length > 0
              ? issue.assignee_details
                  .map((assignee) =>
                    assignee?.first_name !== "" ? assignee?.first_name : assignee?.email
                  )
                  .join(", ")
              : "No Assignee"
          }
        >
          <div
            className={`flex ${
              isNotAllowed ? "cursor-not-allowed" : "cursor-pointer"
            } items-center gap-2 text-brand-secondary`}
          >
            {issue.assignees && issue.assignees.length > 0 && Array.isArray(issue.assignees) ? (
              <div className="-my-0.5 flex items-center justify-center gap-2">
                <AssigneesList userIds={issue.assignees} length={5} showLength={true} />
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <UserGroupIcon className="h-4 w-4 text-brand-secondary" />
              </div>
            )}
          </div>
        </Tooltip>
      }
      multiple
      noChevron
      position={position}
      disabled={isNotAllowed}
    />
  );
};
