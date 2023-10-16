import React from "react";

// components
import { DueDateColumn } from "components/core";
// hooks
import useSubIssue from "hooks/use-sub-issue";
// types
import { IIssue, Properties } from "types";

type Props = {
  issue: IIssue;
  onChange: (date: string | null) => void;
  expandedIssues: string[];
  properties: Properties;
  disabled: boolean;
};

export const SpreadsheetDueDateColumn: React.FC<Props> = ({
  issue,
  onChange,
  expandedIssues,
  properties,
  disabled,
}) => {
  const isExpanded = expandedIssues.indexOf(issue.id) > -1;

  const { subIssues, isLoading } = useSubIssue(issue.project_detail.id, issue.id, isExpanded);

  return (
    <div>
      <DueDateColumn issue={issue} properties={properties} onChange={onChange} disabled={disabled} />

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
            properties={properties}
            disabled={disabled}
          />
        ))}
    </div>
  );
};
