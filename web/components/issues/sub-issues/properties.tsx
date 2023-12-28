import React from "react";
import { mutate } from "swr";
// services
import { IssueService } from "services/issue";
// components
import { PriorityDropdown, ProjectMemberDropdown, StateDropdown } from "components/dropdowns";
// types
import { IIssue } from "types";
// fetch-keys
import { SUB_ISSUES } from "constants/fetch-keys";

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

  const handleStateChange = (data: string) => {
    partialUpdateIssue({
      state: data,
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
      <div className="h-5 flex-shrink-0">
        <PriorityDropdown
          value={issue.priority}
          onChange={handlePriorityChange}
          disabled={!editable}
          buttonVariant="background-without-text"
        />
      </div>

      <div className="h-5 flex-shrink-0">
        <StateDropdown
          value={issue?.state}
          projectId={issue?.project}
          onChange={handleStateChange}
          disabled={!editable}
          buttonVariant="background-with-text"
        />
      </div>

      <div className="h-5 flex-shrink-0">
        <ProjectMemberDropdown
          projectId={issue?.project}
          value={issue?.assignees}
          onChange={(val) => handleAssigneeChange(val)}
          disabled={!editable}
          multiple
          buttonVariant="background-without-text"
        />
      </div>
    </div>
  );
};
