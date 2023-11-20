import React from "react";

// components
import { IssuePropertyLabels } from "../../properties";
// hooks
import useSubIssue from "hooks/use-sub-issue";
// types
import { IIssue, IIssueLabel } from "types";

type Props = {
  issue: IIssue;
  onChange: (formData: Partial<IIssue>) => void;
  labels: IIssueLabel[] | undefined;
  expandedIssues: string[];
  disabled: boolean;
};

export const SpreadsheetLabelColumn: React.FC<Props> = (props) => {
  const { issue, onChange, labels, expandedIssues, disabled } = props;

  const isExpanded = expandedIssues.indexOf(issue.id) > -1;

  const { subIssues, isLoading } = useSubIssue(issue.project_detail.id, issue.id, isExpanded);

  return (
    <>
      <IssuePropertyLabels
        projectId={issue.project_detail.id ?? null}
        value={issue.labels}
        onChange={(data) => onChange({ labels: data })}
        className="h-full w-full"
        buttonClassName="px-2.5 h-full"
        noLabelBorder
        hideDropdownArrow
        maxRender={1}
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
    </>
  );
};
