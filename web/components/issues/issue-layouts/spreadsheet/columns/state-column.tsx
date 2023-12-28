import React from "react";
// hooks
import useSubIssue from "hooks/use-sub-issue";
// components
import { StateDropdown } from "components/dropdowns";
// types
import { TIssue, IState } from "types";

type Props = {
  issue: TIssue;
  onChange: (issue: TIssue, data: Partial<TIssue>) => void;
  states: IState[] | undefined;
  expandedIssues: string[];
  disabled: boolean;
};

export const SpreadsheetStateColumn: React.FC<Props> = (props) => {
  const { issue, onChange, states, expandedIssues, disabled } = props;

  const isExpanded = expandedIssues.indexOf(issue.id) > -1;

  const { subIssues, isLoading, mutateSubIssues } = useSubIssue(issue.project_id, issue.id, isExpanded);

  return (
    <>
      <div className="h-11 border-b-[0.5px] border-custom-border-200">
        <StateDropdown
          projectId={issue.project_id}
          value={issue.state_id}
          onChange={(data) => {
            onChange(issue, { state_id: data });
            if (issue.parent_id) mutateSubIssues(issue, { state_id: data });
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
