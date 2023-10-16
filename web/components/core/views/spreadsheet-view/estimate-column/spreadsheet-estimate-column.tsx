import React from "react";

// components
import { EstimateColumn } from "components/core";
// hooks
import useSubIssue from "hooks/use-sub-issue";
// types
import { IIssue, Properties } from "types";

type Props = {
  issue: IIssue;
  onChange: (formData: Partial<IIssue>) => void;
  expandedIssues: string[];
  properties: Properties;
  disabled: boolean;
};

export const SpreadsheetEstimateColumn: React.FC<Props> = (props) => {
  const { issue, onChange, expandedIssues, properties, disabled } = props;

  const isExpanded = expandedIssues.indexOf(issue.id) > -1;

  const { subIssues, isLoading } = useSubIssue(issue.project_detail.id, issue.id, isExpanded);

  return (
    <div>
      <EstimateColumn
        issue={issue}
        properties={properties}
        onChange={(data) => onChange({ estimate_point: data })}
        disabled={disabled}
      />

      {isExpanded &&
        !isLoading &&
        subIssues &&
        subIssues.length > 0 &&
        subIssues.map((subIssue: IIssue) => (
          <SpreadsheetEstimateColumn
            key={subIssue.id}
            issue={subIssue}
            onChange={onChange}
            expandedIssues={expandedIssues}
            properties={properties}
            disabled={disabled}
          />
        ))}
    </div>
  );
};
