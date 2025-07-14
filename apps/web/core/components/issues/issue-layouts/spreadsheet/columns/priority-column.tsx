import React from "react";
import { observer } from "mobx-react";
// types
import { TIssue } from "@plane/types";
// components
import { PriorityDropdown } from "@/components/dropdowns";

type Props = {
  issue: TIssue;
  onClose: () => void;
  onChange: (issue: TIssue, data: Partial<TIssue>, updates: any) => void;
  disabled: boolean;
};

export const SpreadsheetPriorityColumn: React.FC<Props> = observer((props: Props) => {
  const { issue, onChange, disabled, onClose } = props;

  return (
    <div className="h-11 border-b-[0.5px] border-custom-border-200">
      <PriorityDropdown
        value={issue.priority}
        onChange={(data) => onChange(issue, { priority: data }, { changed_property: "priority", change_details: data })}
        disabled={disabled}
        buttonVariant="transparent-with-text"
        buttonClassName="text-left rounded-none group-[.selected-issue-row]:bg-custom-primary-100/5 group-[.selected-issue-row]:hover:bg-custom-primary-100/10 px-page-x"
        buttonContainerClassName="w-full"
        onClose={onClose}
      />
    </div>
  );
});
