import React from "react";

// components
import { IssueColumn } from "components/issues";
// hooks
import useSubIssue from "hooks/use-sub-issue";
// types
import { TIssue, IIssueDisplayProperties } from "types";

type Props = {
  issue: TIssue;
  expandedIssues: string[];
  setExpandedIssues: React.Dispatch<React.SetStateAction<string[]>>;
  properties: IIssueDisplayProperties;
  quickActions: (issue: TIssue, customActionButton?: React.ReactElement) => React.ReactNode;
  canEditProperties: (projectId: string | undefined) => boolean;
  nestingLevel?: number;
};

export const SpreadsheetIssuesColumn: React.FC<Props> = ({
  issue,
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

  const isExpanded = expandedIssues.indexOf(issue.id) > -1;

  const { subIssues, isLoading } = useSubIssue(issue.project_id, issue.id, isExpanded);

  return (
    <>
      <IssueColumn
        issue={issue}
        expanded={isExpanded}
        handleToggleExpand={handleToggleExpand}
        properties={properties}
        canEditProperties={canEditProperties}
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
            canEditProperties={canEditProperties}
            nestingLevel={nestingLevel + 1}
          />
        ))}
    </>
  );
};
