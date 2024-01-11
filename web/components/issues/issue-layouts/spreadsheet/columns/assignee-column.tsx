import React from "react";
// hooks
import { useIssueDetail } from "hooks/store";
// components
import { ProjectMemberDropdown } from "components/dropdowns";
// types
import { TIssue } from "@plane/types";

type Props = {
  issueId: string;
  onChange: (issue: TIssue, data: Partial<TIssue>) => void;
  expandedIssues: string[];
  disabled: boolean;
};

export const SpreadsheetAssigneeColumn: React.FC<Props> = ({ issueId, onChange, expandedIssues, disabled }) => {
  const isExpanded = expandedIssues.indexOf(issueId) > -1;

  const { subIssues: subIssuesStore, issue } = useIssueDetail();

  const issueDetail = issue.getIssueById(issueId);
  const subIssues = subIssuesStore.subIssuesByIssueId(issueId);

  return (
    <>
      {issueDetail && (
        <div className="h-11 border-b-[0.5px] border-custom-border-200">
          <ProjectMemberDropdown
            value={issueDetail?.assignee_ids ?? []}
            onChange={(data) => onChange(issueDetail, { assignee_ids: data })}
            projectId={issueDetail?.project_id}
            disabled={disabled}
            multiple
            placeholder="Assignees"
            buttonVariant={issueDetail.assignee_ids?.length > 0 ? "transparent-without-text" : "transparent-with-text"}
            buttonClassName="text-left"
            buttonContainerClassName="w-full"
          />
        </div>
      )}

      {isExpanded &&
        subIssues &&
        subIssues.length > 0 &&
        subIssues.map((subIssueId) => (
          <SpreadsheetAssigneeColumn
            key={subIssueId}
            issueId={subIssueId}
            onChange={onChange}
            expandedIssues={expandedIssues}
            disabled={disabled}
          />
        ))}
    </>
  );
};
