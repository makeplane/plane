import React from "react";
// hooks
import useSubIssue from "hooks/use-sub-issue";
// components
import { PriorityDropdown } from "components/dropdowns";
// types
import { IIssue } from "types";

type Props = {
  issue: IIssue;
  onChange: (issue: IIssue, data: Partial<IIssue>) => void;
  expandedIssues: string[];
  disabled: boolean;
};

export const SpreadsheetPriorityColumn: React.FC<Props> = ({ issue, onChange, expandedIssues, disabled }) => {
  const isExpanded = expandedIssues.indexOf(issue.id) > -1;

  const { subIssues, isLoading, mutateSubIssues } = useSubIssue(issue.project_detail?.id, issue.id, isExpanded);

  return (
    <>
      <div className="h-11 border-b-[0.5px] border-custom-border-200">
        <PriorityDropdown
          value={issue.priority}
          onChange={(data) => {
            onChange(issue, { priority: data });
            if (issue.parent) mutateSubIssues(issue, { priority: data });
          }}
          disabled={disabled}
          buttonVariant="transparent-with-text"
          buttonClassName="rounded-none"
        />
      </div>

      {isExpanded &&
        !isLoading &&
        subIssues &&
        subIssues.length > 0 &&
        subIssues.map((subIssue: IIssue) => (
          <SpreadsheetPriorityColumn
            key={subIssue.id}
            issue={subIssue}
            onChange={onChange}
            expandedIssues={expandedIssues}
            disabled={disabled}
          />
        ))}
    </>
  );
};
