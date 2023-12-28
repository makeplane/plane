import React from "react";

// components
import { PrioritySelect } from "components/project";
// hooks
import { useIssueDetail } from "hooks/store";
// types
import { TIssue } from "@plane/types";

type Props = {
  issueId: string;
  onChange: (issue: TIssue, data: Partial<TIssue>) => void;
  expandedIssues: string[];
  disabled: boolean;
};

export const SpreadsheetPriorityColumn: React.FC<Props> = ({ issueId, onChange, expandedIssues, disabled }) => {
  const isExpanded = expandedIssues.indexOf(issueId) > -1;

  // const { subIssues, isLoading, mutateSubIssues } = useSubIssue(issue.project_id, issue.id, isExpanded);

  const { subIssues: subIssuesStore, issue } = useIssueDetail();

  const issueDetail = issue.getIssueById(issueId);
  const subIssues = subIssuesStore.subIssuesByIssueId(issueId);

  return (
    <>
      {issueDetail && (
        <PrioritySelect
          value={issueDetail.priority}
          onChange={(data) => {
            onChange(issueDetail, { priority: data });
          }}
          className="h-11 w-full border-b-[0.5px] border-custom-border-200 hover:bg-custom-background-80"
          buttonClassName="!shadow-none !border-0 h-full w-full px-2.5 py-1"
          showTitle
          highlightUrgentPriority={false}
          hideDropdownArrow
          disabled={disabled}
        />
      )}

      {isExpanded &&
        subIssues &&
        subIssues.length > 0 &&
        subIssues.map((subIssueId: string) => (
          <div className={`h-11`}>
            <SpreadsheetPriorityColumn
              key={subIssueId}
              issueId={subIssueId}
              onChange={onChange}
              expandedIssues={expandedIssues}
              disabled={disabled}
            />
          </div>
        ))}
    </>
  );
};
