import React from "react";
import { observer } from "mobx-react-lite";
import differenceInCalendarDays from "date-fns/differenceInCalendarDays";
// components
import { DateDropdown } from "components/dropdowns";
// helpers
import { renderFormattedPayloadDate } from "helpers/date-time.helper";
// types
import { TIssue } from "@plane/types";
import { cn } from "helpers/common.helper";

type Props = {
  issue: TIssue;
  onClose: () => void;
  onChange: (issue: TIssue, data: Partial<TIssue>, updates: any) => void;
  disabled: boolean;
};

export const SpreadsheetDueDateColumn: React.FC<Props> = observer((props: Props) => {
  const { issue, onChange, disabled, onClose } = props;

  const targetDateDistance = issue.target_date ? differenceInCalendarDays(new Date(issue.target_date), new Date()) : 1;

  return (
    <div className="h-11 border-b-[0.5px] border-custom-border-200">
      <DateDropdown
        value={issue.target_date}
        minDate={issue.start_date ? new Date(issue.start_date) : undefined}
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
        buttonVariant="transparent-with-text"
        buttonContainerClassName="w-full"
        buttonClassName={cn("rounded-none text-left", {
          "text-red-500": targetDateDistance <= 0,
        })}
        clearIconClassName="!text-custom-text-100"
        onClose={onClose}
      />
    </div>
  );
});
