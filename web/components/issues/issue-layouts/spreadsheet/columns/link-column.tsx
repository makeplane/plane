import React from "react";
// hooks
import { useIssueDetail } from "hooks/store";
// types

type Props = {
  issueId: string;
  expandedIssues: string[];
};

export const SpreadsheetLinkColumn: React.FC<Props> = (props) => {
  const { issueId, expandedIssues } = props;

  const isExpanded = expandedIssues.indexOf(issueId) > -1;

  // const { subIssues, isLoading } = useSubIssue(issue.project_id, issue.id, isExpanded);

  const { subIssues: subIssuesStore, issue } = useIssueDetail();

  const issueDetail = issue.getIssueById(issueId);
  const subIssues = subIssuesStore.subIssuesByIssueId(issueId);

  return (
    <>
      <div className="flex h-11 w-full items-center px-2.5 py-1 text-xs border-b-[0.5px] border-custom-border-200 hover:bg-custom-background-80">
        {issueDetail?.link_count} {issueDetail?.link_count === 1 ? "link" : "links"}
      </div>

      {isExpanded &&
        subIssues &&
        subIssues.length > 0 &&
        subIssues.map((subIssueId: string) => (
          <div className={`h-11`}>
            <SpreadsheetLinkColumn key={subIssueId} issueId={subIssueId} expandedIssues={expandedIssues} />
          </div>
        ))}
    </>
  );
};
