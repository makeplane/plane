import React from "react";
// hooks
// import useSubIssue from "hooks/use-sub-issue";
// helpers
import { renderFormattedDate } from "helpers/date-time.helper";
// types
import { useIssueDetail } from "hooks/store";

type Props = {
  issueId: string;
  expandedIssues: string[];
};

export const SpreadsheetUpdatedOnColumn: React.FC<Props> = (props) => {
  const { issueId, expandedIssues } = props;

  const isExpanded = expandedIssues.indexOf(issueId) > -1;

  // const { subIssues, isLoading } = useSubIssue(issue.project_id, issue.id, isExpanded);
  const { subIssues: subIssuesStore, issue } = useIssueDetail();

  const issueDetail = issue.getIssueById(issueId);
  const subIssues = subIssuesStore.subIssuesByIssueId(issueId);

  return (
    <>
      {issueDetail && (
        <div className="flex h-11 w-full items-center justify-center text-xs border-b-[0.5px] border-custom-border-200 hover:bg-custom-background-80">
          {renderFormattedDate(issueDetail.updated_at)}
        </div>
      )}

      {isExpanded &&
        subIssues &&
        subIssues.length > 0 &&
        subIssues.map((subIssueId: string) => (
          <div className={`h-11`}>
            <SpreadsheetUpdatedOnColumn key={subIssueId} issueId={subIssueId} expandedIssues={expandedIssues} />
          </div>
        ))}
    </>
  );
};
