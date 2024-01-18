import React from "react";
import { observer } from "mobx-react-lite";
// components
import { PriorityDropdown } from "components/dropdowns";
// types
import { TIssue } from "@plane/types";

type Props = {
  issue: TIssue;
  onChange: (issue: TIssue, data: Partial<TIssue>) => void;
  disabled: boolean;
};

export const SpreadsheetPriorityColumn: React.FC<Props> = observer((props: Props) => {
  const { issue, onChange, disabled } = props;

  return (
    <div className="h-11 border-b-[0.5px] border-custom-border-200">
      <PriorityDropdown
        value={issue.priority}
        onChange={(data) => onChange(issue, { priority: data })}
        disabled={disabled}
        buttonVariant="transparent-with-text"
        buttonClassName="rounded-none text-left"
        buttonContainerClassName="w-full"
      />
    </div>
  );
});
