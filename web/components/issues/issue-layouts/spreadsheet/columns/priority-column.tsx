import React from "react";
// hooks
import { useIssueDetail } from "hooks/store";
// components
import { PriorityDropdown } from "components/dropdowns";
// types
import { TIssue } from "@plane/types";

type Props = {
  issueId: string;
  onChange: (issue: TIssue, data: Partial<TIssue>) => void;
  expandedIssues: string[];
  disabled: boolean;
};

export const SpreadsheetPriorityColumn: React.FC<Props> = (props) => {
  const { issueId, onChange, expandedIssues, disabled } = props;
  // store hooks
  const { subIssues: subIssuesStore, issue } = useIssueDetail();
  // derived values
  const issueDetail = issue.getIssueById(issueId);
  const subIssues = subIssuesStore.subIssuesByIssueId(issueId);
  const isExpanded = expandedIssues.indexOf(issueId) > -1;

  return (
    <>
      {issueDetail && (
        <div className="h-11 border-b-[0.5px] border-custom-border-200">
          <PriorityDropdown
            value={issueDetail.priority}
            onChange={(data) => onChange(issueDetail, { priority: data })}
            disabled={disabled}
            buttonVariant="transparent-with-text"
            buttonClassName="rounded-none text-left"
            buttonContainerClassName="w-full"
          />
        </div>
      )}

      {isExpanded &&
        subIssues &&
        subIssues.length > 0 &&
        subIssues.map((subIssueId: string) => (
          <SpreadsheetPriorityColumn
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
