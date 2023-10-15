import React from "react";
import { useRouter } from "next/router";
// components
import { StateSelect } from "components/states";
// services
import { TrackEventService } from "services/track_event.service";
// types
import { IUser, IIssue, IState, Properties } from "types";

type Props = {
  issue: IIssue;
  projectId: string;
  onChange: (formData: Partial<IIssue>) => void;
  properties: Properties;
  user: IUser;
  isNotAllowed: boolean;
};

const trackEventService = new TrackEventService();

export const StateColumn: React.FC<Props> = ({ issue, projectId, onChange, properties, user, isNotAllowed }) => {
  const router = useRouter();

  const { workspaceSlug } = router.query;

  const handleStateChange = (data: string, states: IState[] | undefined) => {
    const oldState = states?.find((s) => s.id === issue.state);
    const newState = states?.find((s) => s.id === data);

    onChange({
      state: data,
      state_detail: newState,
    });
    trackEventService.trackIssuePartialPropertyUpdateEvent(
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
      trackEventService.trackIssueMarkedAsDoneEvent(
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
      <span className="flex items-center px-4 py-2.5 h-full w-full flex-shrink-0 border-r border-b border-custom-border-100">
        {properties.state && (
          <StateSelect
            value={issue.state_detail}
            projectId={projectId}
            onChange={handleStateChange}
            buttonClassName="!shadow-none !border-0"
            hideDropdownArrow
            disabled={isNotAllowed}
          />
        )}
      </span>
    </div>
  );
};
