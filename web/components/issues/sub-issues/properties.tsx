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
// hooks
import useIssuesProperties from "hooks/use-issue-properties";
// types
import { IUser, IIssue, IState } from "types";
// fetch-keys
import { SUB_ISSUES } from "constants/fetch-keys";

export interface IIssueProperty {
  workspaceSlug: string;
  projectId: string;
  parentIssue: IIssue;
  issue: IIssue;
  user: IUser | undefined;
  editable: boolean;
}

// services
const issueService = new IssueService();
const trackEventService = new TrackEventService();

export const IssueProperty: React.FC<IIssueProperty> = observer(
  ({ workspaceSlug, projectId, parentIssue, issue, user, editable }) => {
    const [properties] = useIssuesProperties(workspaceSlug, projectId);

    const { project: projectStore } = useMobxStore();

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
              stateGroups={projectStore.states ? projectStore.states[issue.project] : undefined}
              onChange={(data) => handleStateChange(data)}
              hideDropdownArrow
              disabled={!editable}
            />
          </div>
        )}

        {properties.start_date && issue.start_date && (
          <div className="flex-shrink-0 w-[104px]">
            <ViewStartDateSelect
              issue={issue}
              onChange={(val) => partialUpdateIssue({ start_date: val })}
              disabled={!editable}
            />
          </div>
        )}

        {properties.due_date && issue.target_date && (
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

        {properties.assignee && (
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
  }
);
