import React from "react";
// swr
import { mutate } from "swr";
// components
import { ViewDueDateSelect, ViewStartDateSelect } from "components/issues";
import { MembersSelect, PrioritySelect } from "components/project";
import { StateSelect } from "components/states";
// hooks
import useIssuesProperties from "hooks/use-issue-properties";
// types
import { ICurrentUserResponse, IIssue, IState } from "types";
// fetch-keys
import { SUB_ISSUES } from "constants/fetch-keys";
// services
import issuesService from "services/issues.service";
import trackEventServices from "services/track-event.service";

export interface IIssueProperty {
  workspaceSlug: string;
  projectId: string;
  parentIssue: IIssue;
  issue: IIssue;
  user: ICurrentUserResponse | undefined;
  editable: boolean;
}

export const IssueProperty: React.FC<IIssueProperty> = ({
  workspaceSlug,
  projectId,
  parentIssue,
  issue,
  user,
  editable,
}) => {
  const [properties] = useIssuesProperties(workspaceSlug, projectId);

  const handlePriorityChange = (data: any) => {
    partialUpdateIssue({ priority: data });
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
  };

  const handleStateChange = (data: string, states: IState[] | undefined) => {
    const oldState = states?.find((s) => s.id === issue.state);
    const newState = states?.find((s) => s.id === data);

    partialUpdateIssue({
      state: data,
      state_detail: newState,
    });
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

  const handleAssigneeChange = (data: any) => {
    let newData = issue.assignees ?? [];

    if (newData && newData.length > 0) {
      if (newData.includes(data)) newData = newData.splice(newData.indexOf(data), 1);
      else newData = [...newData, data];
    } else newData = [...newData, data];

    partialUpdateIssue({ assignees_list: data, assignees: data });

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

  const partialUpdateIssue = async (data: Partial<IIssue>) => {
    mutate(
      workspaceSlug && parentIssue ? SUB_ISSUES(parentIssue.id) : null,
      (elements: any) => {
        const _elements = { ...elements };
        const _issues = _elements.sub_issues.map((element: IIssue) =>
          element.id === issue.id ? { ...element, ...data } : element
        );
        _elements["sub_issues"] = [..._issues];
        return _elements;
      },
      false
    );

    const issueResponse = await issuesService.patchIssue(
      workspaceSlug as string,
      issue.project,
      issue.id,
      data,
      user
    );

    mutate(
      SUB_ISSUES(parentIssue.id),
      (elements: any) => {
        const _elements = elements.sub_issues.map((element: IIssue) =>
          element.id === issue.id ? issueResponse : element
        );
        elements["sub_issues"] = _elements;
        return elements;
      },
      true
    );
  };

  return (
    <div className="relative flex items-center gap-1">
      {properties.priority && (
        <div className="flex-shrink-0">
          <PrioritySelect
            value={issue.priority}
            onChange={handlePriorityChange}
            hideDropdownArrow
            disabled={!editable}
          />
        </div>
      )}

      {properties.state && (
        <div className="flex-shrink-0">
          <StateSelect
            value={issue.state_detail}
            projectId={issue.project_detail.id}
            onChange={handleStateChange}
            hideDropdownArrow
            disabled={!editable}
          />
        </div>
      )}

      {properties.start_date && issue.start_date && (
        <div className="flex-shrink-0 w-[104px]">
          <ViewStartDateSelect
            issue={issue}
            partialUpdateIssue={partialUpdateIssue}
            user={user}
            isNotAllowed={!editable}
          />
        </div>
      )}

      {properties.due_date && issue.target_date && (
        <div className="flex-shrink-0 w-[104px]">
          <ViewDueDateSelect
            issue={issue}
            partialUpdateIssue={partialUpdateIssue}
            user={user}
            isNotAllowed={!editable}
          />
        </div>
      )}

      {properties.assignee && (
        <div className="flex-shrink-0">
          <MembersSelect
            value={issue.assignees}
            projectId={issue.project_detail.id}
            onChange={handleAssigneeChange}
            membersDetails={issue.assignee_details}
            hideDropdownArrow
            disabled={!editable}
          />
        </div>
      )}
    </div>
  );
};
