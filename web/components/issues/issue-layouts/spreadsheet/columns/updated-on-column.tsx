import React from "react";

// hooks
import useSubIssue from "hooks/use-sub-issue";
// helpers
import { renderLongDetailDateFormat } from "helpers/date-time.helper";
// types
import { IIssue } from "types";

type Props = {
  issue: IIssue;
  expandedIssues: string[];
};

export const SpreadsheetUpdatedOnColumn: React.FC<Props> = (props) => {
  const { issue, expandedIssues } = props;

  const isExpanded = expandedIssues.indexOf(issue.id) > -1;

  const { subIssues, isLoading } = useSubIssue(issue.project_detail?.id, issue.id, isExpanded);

  return (
    <>
      <div className="flex items-center justify-center text-xs h-full w-full">
        {renderLongDetailDateFormat(issue.updated_at)}
      </div>

      {isExpanded &&
        !isLoading &&
        subIssues &&
        subIssues.length > 0 &&
        subIssues.map((subIssue: IIssue) => (
          <SpreadsheetUpdatedOnColumn key={subIssue.id} issue={subIssue} expandedIssues={expandedIssues} />
        ))}
    </>
  );
};
