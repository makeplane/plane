import React from "react";
// components
import { StateSelect } from "components/states";
// types
import { IIssue, IState, Properties } from "types";

type Props = {
  issue: IIssue;
  projectId: string;
  onChange: (formData: IState) => void;
  properties: Properties;
  isNotAllowed: boolean;
};

export const StateColumn: React.FC<Props> = (props) => {
  const { issue, projectId, onChange, properties, isNotAllowed } = props;

  return (
    <div className="flex items-center text-sm h-11 w-full bg-custom-background-100">
      <span className="flex items-center px-4 py-2.5 h-full w-full flex-shrink-0 border-r border-b border-custom-border-100">
        {properties.state && (
          <StateSelect
            value={issue.state_detail}
            projectId={projectId}
            onChange={onChange}
            buttonClassName="!shadow-none !border-0"
            hideDropdownArrow
            disabled={isNotAllowed}
          />
        )}
      </span>
    </div>
  );
};
