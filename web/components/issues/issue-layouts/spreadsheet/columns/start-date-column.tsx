import React from "react";

// components
import { ViewStartDateSelect } from "components/issues";
// hooks
import { useIssueDetail } from "hooks/store";
// types
import { TIssue } from "types";

type Props = {
  issueId: string;
  onChange: (issue: TIssue, formData: Partial<TIssue>) => void;
  expandedIssues: string[];
  disabled: boolean;
};

export const SpreadsheetStartDateColumn: React.FC<Props> = ({ issueId, onChange, expandedIssues, disabled }) => {
  const isExpanded = expandedIssues.indexOf(issueId) > -1;

  // const { subIssues, isLoading, mutateSubIssues } = useSubIssue(issue.project_id, issue.id, isExpanded);

  const { subIssues: subIssuesStore, issue } = useIssueDetail();

  const issueDetail = issue.getIssueById(issueId);
  const subIssues = subIssuesStore.subIssuesByIssueId(issueId);

  return (
    <>
      {issueDetail && (
        <ViewStartDateSelect
          issue={issueDetail}
          onChange={(val) => {
            onChange(issueDetail, { start_date: val || undefined });
          }}
          className="flex !h-11 !w-full max-w-full items-center px-2.5 py-1 border-b-[0.5px] border-custom-border-200 hover:bg-custom-background-80"
          noBorder
          disabled={disabled}
        />
      )}

      {isExpanded &&
        subIssues &&
        subIssues.length > 0 &&
        subIssues.map((subIssueId: string) => (
          <div className={`h-11`}>
            <SpreadsheetStartDateColumn
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
