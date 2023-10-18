import React from "react";

// components
import { LabelSelect } from "components/project";
// types
import { IIssue, IIssueLabels } from "types";

type Props = {
  issue: IIssue;
  onChange: (data: string[]) => void;
  labels: IIssueLabels[] | undefined;
  disabled: boolean;
};

export const LabelColumn: React.FC<Props> = (props) => {
  const { issue, onChange, labels, disabled } = props;

  return (
    <div className="flex items-center text-sm h-11 w-full bg-custom-background-100">
      <span className="flex items-center px-4 py-2.5 h-full w-full flex-shrink-0 border-r border-b border-custom-border-100">
        <LabelSelect
          value={issue.labels}
          onChange={onChange}
          labels={labels ?? []}
          hideDropdownArrow
          maxRender={1}
          disabled={disabled}
        />
      </span>
    </div>
  );
};
