import React from "react";
// hooks
import useSubIssue from "hooks/use-sub-issue";
// types
import { IIssue } from "types";

type Props = {
  issue: IIssue;
  expandedIssues: string[];
};

export const SpreadsheetLinkColumn: React.FC<Props> = (props) => {
  const { issue, expandedIssues } = props;

  const isExpanded = expandedIssues.indexOf(issue.id) > -1;

  const { subIssues, isLoading } = useSubIssue(issue.project_detail?.id, issue.id, isExpanded);

  return (
    <>
      <div className="flex h-11 w-full items-center px-2.5 py-1 text-xs border-b-[0.5px] border-custom-border-200">
        {issue.link_count} {issue.link_count === 1 ? "link" : "links"}
      </div>

      {isExpanded &&
        !isLoading &&
        subIssues &&
        subIssues.length > 0 &&
        subIssues.map((subIssue: IIssue) => (
          <div className={`h-11`}>
            <SpreadsheetLinkColumn key={subIssue.id} issue={subIssue} expandedIssues={expandedIssues} />
          </div>
        ))}
    </>
  );
};
