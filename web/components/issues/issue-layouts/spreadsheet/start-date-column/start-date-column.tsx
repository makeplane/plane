import React from "react";
// components
import { ViewStartDateSelect } from "components/issues";
// types
import { IIssue } from "types";

type Props = {
  issue: IIssue;
  onChange: (data: string | null) => void;
  disabled: boolean;
};

export const StartDateColumn: React.FC<Props> = (props) => {
  const { issue, onChange, disabled } = props;
  return (
    <div className="flex items-center text-sm h-11 w-full bg-custom-background-100">
      <span className="flex items-center px-4 py-2.5 h-full w-full flex-shrink-0 border-r border-b border-custom-border-100">
        <ViewStartDateSelect issue={issue} onChange={onChange} noBorder disabled={disabled} />
      </span>
    </div>
  );
};
