import React from "react";
// hooks
import useSubIssue from "hooks/use-sub-issue";
// types
import { IIssue } from "types";

type Props = {
  issue: IIssue;
  expandedIssues: string[];
};

export const SpreadsheetAttachmentColumn: React.FC<Props> = (props) => {
  const { issue, expandedIssues } = props;

  const isExpanded = expandedIssues.indexOf(issue.id) > -1;

  const { subIssues, isLoading } = useSubIssue(issue.project_detail.id, issue.id, isExpanded);

  return (
    <>
      <div className="flex items-center justify-center text-xs h-full w-full">
        {issue.attachment_count} {issue.attachment_count === 1 ? "attachment" : "attachments"}
      </div>

      {isExpanded &&
        !isLoading &&
        subIssues &&
        subIssues.length > 0 &&
        subIssues.map((subIssue: IIssue) => (
          <SpreadsheetAttachmentColumn key={subIssue.id} issue={subIssue} expandedIssues={expandedIssues} />
        ))}
    </>
  );
};
