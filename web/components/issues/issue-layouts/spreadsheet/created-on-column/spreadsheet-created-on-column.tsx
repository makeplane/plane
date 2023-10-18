import React from "react";

// components
import { CreatedOnColumn } from "components/issues";
// hooks
import useSubIssue from "hooks/use-sub-issue";
// types
import { IIssue } from "types";

type Props = {
  issue: IIssue;
  expandedIssues: string[];
};

export const SpreadsheetCreatedOnColumn: React.FC<Props> = ({ issue, expandedIssues }) => {
  const isExpanded = expandedIssues.indexOf(issue.id) > -1;

  const { subIssues, isLoading } = useSubIssue(issue.project_detail.id, issue.id, isExpanded);

  return (
    <div>
      <CreatedOnColumn issue={issue} />

      {isExpanded &&
        !isLoading &&
        subIssues &&
        subIssues.length > 0 &&
        subIssues.map((subIssue: IIssue) => (
          <SpreadsheetCreatedOnColumn key={subIssue.id} issue={subIssue} expandedIssues={expandedIssues} />
        ))}
    </div>
  );
};
