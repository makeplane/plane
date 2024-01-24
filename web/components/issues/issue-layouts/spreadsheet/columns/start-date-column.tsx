import React from "react";
import { observer } from "mobx-react-lite";
// components
import { DateDropdown } from "components/dropdowns";
// helpers
import { renderFormattedPayloadDate } from "helpers/date-time.helper";
// types
import { TIssue } from "@plane/types";

type Props = {
  issue: TIssue;
  onChange: (issue: TIssue, data: Partial<TIssue>) => void;
  disabled: boolean;
};

export const SpreadsheetStartDateColumn: React.FC<Props> = observer((props: Props) => {
  const { issue, onChange, disabled } = props;

  return (
    <div className="h-11 border-b-[0.5px] border-custom-border-200">
      <DateDropdown
        value={issue.start_date}
        onChange={(data) => onChange(issue, { start_date: data ? renderFormattedPayloadDate(data) : null })}
        disabled={disabled}
        placeholder="Start date"
        buttonVariant="transparent-with-text"
        buttonClassName="rounded-none text-left"
        buttonContainerClassName="w-full"
      />
    </div>
  );
});
