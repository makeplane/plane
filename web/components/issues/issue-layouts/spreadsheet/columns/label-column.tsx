import React from "react";

// components
import { LabelSelect } from "components/project";
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
    <>
      <LabelSelect
        value={issue.labels}
        onChange={(data) => onChange({ labels: data })}
        labels={labels ?? []}
        className="h-full"
        buttonClassName="!border-0 !h-full !w-full !rounded-none"
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
