import React from "react";
// hooks
import useSubIssue from "hooks/use-sub-issue";
// components
import { StateDropdown } from "components/dropdowns";
// types
import { IIssue, IState } from "types";

type Props = {
  issue: IIssue;
  onChange: (issue: IIssue, data: Partial<IIssue>) => void;
  states: IState[] | undefined;
  expandedIssues: string[];
  disabled: boolean;
};

export const SpreadsheetStateColumn: React.FC<Props> = (props) => {
  const { issue, onChange, states, expandedIssues, disabled } = props;

  const isExpanded = expandedIssues.indexOf(issue.id) > -1;

  const { subIssues, isLoading, mutateSubIssues } = useSubIssue(issue.project_detail?.id, issue.id, isExpanded);

  return (
    <>
      <div className="h-11 border-b-[0.5px] border-custom-border-200">
        <StateDropdown
          projectId={issue.project}
          value={issue.state}
          onChange={(data) => {
            onChange(issue, { state: data });
            if (issue.parent) mutateSubIssues(issue, { state: data });
          }}
          disabled={disabled}
          buttonVariant="transparent-with-text"
          buttonClassName="rounded-none"
        />
      </div>

      {isExpanded &&
        !isLoading &&
        subIssues &&
        subIssues.length > 0 &&
        subIssues.map((subIssue) => (
          <SpreadsheetStateColumn
            key={subIssue.id}
            issue={subIssue}
            onChange={onChange}
            states={states}
            expandedIssues={expandedIssues}
            disabled={disabled}
          />
        ))}
    </>
  );
};
