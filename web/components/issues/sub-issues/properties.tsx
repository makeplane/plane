import React from "react";
// hooks
import { useIssueDetail } from "hooks/store";
// components
import { PriorityDropdown, ProjectMemberDropdown, StateDropdown } from "components/dropdowns";
// types
import { TSubIssueOperations } from "./root";

export interface IIssueProperty {
  workspaceSlug: string;
  parentIssueId: string;
  issueId: string;
  disabled: boolean;
  subIssueOperations: TSubIssueOperations;
}

export const IssueProperty: React.FC<IIssueProperty> = (props) => {
  const { workspaceSlug, parentIssueId, issueId, disabled, subIssueOperations } = props;
  // hooks
  const {
    issue: { getIssueById },
  } = useIssueDetail();

  const issue = getIssueById(issueId);

  if (!issue) return <></>;
  return (
    <div className="relative flex items-center gap-2">
      <div className="h-5 flex-shrink-0">
        <StateDropdown
          value={issue.state_id}
          projectId={issue.project_id}
          onChange={(val) =>
            subIssueOperations.updateSubIssue(
              workspaceSlug,
              issue.project_id,
              parentIssueId,
              issueId,
              {
                state_id: val,
              },
              { ...issue }
            )
          }
          disabled={!disabled}
          buttonVariant="border-with-text"
        />
      </div>

      <div className="h-5 flex-shrink-0">
        <PriorityDropdown
          value={issue.priority}
          onChange={(val) =>
            subIssueOperations.updateSubIssue(workspaceSlug, issue.project_id, parentIssueId, issueId, {
              priority: val,
            })
          }
          disabled={!disabled}
          buttonVariant="border-without-text"
          buttonClassName="border"
        />
      </div>

      <div className="h-5 flex-shrink-0">
        <ProjectMemberDropdown
          value={issue.assignee_ids}
          projectId={issue.project_id}
          onChange={(val) =>
            subIssueOperations.updateSubIssue(workspaceSlug, issue.project_id, parentIssueId, issueId, {
              assignee_ids: val,
            })
          }
          disabled={!disabled}
          multiple
          buttonVariant={issue.assignee_ids.length > 0 ? "transparent-without-text" : "border-without-text"}
          buttonClassName={issue.assignee_ids.length > 0 ? "hover:bg-transparent px-0" : ""}
        />
      </div>
    </div>
  );
};
