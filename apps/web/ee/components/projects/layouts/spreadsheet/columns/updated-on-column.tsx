import React from "react";
import { observer } from "mobx-react";
// plane imports
import { getDate, renderFormattedPayloadDate } from "@plane/utils";
// components
import { DateRangeDropdown } from "@/components/dropdowns/date-range";
import { TProject } from "@/plane-web/types/projects";

type Props = {
  project: TProject;
  disabled: boolean;
  onChange: (project: TProject, data: Partial<TProject>) => void;
};

export const SpreadsheetUpdatedOnColumn: React.FC<Props> = observer((props: Props) => {
  const { project, onChange, disabled } = props;

  return (
    <div className="flex h-11 w-full items-center justify-start border-b-[0.5px] border-custom-border-200 text-xs hover:bg-custom-background-80 group-[.selected-issue-row]:bg-custom-primary-100/5 group-[.selected-issue-row]:hover:bg-custom-primary-100/10">
      <DateRangeDropdown
        buttonVariant="transparent-with-text"
        className="h-7"
        buttonClassName="px-4 text-left rounded-none group-[.selected-issue-row]:bg-custom-primary-100/5 group-[.selected-issue-row]:hover:bg-custom-primary-100/10"
        minDate={new Date()}
        value={{
          from: getDate(project.start_date),
          to: getDate(project.target_date),
        }}
        onSelect={(val) => {
          console.log({ val });
          onChange(project, {
            start_date: val?.from ? renderFormattedPayloadDate(val.from)! : undefined,
            target_date: val?.to ? renderFormattedPayloadDate(val.to)! : undefined,
          });
        }}
        placeholder={{
          from: "Start date",
          to: "End date",
        }}
        hideIcon={{
          to: true,
        }}
        tabIndex={3}
        disabled={disabled}
      />
    </div>
  );
});
