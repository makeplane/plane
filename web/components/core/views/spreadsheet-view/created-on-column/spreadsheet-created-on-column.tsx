import React from "react";

// components
import { CreatedOnColumn } from "components/core";
// hooks
import useSubIssue from "hooks/use-sub-issue";
// types
import { IUser, IIssue, Properties } from "types";

type Props = {
  issue: IIssue;
  handleUpdateIssue: (formData: Partial<IIssue>) => void;
  expandedIssues: string[];
  properties: Properties;
  user: IUser | undefined;
  isNotAllowed: boolean;
};

export const SpreadsheetCreatedOnColumn: React.FC<Props> = ({
  issue,
  handleUpdateIssue,
  expandedIssues,
  properties,
  user,
  isNotAllowed,
}) => {
  const isExpanded = expandedIssues.indexOf(issue.id) > -1;

  const { subIssues, isLoading } = useSubIssue(issue.project_detail.id, issue.id, isExpanded);

  return (
    <div>
      <CreatedOnColumn issue={issue} properties={properties} />

      {isExpanded &&
        !isLoading &&
        subIssues &&
        subIssues.length > 0 &&
        subIssues.map((subIssue: IIssue) => (
          <SpreadsheetCreatedOnColumn
            key={subIssue.id}
            issue={subIssue}
            handleUpdateIssue={handleUpdateIssue}
            expandedIssues={expandedIssues}
            properties={properties}
            user={user}
            isNotAllowed={isNotAllowed}
          />
        ))}
    </div>
  );
};
