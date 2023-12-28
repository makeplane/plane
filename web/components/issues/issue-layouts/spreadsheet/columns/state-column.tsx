import React from "react";

// components
import { IssuePropertyState } from "../../properties";
// hooks
import useSubIssue from "hooks/use-sub-issue";
// types
import { TIssue, IState } from "types";
import { useProjectState } from "hooks/store";

type Props = {
  issue: TIssue;
  onChange: (issue: TIssue, data: Partial<TIssue>) => void;
  states: IState[] | undefined;
  expandedIssues: string[];
  disabled: boolean;
};

export const SpreadsheetStateColumn: React.FC<Props> = (props) => {
  const { issue, onChange, states, expandedIssues, disabled } = props;
  // hooks
  const { stateMap } = useProjectState();

  const isExpanded = expandedIssues.indexOf(issue.id) > -1;

  const { subIssues, isLoading, mutateSubIssues } = useSubIssue(issue.project_id, issue.id, isExpanded);

  const defaultStateOptions = [stateMap[issue?.state_id]];

  return (
    <>
      <IssuePropertyState
        projectId={issue.project_id ?? null}
        value={issue.state_id}
        defaultOptions={defaultStateOptions}
        onChange={(data) => {
          onChange(issue, { state_id: data.id });
          if (issue.parent_id) {
            mutateSubIssues(issue, { state_id: data.id });
          }
        }}
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
