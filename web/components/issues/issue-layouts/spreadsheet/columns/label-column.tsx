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

  const { subIssues, isLoading } = useSubIssue(issue.project_detail?.id, issue.id, isExpanded);

  return (
    <>
      <IssuePropertyLabels
        projectId={issue.project_detail?.id ?? null}
        value={issue.labels}
        defaultOptions={issue?.label_details ? issue.label_details : []}
        onChange={(data) => onChange({ labels: data })}
        className="h-11 w-full border-b-[0.5px] border-custom-border-200"
        buttonClassName="px-2.5 h-full"
        hideDropdownArrow
        maxRender={1}
        disabled={disabled}
        placeholderText="Select labels"
      />

      {isExpanded &&
        !isLoading &&
        subIssues &&
        subIssues.length > 0 &&
        subIssues.map((subIssue: IIssue) => (
          <div className={`h-11`}>
            <SpreadsheetLabelColumn
              key={subIssue.id}
              issue={subIssue}
              onChange={onChange}
              labels={labels}
              expandedIssues={expandedIssues}
              disabled={disabled}
            />
          </div>
        ))}
    </>
  );
};
