import React from "react";

// components
import { IssuePropertyAssignee } from "../../properties";
// hooks
import useSubIssue from "hooks/use-sub-issue";
// types
import { IIssue, IUserLite } from "types";

type Props = {
  issue: IIssue;
  members: IUserLite[] | undefined;
  onChange: (data: Partial<IIssue>) => void;
  expandedIssues: string[];
  disabled: boolean;
};

export const SpreadsheetAssigneeColumn: React.FC<Props> = ({ issue, members, onChange, expandedIssues, disabled }) => {
  const isExpanded = expandedIssues.indexOf(issue.id) > -1;

  const { subIssues, isLoading } = useSubIssue(issue.project_detail.id, issue.id, isExpanded);

  return (
    <>
      <IssuePropertyAssignee
        projectId={issue.project_detail.id ?? null}
        value={issue.assignees}
        onChange={(data) => onChange({ assignees: data })}
        buttonClassName="!p-0 !rounded-none !border-0"
        hideDropdownArrow
        disabled={disabled}
        multiple
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
            members={members}
            disabled={disabled}
          />
        ))}
    </>
  );
};
