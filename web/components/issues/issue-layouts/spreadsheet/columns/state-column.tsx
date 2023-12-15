import React from "react";

// components
import { IssuePropertyState } from "../../properties";
// hooks
import useSubIssue from "hooks/use-sub-issue";
// types
import { IIssue, IState } from "types";

type Props = {
  issue: IIssue;
  onChange: (data: Partial<IIssue>) => void;
  states: IState[] | undefined;
  expandedIssues: string[];
  disabled: boolean;
};

export const SpreadsheetStateColumn: React.FC<Props> = (props) => {
  const { issue, onChange, states, expandedIssues, disabled } = props;

  const isExpanded = expandedIssues.indexOf(issue.id) > -1;

  const { subIssues, isLoading } = useSubIssue(issue.project_detail?.id, issue.id, isExpanded);

  return (
    <>
      <IssuePropertyState
        projectId={issue.project_detail?.id ?? null}
        value={issue.state}
        defaultOptions={issue?.state_detail ? [issue.state_detail] : []}
        onChange={(data) => onChange({ state: data.id, state_detail: data })}
        className="w-full !h-11 border-b-[0.5px] border-custom-border-200"
        buttonClassName="!shadow-none !border-0 h-full w-full"
        hideDropdownArrow
        disabled={disabled}
      />

      {isExpanded &&
        !isLoading &&
        subIssues &&
        subIssues.length > 0 &&
        subIssues.map((subIssue) => (
          <div className="h-11">
            <SpreadsheetStateColumn
              key={subIssue.id}
              issue={subIssue}
              onChange={onChange}
              states={states}
              expandedIssues={expandedIssues}
              disabled={disabled}
            />
          </div>
        ))}
    </>
  );
};
