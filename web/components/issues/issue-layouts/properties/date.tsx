import React from "react";
// headless ui
import { Popover } from "@headlessui/react";
// lucide icons
import { Calendar, X } from "lucide-react";
// react date picker
import DatePicker from "react-datepicker";
// mobx
import { observer } from "mobx-react-lite";
// components
import { Tooltip } from "@plane/ui";
// hooks
import useDynamicDropdownPosition from "hooks/use-dynamic-dropdown";
// helpers
import { renderDateFormat } from "helpers/date-time.helper";

export interface IIssuePropertyStartDate {
  value?: any;
  onChange?: (date: any) => void;
  disabled?: boolean;
}

export const IssuePropertyStartDate: React.FC<IIssuePropertyStartDate> = observer(({ value, onChange, disabled }) => {
  const dropdownBtn = React.useRef<any>(null);
  const dropdownOptions = React.useRef<any>(null);

  const [isOpen, setIsOpen] = React.useState<boolean>(false);

  useDynamicDropdownPosition(isOpen, () => setIsOpen(false), dropdownBtn, dropdownOptions);

  return (
    <Popover as="div" className="relative">
      {({ open }) => {
        if (open) {
          if (!isOpen) setIsOpen(true);
        } else if (isOpen) setIsOpen(false);

        return (
          <>
            <Popover.Button
              ref={dropdownBtn}
              className={`flex items-center justify-between gap-1 px-1 py-0.5 rounded-sm shadow-sm border border-custom-border-300 duration-300 outline-none ${
                disabled ? "cursor-not-allowed text-custom-text-200" : "cursor-pointer hover:bg-custom-background-80"
              }`}
            >
              <Tooltip tooltipHeading={`Start Date`} tooltipContent={value}>
                <div className="flex-shrink-0 overflow-hidden rounded-sm flex justify-center items-center">
                  <div className="flex-shrink-0 w-[16px] h-[16px] flex justify-center items-center">
                    <Calendar width={10} strokeWidth={2} />
                  </div>
                  {value ? (
                    <>
                      <div className="px-1 text-xs">{value}</div>
                      <div
                        className="flex-shrink-0 w-[16px] h-[16px] flex justify-center items-center cursor-pointer"
                        onClick={() => {
                          if (onChange) onChange(null);
                        }}
                      >
                        <X width={10} strokeWidth={2} />
                      </div>
                    </>
                  ) : (
                    <div className="text-xs">Select date</div>
                  )}
                </div>
              </Tooltip>
            </Popover.Button>

            <div className={`${open ? "fixed z-20 top-0 left-0 h-full w-full cursor-auto" : ""}`}>
              <Popover.Panel
                ref={dropdownOptions}
                className={`absolute z-10 rounded bg-custom-background-100 text-xs shadow-lg focus:outline-none whitespace-nowrap mt-1`}
              >
                {({ close }) => (
                  <DatePicker
                    selected={value ? new Date(value) : new Date()}
                    onChange={(val: any) => {
                      if (onChange && val) {
                        onChange(renderDateFormat(val));
                        close();
                      }
                    }}
                    dateFormat="dd-MM-yyyy"
                    calendarClassName="h-full"
                    inline
                  />
                )}
              </Popover.Panel>
            </div>
          </>
        );
      }}
    </Popover>
  );
});
