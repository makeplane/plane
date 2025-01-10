import React from "react";
import { TIssueServiceType } from "@plane/types";
// hooks
import { PriorityDropdown, MemberDropdown, StateDropdown } from "@/components/dropdowns";
import { useIssueDetail } from "@/hooks/store";
// components
// types
import { TSubIssueOperations } from "./root";

export interface IIssueProperty {
  workspaceSlug: string;
  parentIssueId: string;
  issueId: string;
  disabled: boolean;
  subIssueOperations: TSubIssueOperations;
  issueServiceType?: TIssueServiceType;
}

export const IssueProperty: React.FC<IIssueProperty> = (props) => {
  const { workspaceSlug, parentIssueId, issueId, disabled, subIssueOperations, issueServiceType } = props;
  // hooks
  const {
    issue: { getIssueById },
  } = useIssueDetail(issueServiceType);

  const issue = getIssueById(issueId);

  if (!issue) return <></>;
  return (
    <div className="relative flex items-center gap-2">
      <div className="h-5 flex-shrink-0">
        <StateDropdown
          value={issue.state_id}
          projectId={issue.project_id ?? undefined}
          onChange={(val) =>
            issue.project_id &&
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
            issue.project_id &&
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
        <MemberDropdown
          value={issue.assignee_ids}
          projectId={issue.project_id ?? undefined}
          onChange={(val) =>
            issue.project_id &&
            subIssueOperations.updateSubIssue(workspaceSlug, issue.project_id, parentIssueId, issueId, {
              assignee_ids: val,
            })
          }
          disabled={!disabled}
          multiple
          buttonVariant={(issue?.assignee_ids || []).length > 0 ? "transparent-without-text" : "border-without-text"}
          buttonClassName={(issue?.assignee_ids || []).length > 0 ? "hover:bg-transparent px-0" : ""}
        />
      </div>
    </div>
  );
};
