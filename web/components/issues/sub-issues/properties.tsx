import React from "react";
import { observer } from "mobx-react-lite";
import { mutate } from "swr";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// services
import { IssueService } from "services/issue";
import { TrackEventService } from "services/track_event.service";
// components
import { ViewDueDateSelect, ViewStartDateSelect } from "components/issues";
import { MembersSelect, PrioritySelect } from "components/project";
import { StateSelect } from "components/states";
// helpers
import { getStatesList } from "helpers/state.helper";
// types
import { IUser, IIssue, IState } from "types";
// fetch-keys
import { SUB_ISSUES } from "constants/fetch-keys";

export interface IIssueProperty {
  workspaceSlug: string;
  parentIssue: IIssue;
  issue: IIssue;
  user: IUser | undefined;
  editable: boolean;
}

// services
const issueService = new IssueService();
const trackEventService = new TrackEventService();

export const IssueProperty: React.FC<IIssueProperty> = observer((props) => {
  const { workspaceSlug, parentIssue, issue, user, editable } = props;

  const { project: projectStore, issueFilter: issueFilterStore } = useMobxStore();

  const displayProperties = issueFilterStore.userDisplayProperties ?? {};

  const handlePriorityChange = (data: any) => {
    partialUpdateIssue({ priority: data });
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
  };

  const handleStateChange = (data: IState) => {
    partialUpdateIssue({
      state: data.id,
      state_detail: data,
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
      user as IUser
    );
  };

  const handleAssigneeChange = (data: string[]) => {
    partialUpdateIssue({ assignees_list: data, assignees: data });

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

    const issueResponse = await issueService.patchIssue(workspaceSlug as string, issue.project, issue.id, data, user);

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

  const statesList = getStatesList(projectStore.states?.[issue.project]);

  return (
    <div className="relative flex items-center gap-1">
      {displayProperties.priority && (
        <div className="flex-shrink-0">
          <PrioritySelect
            value={issue.priority}
            onChange={handlePriorityChange}
            hideDropdownArrow
            disabled={!editable}
          />
        </div>
      )}

      {displayProperties.state && (
        <div className="flex-shrink-0">
          <StateSelect
            value={issue.state_detail}
            states={statesList}
            onChange={(data) => handleStateChange(data)}
            hideDropdownArrow
            disabled={!editable}
          />
        </div>
      )}

      {displayProperties.start_date && issue.start_date && (
        <div className="flex-shrink-0 w-[104px]">
          <ViewStartDateSelect
            issue={issue}
            onChange={(val) => partialUpdateIssue({ start_date: val })}
            disabled={!editable}
          />
        </div>
      )}

      {displayProperties.due_date && issue.target_date && (
        <div className="flex-shrink-0 w-[104px]">
          {user && (
            <ViewDueDateSelect
              issue={issue}
              onChange={(val) => partialUpdateIssue({ target_date: val })}
              disabled={!editable}
            />
          )}
        </div>
      )}

      {displayProperties.assignee && (
        <div className="flex-shrink-0">
          <MembersSelect
            value={issue.assignees}
            onChange={(val) => handleAssigneeChange(val)}
            members={projectStore.members ? (projectStore.members[issue.project] ?? []).map((m) => m.member) : []}
            hideDropdownArrow
            disabled={!editable}
            multiple
          />
        </div>
      )}
    </div>
  );
});
