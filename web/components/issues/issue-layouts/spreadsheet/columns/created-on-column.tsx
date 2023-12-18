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

export const SpreadsheetCreatedOnColumn: React.FC<Props> = ({ issue, expandedIssues }) => {
  const isExpanded = expandedIssues.indexOf(issue.id) > -1;

  const { subIssues, isLoading } = useSubIssue(issue.project, issue.id, isExpanded);

  return (
    <>
      <div className="flex h-11 w-full items-center justify-center text-xs border-b-[0.5px] border-custom-border-200 hover:bg-custom-background-80">
        {renderLongDetailDateFormat(issue.created_at)}
      </div>

      {isExpanded &&
        !isLoading &&
        subIssues &&
        subIssues.length > 0 &&
        subIssues.map((subIssue: IIssue) => (
          <div className="h-11">
            <SpreadsheetCreatedOnColumn key={subIssue.id} issue={subIssue} expandedIssues={expandedIssues} />
          </div>
        ))}
    </>
  );
};
