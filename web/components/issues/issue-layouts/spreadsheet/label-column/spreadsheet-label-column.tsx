import React from "react";

// components
import { LabelColumn } from "components/issues";
// hooks
import useSubIssue from "hooks/use-sub-issue";
// types
import { IIssue, IIssueLabels } from "types";

type Props = {
  issue: IIssue;
  onChange: (formData: Partial<IIssue>) => void;
  labels: IIssueLabels[] | undefined;
  expandedIssues: string[];
  disabled: boolean;
};

export const SpreadsheetLabelColumn: React.FC<Props> = (props) => {
  const { issue, onChange, labels, expandedIssues, disabled } = props;

  const isExpanded = expandedIssues.indexOf(issue.id) > -1;

  const { subIssues, isLoading } = useSubIssue(issue.project_detail.id, issue.id, isExpanded);

  return (
    <div>
      <LabelColumn
        issue={issue}
        onChange={(data) => onChange({ labels_list: data })}
        labels={labels}
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
            disabled={disabled}
          />
        ))}
    </div>
  );
};
