import React, { useState } from "react";

// components
import { SingleSpreadsheetIssue } from "components/core";
// hooks
import useSubIssue from "hooks/use-sub-issue";
// types
import { ICurrentUserResponse, IIssue, Properties, UserAuth } from "types";

type Props = {
  key: string;
  issue: IIssue;
  expandedIssues: string[];
  setExpandedIssues: React.Dispatch<React.SetStateAction<string[]>>;
  properties: Properties;
  handleEditIssue: (issue: IIssue) => void;
  handleDeleteIssue: (issue: IIssue) => void;
  gridTemplateColumns: string;
  isCompleted?: boolean;
  user: ICurrentUserResponse | undefined;
  userAuth: UserAuth;
  nestingLevel?: number;
};

export const SpreadsheetIssues: React.FC<Props> = ({
  key,
  issue,
  expandedIssues,
  setExpandedIssues,
  gridTemplateColumns,
  properties,
  handleEditIssue,
  handleDeleteIssue,
  isCompleted = false,
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
        expanded={isExpanded}
        handleToggleExpand={handleToggleExpand}
        gridTemplateColumns={gridTemplateColumns}
        properties={properties}
        handleEditIssue={handleEditIssue}
        handleDeleteIssue={handleDeleteIssue}
        isCompleted={isCompleted}
        user={user}
        userAuth={userAuth}
        nestingLevel={nestingLevel}
      />

      {isExpanded &&
        !isLoading &&
        subIssues &&
        subIssues.length > 0 &&
        subIssues.map((subIssue: IIssue, subIndex: number) => (
          <SpreadsheetIssues
            key={subIssue.id}
            issue={subIssue}
            expandedIssues={expandedIssues}
            setExpandedIssues={setExpandedIssues}
            gridTemplateColumns={gridTemplateColumns}
            properties={properties}
            handleEditIssue={handleEditIssue}
            handleDeleteIssue={handleDeleteIssue}
            isCompleted={isCompleted}
            user={user}
            userAuth={userAuth}
            nestingLevel={nestingLevel + 1}
          />
        ))}
    </div>
  );
};
