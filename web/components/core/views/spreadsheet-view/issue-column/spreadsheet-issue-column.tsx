import React from "react";

// components
import { IssueColumn } from "components/core";
// hooks
import useSubIssue from "hooks/use-sub-issue";
// types
import { IIssue, Properties } from "types";

type Props = {
  issue: IIssue;
  projectId: string;
  expandedIssues: string[];
  setExpandedIssues: React.Dispatch<React.SetStateAction<string[]>>;
  properties: Properties;
  handleIssueAction: (issue: IIssue, action: "copy" | "delete" | "edit") => void;
  setCurrentProjectId: React.Dispatch<React.SetStateAction<string | null>>;
  disableUserActions: boolean;
  nestingLevel?: number;
};

export const SpreadsheetIssuesColumn: React.FC<Props> = ({
  issue,
  projectId,
  expandedIssues,
  setExpandedIssues,
  properties,
  handleIssueAction,
  setCurrentProjectId,
  disableUserActions,
  nestingLevel = 0,
}) => {
  const handleToggleExpand = (issueId: string) => {
    setExpandedIssues((prevState) => {
      const newArray = [...prevState];
      const index = newArray.indexOf(issueId);
      if (index > -1) {
        newArray.splice(index, 1);
      } else {
        newArray.push(issueId);
      }
      return newArray;
    });
  };

  const isExpanded = expandedIssues.indexOf(issue.id) > -1;

  const { subIssues, isLoading } = useSubIssue(issue.project_detail.id, issue.id, isExpanded);

  return (
    <div>
      <IssueColumn
        issue={issue}
        projectId={projectId}
        expanded={isExpanded}
        handleToggleExpand={handleToggleExpand}
        properties={properties}
        handleEditIssue={() => handleIssueAction(issue, "edit")}
        handleDeleteIssue={() => handleIssueAction(issue, "delete")}
        setCurrentProjectId={setCurrentProjectId}
        disableUserActions={disableUserActions}
        nestingLevel={nestingLevel}
      />

      {isExpanded &&
        !isLoading &&
        subIssues &&
        subIssues.length > 0 &&
        subIssues.map((subIssue: IIssue) => (
          <SpreadsheetIssuesColumn
            key={subIssue.id}
            issue={subIssue}
            projectId={subIssue.project_detail.id}
            expandedIssues={expandedIssues}
            setExpandedIssues={setExpandedIssues}
            properties={properties}
            handleIssueAction={handleIssueAction}
            setCurrentProjectId={setCurrentProjectId}
            disableUserActions={disableUserActions}
            nestingLevel={nestingLevel + 1}
          />
        ))}
    </div>
  );
};
