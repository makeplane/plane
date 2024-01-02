import React from "react";
// hooks
import { useIssueDetail } from "hooks/store";
// helpers
import { renderFormattedDate } from "helpers/date-time.helper";
// types

type Props = {
  issueId: string;
  expandedIssues: string[];
};

export const SpreadsheetCreatedOnColumn: React.FC<Props> = ({ issueId, expandedIssues }) => {
  const isExpanded = expandedIssues.indexOf(issueId) > -1;

  const { subIssues: subIssuesStore, issue } = useIssueDetail();

  const issueDetail = issue.getIssueById(issueId);
  const subIssues = subIssuesStore.subIssuesByIssueId(issueId);

  return (
    <>
      {issueDetail && (
        <div className="flex h-11 w-full items-center justify-center text-xs border-b-[0.5px] border-custom-border-200 hover:bg-custom-background-80">
          {renderFormattedDate(issueDetail.created_at)}
        </div>
      )}
      {isExpanded &&
        subIssues &&
        subIssues.length > 0 &&
        subIssues.map((subIssueId: string) => (
          <div className="h-11">
            <SpreadsheetCreatedOnColumn key={subIssueId} issueId={subIssueId} expandedIssues={expandedIssues} />
          </div>
        ))}
    </>
  );
};
