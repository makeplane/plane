import React from "react";

// components
import { IssueColumn } from "components/issues";
// hooks
import useSubIssue from "hooks/use-sub-issue";
// types
import { IIssue, IIssueDisplayProperties } from "types";

type Props = {
  issue: IIssue;
  expandedIssues: string[];
  setExpandedIssues: React.Dispatch<React.SetStateAction<string[]>>;
  handleUpdateIssue: (issue: IIssue, data: Partial<IIssue>) => void;
  properties: IIssueDisplayProperties;
  handleIssueAction: (issue: IIssue, action: "copy" | "delete" | "edit") => void;
  disableUserActions: boolean;
  nestingLevel?: number;
};

export const SpreadsheetIssuesColumn: React.FC<Props> = ({
  issue,
  expandedIssues,
  setExpandedIssues,
  handleUpdateIssue,
  properties,
  handleIssueAction,
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

  const { subIssues, isLoading } = useSubIssue(issue.project_detail.id, issue.id, isExpanded);

  return (
    <>
      <IssueColumn
        issue={issue}
        expanded={isExpanded}
        handleToggleExpand={handleToggleExpand}
        properties={properties}
        handleUpdateIssue={handleUpdateIssue}
        handleEditIssue={() => handleIssueAction(issue, "edit")}
        handleDeleteIssue={() => handleIssueAction(issue, "delete")}
        disableUserActions={disableUserActions}
        nestingLevel={nestingLevel}
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
            handleUpdateIssue={handleUpdateIssue}
            setExpandedIssues={setExpandedIssues}
            properties={properties}
            handleIssueAction={handleIssueAction}
            disableUserActions={disableUserActions}
            nestingLevel={nestingLevel + 1}
          />
        ))}
    </>
  );
};
