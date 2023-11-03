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

export interface IIssuePropertyDate {
  value: any;
  onChange: (date: any) => void;
  disabled?: boolean;
  placeHolder?: string;
}

export const IssuePropertyDate: React.FC<IIssuePropertyDate> = observer((props) => {
  const { value, onChange, disabled, placeHolder } = props;

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
              className={`px-2.5 py-1 h-5 flex items-center rounded border-[0.5px] border-custom-border-300 duration-300 outline-none w-full ${
                disabled ? "cursor-not-allowed text-custom-text-200" : "cursor-pointer hover:bg-custom-background-80"
              }`}
            >
              <Tooltip tooltipHeading={placeHolder} tooltipContent={value ?? "None"}>
                <div className="overflow-hidden flex justify-center items-center gap-2">
                  <Calendar className="h-3 w-3" strokeWidth={2} />
                  {value && (
                    <>
                      <div className="text-xs">{value}</div>
                      <div
                        className="flex-shrink-0 flex justify-center items-center"
                        onClick={() => {
                          if (onChange) onChange(null);
                        }}
                      >
                        <X className="h-2.5 w-2.5" strokeWidth={2} />
                      </div>
                    </>
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
