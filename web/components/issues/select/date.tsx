import React, { Fragment, useState } from "react";
import { usePopper } from "react-popper";
import { Popover, Transition } from "@headlessui/react";
import { CalendarDays, X } from "lucide-react";
// react-datepicker
import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
import { renderDateFormat, renderShortDateWithYearFormat } from "helpers/date-time.helper";

type Props = {
  label: string;
  maxDate?: Date;
  minDate?: Date;
  onChange: (val: string | null) => void;
  value: string | null;
};

export const IssueDateSelect: React.FC<Props> = ({ label, maxDate, minDate, onChange, value }) => {
  const [referenceElement, setReferenceElement] = React.useState<HTMLDivElement | null>(null);
  const [popperElement, setPopperElement] = React.useState<HTMLDivElement | null>(null);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-start",
  });

  return (
    <Popover className="relative flex items-center justify-center  rounded-lg">
      {({ close }) => (
        <>
          <Popover.Button>
            <div
              ref={setReferenceElement}
              className="cursor-pointer rounded-md border border-custom-border-200 shadow-sm duration-200 flex items-center justify-center gap-2 px-2 py-1 text-xs text-custom-text-200 hover:bg-custom-background-80"
            >
              {value ? (
                <>
                  <span className="text-custom-text-100">{renderShortDateWithYearFormat(value)}</span>
                  <button onClick={() => onChange(null)}>
                    <X className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <>
                  <CalendarDays className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{label}</span>
                </>
              )}
            </div>
          </Popover.Button>

          <Transition
            as={React.Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Popover.Panel>
              <div
                className="absolute top-10 -left-10 z-20 transform overflow-hidden"
                ref={setPopperElement}
                style={styles.popper}
                {...attributes.popper}
              >
                <DatePicker
                  selected={value ? new Date(value) : null}
                  onChange={(val) => {
                    if (!val) onChange("");
                    else onChange(renderDateFormat(val));

                    close();
                  }}
                  dateFormat="dd-MM-yyyy"
                  minDate={minDate}
                  maxDate={maxDate}
                  inline
                />
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
};
