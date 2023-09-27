import React from "react";

import { useRouter } from "next/router";

// components
import { StateSelect } from "components/states";
// services
import trackEventServices from "services/track-event.service";
// types
import { ICurrentUserResponse, IIssue, IState, Properties } from "types";

type Props = {
  issue: IIssue;
  projectId: string;
  partialUpdateIssue: (formData: Partial<IIssue>, issue: IIssue) => void;
  properties: Properties;
  user: ICurrentUserResponse | undefined;
  isNotAllowed: boolean;
};

export const StateColumn: React.FC<Props> = ({
  issue,
  projectId,
  partialUpdateIssue,
  properties,
  user,
  isNotAllowed,
}) => {
  const router = useRouter();

  const { workspaceSlug } = router.query;

  const handleStateChange = (data: string, states: IState[] | undefined) => {
    const oldState = states?.find((s) => s.id === issue.state);
    const newState = states?.find((s) => s.id === data);

    partialUpdateIssue(
      {
        state: data,
        state_detail: newState,
      },
      issue
    );
    trackEventServices.trackIssuePartialPropertyUpdateEvent(
      {
        workspaceSlug,
        workspaceId: issue.workspace,
        projectId: issue.project_detail.id,
        projectIdentifier: issue.project_detail.identifier,
        projectName: issue.project_detail.name,
        issueId: issue.id,
      },
      "ISSUE_PROPERTY_UPDATE_STATE",
      user
    );
    if (oldState?.group !== "completed" && newState?.group !== "completed") {
      trackEventServices.trackIssueMarkedAsDoneEvent(
        {
          workspaceSlug: issue.workspace_detail.slug,
          workspaceId: issue.workspace_detail.id,
          projectId: issue.project_detail.id,
          projectIdentifier: issue.project_detail.identifier,
          projectName: issue.project_detail.name,
          issueId: issue.id,
        },
        user
      );
    }
  };

  return (
    <div className="flex items-center text-sm h-11 w-full bg-custom-background-100">
      <span className="flex items-center px-4 py-2.5 h-full w-full flex-shrink-0 border-r border-b border-custom-border-200">
        {properties.state && (
          <StateSelect
            value={issue.state_detail}
            projectId={projectId}
            onChange={handleStateChange}
            buttonClassName="!p-0 !rounded-none !shadow-none !border-0"
            hideDropdownArrow
            disabled={isNotAllowed}
          />
        )}
      </span>
    </div>
  );
};
