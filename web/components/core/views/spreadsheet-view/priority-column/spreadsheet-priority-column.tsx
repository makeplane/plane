import React from "react";

// components
import { PriorityColumn } from "components/core";
// hooks
import useSubIssue from "hooks/use-sub-issue";
// types
import { IUser, IIssue, Properties } from "types";

type Props = {
  issue: IIssue;
  onChange: (data: Partial<IIssue>) => void;
  expandedIssues: string[];
  properties: Properties;
  user: IUser | undefined;
  disabled: boolean;
};

export const SpreadsheetPriorityColumn: React.FC<Props> = ({
  issue,
  onChange,
  expandedIssues,
  properties,
  user,
  disabled,
}) => {
  const isExpanded = expandedIssues.indexOf(issue.id) > -1;

  const { subIssues, isLoading } = useSubIssue(issue.project_detail.id, issue.id, isExpanded);

  return (
    <div>
      <PriorityColumn
        issue={issue}
        properties={properties}
        onChange={(data) => onChange({ priority: data })}
        disabled={disabled}
      />

      {isExpanded &&
        !isLoading &&
        subIssues &&
        subIssues.length > 0 &&
        subIssues.map((subIssue: IIssue) => (
          <SpreadsheetPriorityColumn
            key={subIssue.id}
            issue={subIssue}
            onChange={onChange}
            expandedIssues={expandedIssues}
            properties={properties}
            user={user}
            disabled={disabled}
          />
        ))}
    </div>
  );
};
