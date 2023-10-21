import React from "react";

// components
import { StartDateColumn } from "components/core";
// hooks
import useSubIssue from "hooks/use-sub-issue";
// types
import { IUser, IIssue, Properties } from "types";

type Props = {
  issue: IIssue;
  projectId: string;
  partialUpdateIssue: (formData: Partial<IIssue>, issue: IIssue) => void;
  expandedIssues: string[];
  properties: Properties;
  user: IUser | undefined;
  isNotAllowed: boolean;
};

export const SpreadsheetStartDateColumn: React.FC<Props> = ({
  issue,
  projectId,
  partialUpdateIssue,
  expandedIssues,
  properties,
  user,
  isNotAllowed,
}) => {
  const isExpanded = expandedIssues.indexOf(issue.id) > -1;

  const { subIssues, isLoading } = useSubIssue(issue.project_detail.id, issue.id, isExpanded);

  return (
    <div>
      <StartDateColumn
        issue={issue}
        projectId={projectId}
        properties={properties}
        partialUpdateIssue={partialUpdateIssue}
        user={user}
        isNotAllowed={isNotAllowed}
      />

      {isExpanded &&
        !isLoading &&
        subIssues &&
        subIssues.length > 0 &&
        subIssues.map((subIssue: IIssue) => (
          <SpreadsheetStartDateColumn
            key={subIssue.id}
            issue={subIssue}
            projectId={subIssue.project_detail.id}
            partialUpdateIssue={partialUpdateIssue}
            expandedIssues={expandedIssues}
            properties={properties}
            user={user}
            isNotAllowed={isNotAllowed}
          />
        ))}
    </div>
  );
};
