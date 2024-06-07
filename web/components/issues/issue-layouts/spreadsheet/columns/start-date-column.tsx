import React from "react";
import { observer } from "mobx-react";
import { CalendarClock } from "lucide-react";
// types
import { TIssue } from "@plane/types";
// components
import { DateDropdown } from "@/components/dropdowns";
// helpers
import { getDate, renderFormattedPayloadDate } from "@/helpers/date-time.helper";

type Props = {
  issue: TIssue;
  onClose: () => void;
  onChange: (issue: TIssue, data: Partial<TIssue>, updates: any) => void;
  disabled: boolean;
};

export const SpreadsheetStartDateColumn: React.FC<Props> = observer((props: Props) => {
  const { issue, onChange, disabled, onClose } = props;

  return (
    <div className="h-11 border-b-[0.5px] border-custom-border-200">
      <DateDropdown
        value={issue.start_date}
        maxDate={getDate(issue.target_date)}
        onChange={(data) => {
          const startDate = data ? renderFormattedPayloadDate(data) : null;
          onChange(
            issue,
            { start_date: startDate },
            {
              changed_property: "start_date",
              change_details: startDate,
            }
          );
        }}
        disabled={disabled}
        placeholder="Start date"
        icon={<CalendarClock className="h-3 w-3 flex-shrink-0" />}
        buttonVariant="transparent-with-text"
        buttonClassName="text-left rounded-none group-[.selected-issue-row]:bg-custom-primary-100/5 group-[.selected-issue-row]:hover:bg-custom-primary-100/10"
        buttonContainerClassName="w-full"
        onClose={onClose}
      />
    </div>
  );
});
