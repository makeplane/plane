import React from "react";

// components
import { StateColumn } from "components/core";
// hooks
import useSubIssue from "hooks/use-sub-issue";
// types
import { IIssue, Properties } from "types";

type Props = {
  issue: IIssue;
  projectId: string;
  onChange: (data: Partial<IIssue>) => void;
  expandedIssues: string[];
  properties: Properties;
  isNotAllowed: boolean;
};

export const SpreadsheetStateColumn: React.FC<Props> = ({
  issue,
  projectId,
  onChange,
  expandedIssues,
  properties,
  isNotAllowed,
}) => {
  const isExpanded = expandedIssues.indexOf(issue.id) > -1;

  const { subIssues, isLoading } = useSubIssue(issue.project_detail.id, issue.id, isExpanded);

  return (
    <div>
      <StateColumn
        issue={issue}
        projectId={projectId}
        properties={properties}
        onChange={(data) => onChange({ state: data.id, state_detail: data })}
        isNotAllowed={isNotAllowed}
      />

      {isExpanded &&
        !isLoading &&
        subIssues &&
        subIssues.length > 0 &&
        subIssues.map((subIssue) => (
          <SpreadsheetStateColumn
            key={subIssue.id}
            issue={subIssue}
            projectId={subIssue.project_detail.id}
            onChange={onChange}
            expandedIssues={expandedIssues}
            properties={properties}
            isNotAllowed={isNotAllowed}
          />
        ))}
    </div>
  );
};
