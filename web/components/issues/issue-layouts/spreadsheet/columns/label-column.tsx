import React from "react";

// components
import { IssuePropertyLabels } from "../../properties";
// hooks
import useSubIssue from "hooks/use-sub-issue";
// types
import { TIssue, IIssueLabel } from "types";
import { useLabel } from "hooks/store";

type Props = {
  issue: TIssue;
  onChange: (issue: TIssue, formData: Partial<TIssue>) => void;
  labels: IIssueLabel[] | undefined;
  expandedIssues: string[];
  disabled: boolean;
};

export const SpreadsheetLabelColumn: React.FC<Props> = (props) => {
  const { issue, onChange, labels, expandedIssues, disabled } = props;
  // hooks
  const { labelMap } = useLabel();

  const isExpanded = expandedIssues.indexOf(issue.id) > -1;

  const { subIssues, isLoading, mutateSubIssues } = useSubIssue(issue.project_id, issue.id, isExpanded);

  const defaultLabelOptions = issue?.label_ids?.map((id) => labelMap[id]) || [];

  return (
    <>
      <IssuePropertyLabels
        projectId={issue.project_id ?? null}
        value={issue.label_ids}
        defaultOptions={defaultLabelOptions}
        onChange={(data) => {
          onChange(issue, { label_ids: data });
          if (issue.parent_id) {
            mutateSubIssues(issue, { assignee_ids: data });
          }
        }}
        className="h-11 w-full border-b-[0.5px] border-custom-border-200 hover:bg-custom-background-80"
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
        subIssues.map((subIssue: TIssue) => (
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
