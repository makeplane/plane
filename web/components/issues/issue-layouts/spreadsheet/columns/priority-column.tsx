import React from "react";
import { observer } from "mobx-react-lite";
// types
import { TIssue } from "@plane/types";
// components
import { PriorityDropdown } from "@/components/dropdowns";
// helpers
import { cn } from "@/helpers/common.helper";

type Props = {
  issue: TIssue;
  onClose: () => void;
  onChange: (issue: TIssue, data: Partial<TIssue>, updates: any) => void;
  disabled: boolean;
  isIssueSelected: boolean;
};

export const SpreadsheetPriorityColumn: React.FC<Props> = observer((props: Props) => {
  const { issue, onChange, disabled, onClose, isIssueSelected } = props;

  return (
    <div className="h-11 border-b-[0.5px] border-custom-border-200">
      <PriorityDropdown
        value={issue.priority}
        onChange={(data) => onChange(issue, { priority: data }, { changed_property: "priority", change_details: data })}
        disabled={disabled}
        buttonVariant="transparent-with-text"
        buttonClassName={cn("text-left rounded-none", {
          "bg-custom-primary-100/5 hover:bg-custom-primary-100/10": isIssueSelected,
        })}
        buttonContainerClassName="w-full"
        onClose={onClose}
      />
    </div>
  );
});
