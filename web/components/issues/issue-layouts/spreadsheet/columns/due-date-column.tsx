import React from "react";
// hooks
import { useIssueDetail } from "hooks/store";
// components
import { DateDropdown } from "components/dropdowns";
// helpers
import { renderFormattedPayloadDate } from "helpers/date-time.helper";
// types
import { TIssue } from "@plane/types";

type Props = {
  issueId: string;
  onChange: (issue: TIssue, data: Partial<TIssue>) => void;
  expandedIssues: string[];
  disabled: boolean;
};

export const SpreadsheetDueDateColumn: React.FC<Props> = ({ issueId, onChange, expandedIssues, disabled }) => {
  const isExpanded = expandedIssues.indexOf(issueId) > -1;

  // const { subIssues, isLoading, mutateSubIssues } = useSubIssue(issue.project_id, issue.id, isExpanded);
  const { subIssues: subIssuesStore, issue } = useIssueDetail();

  const issueDetail = issue.getIssueById(issueId);
  const subIssues = subIssuesStore.subIssuesByIssueId(issueId);

  return (
    <>
      {issueDetail && (
        <div className="h-11 border-b-[0.5px] border-custom-border-200">
          <DateDropdown
            value={issueDetail.target_date}
            onChange={(data) => onChange(issueDetail, { target_date: data ? renderFormattedPayloadDate(data) : null })}
            disabled={disabled}
            placeholder="Due date"
            buttonVariant="transparent-with-text"
            buttonClassName="rounded-none text-left"
            buttonContainerClassName="w-full"
          />
        </div>
      )}

      {isExpanded &&
        subIssues &&
        subIssues.length > 0 &&
        subIssues.map((subIssueId) => (
          <SpreadsheetDueDateColumn
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
