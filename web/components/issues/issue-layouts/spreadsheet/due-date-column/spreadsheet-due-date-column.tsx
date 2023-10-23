import React from "react";

// components
import { DueDateColumn } from "components/issues";
// hooks
import useSubIssue from "hooks/use-sub-issue";
// types
import { IIssue } from "types";

type Props = {
  issue: IIssue;
  onChange: (data: Partial<IIssue>) => void;
  expandedIssues: string[];
  disabled: boolean;
};

export const SpreadsheetDueDateColumn: React.FC<Props> = ({ issue, onChange, expandedIssues, disabled }) => {
  const isExpanded = expandedIssues.indexOf(issue.id) > -1;

  const { subIssues, isLoading } = useSubIssue(issue.project_detail.id, issue.id, isExpanded);

  return (
    <div>
      <DueDateColumn issue={issue} onChange={(val) => onChange({ target_date: val })} disabled={disabled} />

      {isExpanded &&
        !isLoading &&
        subIssues &&
        subIssues.length > 0 &&
        subIssues.map((subIssue: IIssue) => (
          <SpreadsheetDueDateColumn
            key={subIssue.id}
            issue={subIssue}
            onChange={onChange}
            expandedIssues={expandedIssues}
            disabled={disabled}
          />
        ))}
    </div>
  );
};
