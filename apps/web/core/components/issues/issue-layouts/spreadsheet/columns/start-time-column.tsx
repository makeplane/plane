import React from "react";
import { observer } from "mobx-react";
import { Clock } from "lucide-react";
// types
import type { TSpreadsheetColumn } from "@plane/types";
// components
import { TimeDropdown } from "@/components/dropdowns/time-picker";

type Props = Parameters<TSpreadsheetColumn>[0];

export const SpreadsheetStartTimeColumn: React.FC<Props> = observer((props: Props) => {
  const { issue, onChange, disabled } = props;

  return (
    <div className="h-11 border-b-[0.5px] border-custom-border-200">
      <TimeDropdown
        value={issue.start_time}
        onChange={(startTime) => {
          onChange(
            issue,
            { start_time: startTime },
            {
              changed_property: "start_time",
              change_details: startTime,
            }
          );
        }}
        disabled={disabled}
        placeholder="Start time"
        icon={<Clock className="h-3 w-3 flex-shrink-0" />}
        buttonVariant="transparent-with-text"
        buttonClassName="text-left rounded-none group-[.selected-issue-row]:bg-custom-primary-100/5 group-[.selected-issue-row]:hover:bg-custom-primary-100/10 px-page-x"
        buttonContainerClassName="w-full"
        optionsClassName="z-[9]"
      />
    </div>
  );
});
