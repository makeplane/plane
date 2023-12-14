import React from "react";
import { mutate } from "swr";
// services
import { IssueService } from "services/issue";
// components
import { PrioritySelect } from "components/project";
// types
import { IIssue, IState } from "types";
// fetch-keys
import { SUB_ISSUES } from "constants/fetch-keys";
import { IssuePropertyAssignee, IssuePropertyState } from "../issue-layouts/properties";

export interface IIssueProperty {
  workspaceSlug: string;
  parentIssue: IIssue;
  issue: IIssue;
  editable: boolean;
}

// services
const issueService = new IssueService();

export const IssueProperty: React.FC<IIssueProperty> = (props) => {
  const { workspaceSlug, parentIssue, issue, editable } = props;

  const handlePriorityChange = (data: any) => {
    partialUpdateIssue({ priority: data });
  };

  const handleStateChange = (data: IState) => {
    partialUpdateIssue({
      state: data.id,
      state_detail: data,
    });
  };

  const handleAssigneeChange = (data: string[]) => {
    partialUpdateIssue({ assignees: data });
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

    const issueResponse = await issueService.patchIssue(workspaceSlug as string, issue.project, issue.id, data);

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
    <div className="relative flex items-center gap-2">
      <div className="flex-shrink-0">
        <PrioritySelect value={issue.priority} onChange={handlePriorityChange} hideDropdownArrow disabled={!editable} />
      </div>

      <div className="flex-shrink-0">
        <IssuePropertyState
          projectId={issue?.project_detail?.id || null}
          value={issue?.state || null}
          onChange={(data) => handleStateChange(data)}
          disabled={!editable}
          hideDropdownArrow
        />
      </div>

      <div className="flex-shrink-0">
        <IssuePropertyAssignee
          projectId={issue?.project_detail?.id || null}
          value={issue?.assignees || null}
          hideDropdownArrow
          onChange={(val) => handleAssigneeChange(val)}
          disabled={!editable}
        />
      </div>
    </div>
  );
};
