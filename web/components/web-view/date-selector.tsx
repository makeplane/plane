// react
import React, { useState, useEffect } from "react";

// icons
import { ChevronDown } from "lucide-react";

// react date-picker
import DatePicker, { ReactDatePickerProps } from "react-datepicker";

// components
import { WebViewModal } from "./web-view-modal";
import { SecondaryButton, PrimaryButton } from "components/ui";

// helpers
import { renderDateFormat } from "helpers/date-time.helper";

interface Props extends ReactDatePickerProps {
  value: string | undefined;
  onChange: (value: any) => void;
  disabled?: boolean;
  renderAs?: "input" | "button";
  error?: any;
  noBorder?: boolean;
}

export const DateSelector: React.FC<Props> = (props) => {
  const {
    value,
    onChange,
    disabled = false,
    renderAs = "button",
    noBorder = true,
    error,
    className,
  } = props;

  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    if (value) setSelectedDate(new Date(value));
  }, [value]);

  useEffect(() => {
    if (!isOpen) return;

    if (value) setSelectedDate(new Date(value));
    else setSelectedDate(new Date());
  }, [isOpen, value]);

  return (
    <>
      <WebViewModal
        isOpen={isOpen}
        modalTitle="Select due-date"
        onClose={() => {
          setIsOpen(false);
        }}
      >
        <div className="w-full flex justify-center items-center">
          <DatePicker
            inline
            selected={selectedDate ? new Date(selectedDate) : null}
            className={`${
              renderAs === "input"
                ? "block px-2 py-2 text-sm focus:outline-none"
                : renderAs === "button"
                ? `px-2 py-1 text-xs shadow-sm ${
                    disabled ? "" : "hover:bg-custom-background-80"
                  } duration-300`
                : ""
            } ${error ? "border-red-500 bg-red-100" : ""} ${
              disabled ? "cursor-not-allowed" : "cursor-pointer"
            } ${
              noBorder ? "" : "border border-custom-border-200"
            } w-full rounded-md caret-transparent outline-none ${className}`}
            dateFormat="MMM dd, yyyy"
            {...props}
            onChange={(val) => {
              if (!val) setSelectedDate(null);
              else setSelectedDate(val);
            }}
            renderCustomHeader={({
              date,
              decreaseMonth,
              increaseMonth,
              prevMonthButtonDisabled,
              nextMonthButtonDisabled,
            }) => (
              <div className="flex justify-between px-5 text-lg font-medium">
                <h4>
                  {date.toLocaleString("default", { month: "long" })} {date.getFullYear()}
                </h4>
                <div>
                  <button
                    type="button"
                    onClick={decreaseMonth}
                    disabled={prevMonthButtonDisabled}
                    className="text-custom-text-100"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M11.2285 14.5416L7.10352 10.4166C7.03407 10.3472 6.98546 10.2778 6.95768 10.2083C6.9299 10.1389 6.91602 10.0625 6.91602 9.97915C6.91602 9.89581 6.9299 9.81942 6.95768 9.74998C6.98546 9.68053 7.03407 9.61109 7.10352 9.54165L11.2493 5.39581C11.3743 5.27081 11.5237 5.20831 11.6973 5.20831C11.8709 5.20831 12.0202 5.27081 12.1452 5.39581C12.2702 5.52081 12.3292 5.67359 12.3223 5.85415C12.3153 6.0347 12.2493 6.18748 12.1243 6.31248L8.45768 9.97915L12.1452 13.6666C12.2702 13.7916 12.3327 13.9375 12.3327 14.1041C12.3327 14.2708 12.2702 14.4166 12.1452 14.5416C12.0202 14.6666 11.8674 14.7291 11.6868 14.7291C11.5063 14.7291 11.3535 14.6666 11.2285 14.5416Z"
                        fill="#171717"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={increaseMonth}
                    disabled={nextMonthButtonDisabled}
                    className="text-custom-text-100"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M7.37496 14.5417C7.26385 14.4028 7.20482 14.25 7.19788 14.0834C7.19093 13.9167 7.24996 13.7709 7.37496 13.6459L11.0416 9.97919L7.35413 6.29169C7.24302 6.18058 7.19093 6.03128 7.19788 5.84378C7.20482 5.65628 7.26385 5.50697 7.37496 5.39586C7.51385 5.25697 7.66316 5.191 7.82288 5.19794C7.9826 5.20489 8.12496 5.27086 8.24996 5.39586L12.3958 9.54169C12.4652 9.61114 12.5139 9.68058 12.5416 9.75003C12.5694 9.81947 12.5833 9.89586 12.5833 9.97919C12.5833 10.0625 12.5694 10.1389 12.5416 10.2084C12.5139 10.2778 12.4652 10.3473 12.3958 10.4167L8.27079 14.5417C8.14579 14.6667 7.99996 14.7257 7.83329 14.7188C7.66663 14.7118 7.51385 14.6528 7.37496 14.5417Z"
                        fill="#171717"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          />
        </div>

        <WebViewModal.Footer className="flex items-center gap-2">
          <SecondaryButton
            type="button"
            onClick={() => {
              setIsOpen(false);
              onChange(null);
              setSelectedDate(null);
            }}
            className="w-full"
          >
            Clear
          </SecondaryButton>
          <PrimaryButton
            onClick={() => {
              if (!selectedDate) onChange(null);
              else onChange(renderDateFormat(selectedDate));
              setIsOpen(false);
            }}
            type="button"
            className="w-full"
          >
            Apply
          </PrimaryButton>
        </WebViewModal.Footer>
      </WebViewModal>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(true)}
        className={
          "relative w-full px-2.5 py-0.5 text-base flex justify-between items-center gap-0.5 text-custom-text-200"
        }
      >
        {value ? (
          <div className="-my-0.5 flex items-center gap-2">
            {new Date(value).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </div>
        ) : (
          "Due date"
        )}
        <ChevronDown className="w-4 h-4" />
      </button>
    </>
  );
};
