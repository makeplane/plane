import React from "react";

import { useRouter } from "next/router";

// components
import { MembersSelect } from "components/project";
// services
import trackEventServices from "services/track-event.service";
// types
import { ICurrentUserResponse, IIssue, Properties } from "types";

type Props = {
  issue: IIssue;
  projectId: string;
  partialUpdateIssue: (formData: Partial<IIssue>, issue: IIssue) => void;
  properties: Properties;
  user: ICurrentUserResponse | undefined;
  isNotAllowed: boolean;
};

export const AssigneeColumn: React.FC<Props> = ({
  issue,
  projectId,
  partialUpdateIssue,
  properties,
  user,
  isNotAllowed,
}) => {
  const router = useRouter();

  const { workspaceSlug } = router.query;

  const handleAssigneeChange = (data: any) => {
    const newData = issue.assignees ?? [];

    if (newData.includes(data)) newData.splice(newData.indexOf(data), 1);
    else newData.push(data);

    partialUpdateIssue({ assignees_list: data }, issue);

    trackEventServices.trackIssuePartialPropertyUpdateEvent(
      {
        workspaceSlug,
        workspaceId: issue.workspace,
        projectId: issue.project_detail.id,
        projectIdentifier: issue.project_detail.identifier,
        projectName: issue.project_detail.name,
        issueId: issue.id,
      },
      "ISSUE_PROPERTY_UPDATE_ASSIGNEE",
      user
    );
  };

  return (
    <div className="flex items-center text-sm h-11 w-full bg-custom-background-100">
      <span className="flex items-center px-4 py-2.5 h-full w-full flex-shrink-0 border-r border-b border-custom-border-200">
        {properties.assignee && (
          <MembersSelect
            value={issue.assignees}
            projectId={projectId}
            onChange={handleAssigneeChange}
            membersDetails={issue.assignee_details}
            buttonClassName="!p-0 !rounded-none !shadow-none !border-0"
            hideDropdownArrow
            disabled={isNotAllowed}
          />
        )}
      </span>
    </div>
  );
};
