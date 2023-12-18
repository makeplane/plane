import React from "react";
// headless ui
import { Popover } from "@headlessui/react";
// lucide icons
import { CalendarCheck2, CalendarClock, X } from "lucide-react";
// react date picker
import DatePicker from "react-datepicker";
// mobx
import { observer } from "mobx-react-lite";
// components
import { Tooltip } from "@plane/ui";
// hooks
import useDynamicDropdownPosition from "hooks/use-dynamic-dropdown";
// helpers
import { renderDateFormat, renderFormattedDate } from "helpers/date-time.helper";

export interface IIssuePropertyDate {
  value: string | null;
  onChange: (date: string | null) => void;
  disabled?: boolean;
  type: "start_date" | "target_date";
}

const DATE_OPTIONS = {
  start_date: {
    key: "start_date",
    placeholder: "Start date",
    icon: CalendarClock,
  },
  target_date: {
    key: "target_date",
    placeholder: "Target date",
    icon: CalendarCheck2,
  },
};

export const IssuePropertyDate: React.FC<IIssuePropertyDate> = observer((props) => {
  const { value, onChange, disabled, type } = props;

  const dropdownBtn = React.useRef<any>(null);
  const dropdownOptions = React.useRef<any>(null);

  const [isOpen, setIsOpen] = React.useState<boolean>(false);

  useDynamicDropdownPosition(isOpen, () => setIsOpen(false), dropdownBtn, dropdownOptions);

  const dateOptionDetails = DATE_OPTIONS[type];

  return (
    <Popover as="div" className="relative">
      {({ open }) => {
        if (open) {
          if (!isOpen) setIsOpen(true);
        } else if (isOpen) setIsOpen(false);

        return (
          <>
            <Popover.Button
              as="button"
              type="button"
              ref={dropdownBtn}
              className="border-none outline-none"
              onClick={(e) => e.stopPropagation()}
            >
              <Tooltip
                tooltipHeading={dateOptionDetails.placeholder}
                tooltipContent={value ? renderFormattedDate(value) : "None"}
              >
                <div
                  className={`flex h-5 w-full items-center rounded border-[0.5px] border-custom-border-300 px-2.5 py-1 outline-none duration-300 ${
                    disabled
                      ? "pointer-events-none cursor-not-allowed text-custom-text-200"
                      : "cursor-pointer hover:bg-custom-background-80"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 overflow-hidden">
                    <dateOptionDetails.icon className="h-3 w-3" strokeWidth={2} />
                    {value && (
                      <>
                        <div className="text-xs">{value}</div>
                        <div
                          className="flex flex-shrink-0 items-center justify-center"
                          onClick={() => {
                            if (onChange) onChange(null);
                          }}
                        >
                          <X className="h-2.5 w-2.5" strokeWidth={2} />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </Tooltip>
            </Popover.Button>

            <div className={`${open ? "fixed left-0 top-0 z-20 h-full w-full cursor-auto" : ""}`}>
              <Popover.Panel
                ref={dropdownOptions}
                className={`absolute z-10 mt-1 whitespace-nowrap rounded bg-custom-background-100 text-xs shadow-lg focus:outline-none`}
              >
                {({ close }) => (
                  <DatePicker
                    selected={value ? new Date(value) : new Date()}
                    onChange={(val, e) => {
                      e?.stopPropagation();
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
