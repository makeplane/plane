import React from "react";

// components
import { AssigneeColumn } from "components/core";
// hooks
import useSubIssue from "hooks/use-sub-issue";
// types
import { IIssue, Properties, IUserLite } from "types";

type Props = {
  issue: IIssue;
  members: IUserLite[] | undefined;
  onChange: (data: Partial<IIssue>) => void;
  expandedIssues: string[];
  properties: Properties;
  disabled: boolean;
};

export const SpreadsheetAssigneeColumn: React.FC<Props> = ({
  issue,
  members,
  onChange,
  expandedIssues,
  properties,
  disabled,
}) => {
  const isExpanded = expandedIssues.indexOf(issue.id) > -1;

  const { subIssues, isLoading } = useSubIssue(issue.project_detail.id, issue.id, isExpanded);

  return (
    <div>
      <AssigneeColumn
        issue={issue}
        members={members}
        properties={properties}
        onChange={(data) => onChange({ assignees_list: data })}
        disabled={disabled}
      />

      {isExpanded &&
        !isLoading &&
        subIssues &&
        subIssues.length > 0 &&
        subIssues.map((subIssue) => (
          <SpreadsheetAssigneeColumn
            key={subIssue.id}
            issue={subIssue}
            onChange={onChange}
            expandedIssues={expandedIssues}
            properties={properties}
            members={members}
            disabled={disabled}
          />
        ))}
    </div>
  );
};
