import React from "react";
import { observer } from "mobx-react";
import { CalendarClock } from "lucide-react";
// types
import { TIssue } from "@plane/types";
// components
import { DateDropdown } from "@/components/dropdowns";
// helpers
import { cn } from "@/helpers/common.helper";
import { getDate, renderFormattedPayloadDate } from "@/helpers/date-time.helper";

type Props = {
  issue: TIssue;
  onClose: () => void;
  onChange: (issue: TIssue, data: Partial<TIssue>, updates: any) => void;
  disabled: boolean;
  isIssueSelected: boolean;
};

export const SpreadsheetStartDateColumn: React.FC<Props> = observer((props: Props) => {
  const { issue, onChange, disabled, onClose, isIssueSelected } = props;

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
        buttonClassName={cn("text-left rounded-none", {
          "bg-custom-primary-100/5 hover:bg-custom-primary-100/10": isIssueSelected,
        })}
        buttonContainerClassName="w-full"
        onClose={onClose}
      />
    </div>
  );
});
