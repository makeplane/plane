import React from "react";
import { useRouter } from "next/router";
// components
import { MembersSelect } from "components/project";
// services
import { TrackEventService } from "services/track_event.service";
// types
import { IUser, IIssue, Properties } from "types";

type Props = {
  issue: IIssue;
  projectId: string;
  onChange: (formData: Partial<IIssue>) => void;
  properties: Properties;
  user: IUser | undefined;
  isNotAllowed: boolean;
};

const trackEventService = new TrackEventService();

export const AssigneeColumn: React.FC<Props> = ({ issue, projectId, onChange, properties, user, isNotAllowed }) => {
  const router = useRouter();

  const { workspaceSlug } = router.query;

  const handleAssigneeChange = (data: any) => {
    const newData = issue.assignees ?? [];

    if (newData.includes(data)) newData.splice(newData.indexOf(data), 1);
    else newData.push(data);

    onChange({ assignees_list: data });

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
  };

  return (
    <div className="flex items-center text-sm h-11 w-full bg-custom-background-100">
      <span className="flex items-center px-4 py-2.5 h-full w-full flex-shrink-0 border-r border-b border-custom-border-100">
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
