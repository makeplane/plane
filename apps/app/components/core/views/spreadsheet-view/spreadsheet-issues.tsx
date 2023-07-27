import React, { useState } from "react";

// components
import { SingleSpreadsheetIssue } from "components/core";
// hooks
import useSubIssue from "hooks/use-sub-issue";
// types
import { ICurrentUserResponse, IIssue, Properties, UserAuth } from "types";

type Props = {
  issue: IIssue;
  index: number;
  expandedIssues: string[];
  setExpandedIssues: React.Dispatch<React.SetStateAction<string[]>>;
  properties: Properties;
  handleIssueAction: (issue: IIssue, action: "copy" | "delete" | "edit") => void;
  gridTemplateColumns: string;
  disableUserActions: boolean;
  user: ICurrentUserResponse | undefined;
  userAuth: UserAuth;
  nestingLevel?: number;
};

export const SpreadsheetIssues: React.FC<Props> = ({
  index,
  issue,
  expandedIssues,
  setExpandedIssues,
  gridTemplateColumns,
  properties,
  handleIssueAction,
  disableUserActions,
  user,
  userAuth,
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

  const { subIssues, isLoading } = useSubIssue(issue.id, isExpanded);

  return (
    <div>
      <SingleSpreadsheetIssue
        issue={issue}
        index={index}
        expanded={isExpanded}
        handleToggleExpand={handleToggleExpand}
        gridTemplateColumns={gridTemplateColumns}
        properties={properties}
        handleEditIssue={() => handleIssueAction(issue, "edit")}
        handleDeleteIssue={() => handleIssueAction(issue, "delete")}
        disableUserActions={disableUserActions}
        user={user}
        userAuth={userAuth}
        nestingLevel={nestingLevel}
      />

      {isExpanded &&
        !isLoading &&
        subIssues &&
        subIssues.length > 0 &&
        subIssues.map((subIssue: IIssue) => (
          <SpreadsheetIssues
            key={subIssue.id}
            issue={subIssue}
            index={index}
            expandedIssues={expandedIssues}
            setExpandedIssues={setExpandedIssues}
            gridTemplateColumns={gridTemplateColumns}
            properties={properties}
            handleIssueAction={handleIssueAction}
            disableUserActions={disableUserActions}
            user={user}
            userAuth={userAuth}
            nestingLevel={nestingLevel + 1}
          />
        ))}
    </div>
  );
};
