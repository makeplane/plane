import React from "react";
import { observer } from "mobx-react";
import { StartDatePropertyIcon } from "@plane/propel/icons";
// types
import type { TIssue } from "@plane/types";
// components
import { getDate, renderFormattedPayloadDate } from "@plane/utils";
import { DateDropdown } from "@/components/dropdowns/date";
// helpers

type Props = {
  issue: TIssue;
  onClose: () => void;
  onChange: (issue: TIssue, data: Partial<TIssue>, updates: any) => void;
  disabled: boolean;
};

export const SpreadsheetStartDateColumn = observer(function SpreadsheetStartDateColumn(props: Props) {
  const { issue, onChange, disabled, onClose } = props;

  return (
    <div className="h-11 border-b-[0.5px] border-subtle">
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
        icon={<StartDatePropertyIcon className="h-3 w-3 flex-shrink-0" />}
        buttonVariant="transparent-with-text"
        buttonClassName="text-left rounded-none group-[.selected-issue-row]:bg-accent-primary/5 group-[.selected-issue-row]:hover:bg-accent-primary/10 px-page-x"
        buttonContainerClassName="w-full"
        optionsClassName="z-[9]"
        onClose={onClose}
      />
    </div>
  );
});
