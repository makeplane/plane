import React from "react";
// components
import { StateSelect } from "components/states";
// types
import { IIssue, IState, IStateResponse } from "types";

type Props = {
  issue: IIssue;
  onChange: (formData: IState) => void;
  states: IStateResponse | undefined;
  disabled: boolean;
};

export const StateColumn: React.FC<Props> = (props) => {
  const { issue, onChange, states, disabled } = props;

  return (
    <div className="flex items-center text-sm h-11 w-full bg-custom-background-100">
      <span className="flex items-center px-4 py-2.5 h-full w-full flex-shrink-0 border-r border-b border-custom-border-100">
        <StateSelect
          value={issue.state_detail}
          onChange={onChange}
          stateGroups={states}
          buttonClassName="!shadow-none !border-0"
          hideDropdownArrow
          disabled={disabled}
        />
      </span>
    </div>
  );
};
