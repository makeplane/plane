import React from "react";

// components
import { IssueColumn } from "components/issues";
// hooks
import useSubIssue from "hooks/use-sub-issue";
// types
import { IIssue, IIssueDisplayProperties } from "types";
import { EIssueActions } from "components/issues/issue-layouts/types";

type Props = {
  issue: IIssue;
  expandedIssues: string[];
  setExpandedIssues: React.Dispatch<React.SetStateAction<string[]>>;
  properties: IIssueDisplayProperties;
  quickActions: (issue: IIssue) => React.ReactNode;
  setIssuePeekOverView: React.Dispatch<
    React.SetStateAction<{
      workspaceSlug: string;
      projectId: string;
      issueId: string;
    } | null>
  >;
  disableUserActions: boolean;
  nestingLevel?: number;
};

export const SpreadsheetIssuesColumn: React.FC<Props> = ({
  issue,
  expandedIssues,
  setExpandedIssues,
  setIssuePeekOverView,
  properties,
  quickActions,
  disableUserActions,
  nestingLevel = 0,
}) => {
  const handleToggleExpand = (issueId: string) => {
    setExpandedIssues((prevState) => {
      const newArray = [...prevState];
      const index = newArray.indexOf(issueId);

      if (index > -1) newArray.splice(index, 1);
      else newArray.push(issueId);

      return newArray;
    });
  };

  const isExpanded = expandedIssues.indexOf(issue.id) > -1;

  const { subIssues, isLoading } = useSubIssue(issue.project_detail?.id, issue.id, isExpanded);

  return (
    <>
      <IssueColumn
        issue={issue}
        expanded={isExpanded}
        handleToggleExpand={handleToggleExpand}
        properties={properties}
        setIssuePeekOverView={setIssuePeekOverView}
        disableUserActions={disableUserActions}
        nestingLevel={nestingLevel}
        quickActions={quickActions}
      />

      {isExpanded &&
        !isLoading &&
        subIssues &&
        subIssues.length > 0 &&
        subIssues.map((subIssue) => (
          <SpreadsheetIssuesColumn
            key={subIssue.id}
            issue={subIssue}
            expandedIssues={expandedIssues}
            setExpandedIssues={setExpandedIssues}
            properties={properties}
            quickActions={quickActions}
            setIssuePeekOverView={setIssuePeekOverView}
            disableUserActions={disableUserActions}
            nestingLevel={nestingLevel + 1}
          />
        ))}
    </>
  );
};
