"use client";
import React, { FC } from "react";
import { observer } from "mobx-react";
// components
import { TIssuePriorities } from "@plane/types";
import { PriorityDropdown, MemberDropdown, StateDropdown } from "@/components/dropdowns";
// hooks
import { useIssueDetail } from "@/hooks/store";
// types
import { TRelationIssueOperations } from "../issue-detail-widgets/relations/helper";

type Props = {
  workspaceSlug: string;
  issueId: string;
  disabled: boolean;
  issueOperations: TRelationIssueOperations;
};

export const RelationIssueProperty: FC<Props> = observer((props) => {
  const { workspaceSlug, issueId, disabled, issueOperations } = props;
  // hooks
  const {
    issue: { getIssueById },
  } = useIssueDetail();

  // derived value
  const issue = getIssueById(issueId);

  // if issue is not found, return empty
  if (!issue) return <></>;

  // handlers
  const handleStateChange = (val: string) =>
    issue.project_id &&
    issueOperations.update(workspaceSlug, issue.project_id, issueId, {
      state_id: val,
    });

  const handlePriorityChange = (val: TIssuePriorities) =>
    issue.project_id &&
    issueOperations.update(workspaceSlug, issue.project_id, issueId, {
      priority: val,
    });

  const handleAssigneeChange = (val: string[]) =>
    issue.project_id &&
    issueOperations.update(workspaceSlug, issue.project_id, issueId, {
      assignee_ids: val,
    });

  return (
    <div className="relative flex items-center gap-2">
      <div className="h-5 flex-shrink-0">
        <StateDropdown
          value={issue.state_id}
          projectId={issue.project_id ?? undefined}
          onChange={handleStateChange}
          disabled={disabled}
          buttonVariant="border-with-text"
        />
      </div>

      <div className="h-5 flex-shrink-0">
        <PriorityDropdown
          value={issue.priority}
          onChange={handlePriorityChange}
          disabled={disabled}
          buttonVariant="border-without-text"
          buttonClassName="border"
        />
      </div>

      <div className="h-5 flex-shrink-0">
        <MemberDropdown
          value={issue.assignee_ids}
          projectId={issue.project_id ?? undefined}
          onChange={handleAssigneeChange}
          disabled={disabled}
          multiple
          buttonVariant={(issue?.assignee_ids || []).length > 0 ? "transparent-without-text" : "border-without-text"}
          buttonClassName={(issue?.assignee_ids || []).length > 0 ? "hover:bg-transparent px-0" : ""}
        />
      </div>
    </div>
  );
});
