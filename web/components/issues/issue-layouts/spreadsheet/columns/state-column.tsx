import React from "react";

// components
import { StateSelect } from "components/states";
// hooks
import useSubIssue from "hooks/use-sub-issue";
// helpers
import { getStatesList } from "helpers/state.helper";
// types
import { IIssue, IStateResponse } from "types";

type Props = {
  issue: IIssue;
  onChange: (data: Partial<IIssue>) => void;
  states: IStateResponse | undefined;
  expandedIssues: string[];
  disabled: boolean;
};

export const SpreadsheetStateColumn: React.FC<Props> = (props) => {
  const { issue, onChange, states, expandedIssues, disabled } = props;

  const isExpanded = expandedIssues.indexOf(issue.id) > -1;

  const { subIssues, isLoading } = useSubIssue(issue.project_detail.id, issue.id, isExpanded);

  const statesList = getStatesList(states);

  return (
    <>
      <StateSelect
        value={issue.state_detail}
        onChange={(data) => onChange({ state: data.id, state_detail: data })}
        states={statesList}
        buttonClassName="!shadow-none !border-0"
        hideDropdownArrow
        disabled={disabled}
      />

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
