import React from "react";
import { observer } from "mobx-react";
import { DueDatePropertyIcon } from "@plane/propel/icons";
// types
import type { TIssue } from "@plane/types";
import { cn, getDate, renderFormattedPayloadDate, shouldHighlightIssueDueDate } from "@plane/utils";
// components
import { DateDropdown } from "@/components/dropdowns/date";
// helpers
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";

type Props = {
  issue: TIssue;
  onClose: () => void;
  onChange: (issue: TIssue, data: Partial<TIssue>, updates: any) => void;
  disabled: boolean;
};

export const SpreadsheetDueDateColumn = observer(function SpreadsheetDueDateColumn(props: Props) {
  const { issue, onChange, disabled, onClose } = props;
  // store hooks
  const { getStateById } = useProjectState();
  // derived values
  const stateDetails = getStateById(issue.state_id);

  return (
    <div className="h-11 border-b-[0.5px] border-subtle">
      <DateDropdown
        value={issue.target_date}
        minDate={getDate(issue.start_date)}
        onChange={(data) => {
          const targetDate = data ? renderFormattedPayloadDate(data) : null;
          onChange(
            issue,
            { target_date: targetDate },
            {
              changed_property: "target_date",
              change_details: targetDate,
            }
          );
        }}
        disabled={disabled}
        placeholder="Due date"
        icon={<DueDatePropertyIcon className="h-3 w-3 flex-shrink-0" />}
        buttonVariant="transparent-with-text"
        buttonContainerClassName="w-full"
        buttonClassName={cn(
          "rounded-none text-left group-[.selected-issue-row]:bg-accent-primary/5 group-[.selected-issue-row]:hover:bg-accent-primary/10 px-page-x",
          {
            "text-danger-primary": shouldHighlightIssueDueDate(issue.target_date, stateDetails?.group),
          }
        )}
        optionsClassName="z-[9]"
        clearIconClassName="!text-primary"
        onClose={onClose}
      />
    </div>
  );
});
