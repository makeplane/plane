import React from "react";

// components
import { ViewDueDateSelect } from "components/issues";
// hooks
import useSubIssue from "hooks/use-sub-issue";
// types
import { TIssue } from "types";

type Props = {
  issue: TIssue;
  onChange: (issue: TIssue, data: Partial<TIssue>) => void;
  expandedIssues: string[];
  disabled: boolean;
};

export const SpreadsheetDueDateColumn: React.FC<Props> = ({ issue, onChange, expandedIssues, disabled }) => {
  const isExpanded = expandedIssues.indexOf(issue.id) > -1;

  const { subIssues, isLoading, mutateSubIssues } = useSubIssue(issue.project_id, issue.id, isExpanded);

  return (
    <>
      <ViewDueDateSelect
        issue={issue}
        onChange={(val) => {
          onChange(issue, { target_date: val || undefined });
          if (issue.parent_id) {
            mutateSubIssues(issue, { target_date: val || undefined });
          }
        }}
        className="flex !h-11 !w-full max-w-full items-center px-2.5 py-1 border-b-[0.5px] border-custom-border-200 hover:bg-custom-background-80"
        noBorder
        disabled={disabled}
      />

      {isExpanded &&
        !isLoading &&
        subIssues &&
        subIssues.length > 0 &&
        subIssues.map((subIssue: TIssue) => (
          <div className={`h-11`}>
            <SpreadsheetDueDateColumn
              key={subIssue.id}
              issue={subIssue}
              onChange={onChange}
              expandedIssues={expandedIssues}
              disabled={disabled}
            />
          </div>
        ))}
    </>
  );
};
