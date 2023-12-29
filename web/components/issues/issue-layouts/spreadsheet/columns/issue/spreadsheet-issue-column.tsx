import React from "react";

// components
import { IssueColumn } from "components/issues";
// hooks
import { useIssueDetail } from "hooks/store";
// types
import { TIssue, IIssueDisplayProperties } from "@plane/types";

type Props = {
  issueId: string;
  expandedIssues: string[];
  setExpandedIssues: React.Dispatch<React.SetStateAction<string[]>>;
  properties: IIssueDisplayProperties;
  quickActions: (issue: TIssue, customActionButton?: React.ReactElement) => React.ReactNode;
  canEditProperties: (projectId: string | undefined) => boolean;
  nestingLevel?: number;
};

export const SpreadsheetIssuesColumn: React.FC<Props> = ({
  issueId,
  expandedIssues,
  setExpandedIssues,
  properties,
  quickActions,
  canEditProperties,
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

  const isExpanded = expandedIssues.indexOf(issueId) > -1;

  // const { subIssues, isLoading } = useSubIssue(issue.project_id, issue.id, isExpanded);

  const { subIssues: subIssuesStore, issue } = useIssueDetail();

  const issueDetail = issue.getIssueById(issueId);
  const subIssues = subIssuesStore.subIssuesByIssueId(issueId);

  return (
    <>
      {issueDetail && (
        <IssueColumn
          issue={issueDetail}
          expanded={isExpanded}
          handleToggleExpand={handleToggleExpand}
          properties={properties}
          canEditProperties={canEditProperties}
          nestingLevel={nestingLevel}
          quickActions={quickActions}
        />
      )}

      {isExpanded &&
        subIssues &&
        subIssues.length > 0 &&
        subIssues.map((subIssueId: string) => (
          <SpreadsheetIssuesColumn
            key={subIssueId}
            issueId={subIssueId}
            expandedIssues={expandedIssues}
            setExpandedIssues={setExpandedIssues}
            properties={properties}
            quickActions={quickActions}
            canEditProperties={canEditProperties}
            nestingLevel={nestingLevel + 1}
          />
        ))}
    </>
  );
};
