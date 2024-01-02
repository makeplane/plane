import React, { useState } from "react";
import { Popover } from "@headlessui/react";
import DatePicker from "react-datepicker";
import { usePopper } from "react-popper";
import { CalendarDays, X } from "lucide-react";
// import "react-datepicker/dist/react-datepicker.css";
// helpers
import { renderFormattedDate } from "helpers/date-time.helper";
import { cn } from "helpers/common.helper";
// types
import { TButtonVariants } from "./types";
import { Placement } from "@popperjs/core";

type Props = {
  buttonClassName?: string;
  buttonContainerClassName?: string;
  buttonVariant: TButtonVariants;
  disabled?: boolean;
  icon?: React.ReactNode;
  isClearable?: boolean;
  minDate?: Date;
  maxDate?: Date;
  onChange: (val: Date | null) => void;
  placeholder: string;
  placement?: Placement;
  value: Date | string | null;
  closeOnSelect?: boolean;
};

type ButtonProps = {
  className?: string;
  date: string | Date | null;
  icon: React.ReactNode;
  isClearable: boolean;
  hideText?: boolean;
  onClear: () => void;
  placeholder: string;
};

const BorderButton = (props: ButtonProps) => {
  const { className, date, icon, isClearable, hideText = false, onClear, placeholder } = props;

  return (
    <div
      className={cn(
        "h-full flex items-center gap-1.5 border-[0.5px] border-custom-border-300 hover:bg-custom-background-80 rounded text-xs px-2 py-0.5",
        className
      )}
    >
      {icon}
      {!hideText && <span className="flex-grow truncate">{date ? renderFormattedDate(date) : placeholder}</span>}
      {isClearable && (
        <X
          className="h-2 w-2 flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
        />
      )}
    </div>
  );
};

const BackgroundButton = (props: ButtonProps) => {
  const { className, date, icon, isClearable, hideText = false, onClear, placeholder } = props;

  return (
    <div
      className={cn("h-full flex items-center gap-1.5 rounded text-xs px-2 py-0.5 bg-custom-background-80", className)}
    >
      {icon}
      {!hideText && <span className="flex-grow truncate">{date ? renderFormattedDate(date) : placeholder}</span>}
      {isClearable && (
        <X
          className="h-2 w-2 flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
        />
      )}
    </div>
  );
};

const TransparentButton = (props: ButtonProps) => {
  const { className, date, icon, isClearable, hideText = false, onClear, placeholder } = props;

  return (
    <div
      className={cn(
        "h-full flex items-center gap-1.5 rounded text-xs px-2 py-0.5 hover:bg-custom-background-80",
        className
      )}
    >
      {icon}
      {!hideText && <span className="flex-grow truncate">{date ? renderFormattedDate(date) : placeholder}</span>}
      {isClearable && (
        <X
          className="h-2 w-2 flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
        />
      )}
    </div>
  );
};

export const DateDropdown: React.FC<Props> = (props) => {
  const {
    buttonClassName = "",
    buttonContainerClassName,
    buttonVariant,
    disabled = false,
    icon = <CalendarDays className="h-3 w-3 flex-shrink-0" />,
    isClearable = true,
    minDate,
    maxDate,
    onChange,
    placeholder,
    placement,
    value,
    closeOnSelect = true,
  } = props;
  // popper-js refs
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  // popper-js init
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: placement ?? "bottom-start",
    modifiers: [
      {
        name: "preventOverflow",
        options: {
          padding: 12,
        },
      },
    ],
  });

  const isDateSelected = value !== null && value !== undefined && value.toString().trim() !== "";

  return (
    <Popover className="h-full flex-shrink-0">
      {({ close }) => (
        <>
          <Popover.Button as={React.Fragment}>
            <button
              ref={setReferenceElement}
              type="button"
              className={cn(
                "block h-full max-w-full outline-none",
                {
                  "cursor-not-allowed text-custom-text-200": disabled,
                  "cursor-pointer": !disabled,
                },
                buttonContainerClassName
              )}
            >
              {buttonVariant === "border-with-text" ? (
                <BorderButton
                  date={value}
                  className={buttonClassName}
                  icon={icon}
                  placeholder={placeholder}
                  isClearable={isClearable && isDateSelected}
                  onClear={() => onChange(null)}
                />
              ) : buttonVariant === "border-without-text" ? (
                <BorderButton
                  date={value}
                  className={buttonClassName}
                  icon={icon}
                  placeholder={placeholder}
                  isClearable={isClearable && isDateSelected}
                  onClear={() => onChange(null)}
                  hideText
                />
              ) : buttonVariant === "background-with-text" ? (
                <BackgroundButton
                  date={value}
                  className={buttonClassName}
                  icon={icon}
                  placeholder={placeholder}
                  isClearable={isClearable && isDateSelected}
                  onClear={() => onChange(null)}
                />
              ) : buttonVariant === "background-without-text" ? (
                <BackgroundButton
                  date={value}
                  className={buttonClassName}
                  icon={icon}
                  placeholder={placeholder}
                  isClearable={isClearable && isDateSelected}
                  onClear={() => onChange(null)}
                  hideText
                />
              ) : buttonVariant === "transparent-with-text" ? (
                <TransparentButton
                  date={value}
                  className={buttonClassName}
                  icon={icon}
                  placeholder={placeholder}
                  isClearable={isClearable && isDateSelected}
                  onClear={() => onChange(null)}
                />
              ) : buttonVariant === "transparent-without-text" ? (
                <TransparentButton
                  date={value}
                  className={buttonClassName}
                  icon={icon}
                  placeholder={placeholder}
                  isClearable={isClearable && isDateSelected}
                  onClear={() => onChange(null)}
                  hideText
                />
              ) : null}
            </button>
          </Popover.Button>
          <Popover.Panel className="fixed z-10">
            <div className="my-1" ref={setPopperElement} style={styles.popper} {...attributes.popper}>
              <DatePicker
                selected={value ? new Date(value) : null}
                onChange={(val) => {
                  onChange(val);
                  if (closeOnSelect) close();
                }}
                dateFormat="dd-MM-yyyy"
                minDate={minDate}
                maxDate={maxDate}
                calendarClassName="shadow-custom-shadow-rg rounded"
                inline
              />
            </div>
          </Popover.Panel>
        </>
      )}
    </Popover>
  );
};
