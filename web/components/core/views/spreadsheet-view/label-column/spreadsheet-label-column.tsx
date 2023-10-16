import React from "react";

// components
import { LabelColumn } from "components/core";
// hooks
import useSubIssue from "hooks/use-sub-issue";
// types
import { IIssue, Properties, IIssueLabels } from "types";

type Props = {
  issue: IIssue;
  onChange: (formData: Partial<IIssue>) => void;
  labels: IIssueLabels[] | undefined;
  expandedIssues: string[];
  properties: Properties;
  disabled: boolean;
};

export const SpreadsheetLabelColumn: React.FC<Props> = (props) => {
  const { issue, onChange, labels, expandedIssues, properties, disabled } = props;

  const isExpanded = expandedIssues.indexOf(issue.id) > -1;

  const { subIssues, isLoading } = useSubIssue(issue.project_detail.id, issue.id, isExpanded);

  return (
    <div>
      <LabelColumn
        issue={issue}
        onChange={(data) => onChange({ labels_list: data })}
        labels={labels}
        properties={properties}
        disabled={disabled}
      />

      {isExpanded &&
        !isLoading &&
        subIssues &&
        subIssues.length > 0 &&
        subIssues.map((subIssue: IIssue) => (
          <SpreadsheetLabelColumn
            key={subIssue.id}
            issue={subIssue}
            onChange={onChange}
            labels={labels}
            expandedIssues={expandedIssues}
            properties={properties}
            disabled={disabled}
          />
        ))}
    </div>
  );
};
