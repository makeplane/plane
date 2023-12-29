import React from "react";
import { mutate } from "swr";
// services
import { IssueService } from "services/issue";
// components
import { PriorityDropdown, ProjectMemberDropdown, StateDropdown } from "components/dropdowns";
// types
import { TIssue } from "@plane/types";
// fetch-keys
import { SUB_ISSUES } from "constants/fetch-keys";

export interface IIssueProperty {
  workspaceSlug: string;
  parentIssue: TIssue;
  issue: TIssue;
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
      state_id: data,
    });
  };

  const handleAssigneeChange = (data: string[]) => {
    partialUpdateIssue({ assignee_ids: data });
  };

  const partialUpdateIssue = async (data: Partial<TIssue>) => {
    mutate(
      workspaceSlug && parentIssue ? SUB_ISSUES(parentIssue.id) : null,
      (elements: any) => {
        const _elements = { ...elements };
        const _issues = _elements.sub_issues.map((element: TIssue) =>
          element.id === issue.id ? { ...element, ...data } : element
        );
        _elements["sub_issues"] = [..._issues];
        return _elements;
      },
      false
    );

    const issueResponse = await issueService.patchIssue(workspaceSlug as string, issue.project_id, issue.id, data);

    mutate(
      SUB_ISSUES(parentIssue.id),
      (elements: any) => {
        const _elements = elements.sub_issues.map((element: TIssue) =>
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
        <StateDropdown
          value={issue?.state_id}
          projectId={issue?.project_id}
          onChange={handleStateChange}
          disabled={!editable}
          buttonVariant="border-with-text"
        />
      </div>

      <div className="h-5 flex-shrink-0">
        <PriorityDropdown
          value={issue.priority}
          onChange={handlePriorityChange}
          disabled={!editable}
          buttonVariant="border-without-text"
          buttonClassName="border"
        />
      </div>

      <div className="h-5 flex-shrink-0">
        <ProjectMemberDropdown
          projectId={issue?.project_id}
          value={issue?.assignee_ids}
          onChange={handleAssigneeChange}
          disabled={!editable}
          multiple
          buttonVariant={issue.assignee_ids.length > 0 ? "transparent-without-text" : "border-without-text"}
          buttonClassName={issue.assignee_ids.length > 0 ? "hover:bg-transparent px-0" : ""}
        />
      </div>
    </div>
  );
};
