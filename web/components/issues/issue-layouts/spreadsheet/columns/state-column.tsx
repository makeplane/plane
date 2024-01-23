import React from "react";
import { observer } from "mobx-react-lite";
// components
import { StateDropdown } from "components/dropdowns";
// types
import { TIssue } from "@plane/types";

type Props = {
  issue: TIssue;
  onChange: (issue: TIssue, data: Partial<TIssue>) => void;
  disabled: boolean;
};

export const SpreadsheetStateColumn: React.FC<Props> = observer((props) => {
  const { issue, onChange, disabled } = props;

  return (
    <div className="h-11 border-b-[0.5px] border-custom-border-200">
      <StateDropdown
        projectId={issue.project_id}
        value={issue.state_id}
        onChange={(data) => onChange(issue, { state_id: data })}
        disabled={disabled}
        buttonVariant="transparent-with-text"
        buttonClassName="rounded-none text-left"
        buttonContainerClassName="w-full"
      />
    </div>
  );
});
