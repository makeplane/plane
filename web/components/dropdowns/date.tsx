import React, { useRef, useState } from "react";
import { Combobox } from "@headlessui/react";
import { DayPicker, Matcher } from "react-day-picker";
import { usePopper } from "react-popper";
import { CalendarDays, X } from "lucide-react";
// hooks
import { useDropdownKeyDown } from "hooks/use-dropdown-key-down";
import useOutsideClickDetector from "hooks/use-outside-click-detector";
// components
import { DropdownButton } from "./buttons";
// helpers
import { renderFormattedDate } from "helpers/date-time.helper";
import { cn } from "helpers/common.helper";
// types
import { TDropdownProps } from "./types";
// constants
import { BUTTON_VARIANTS_WITH_TEXT } from "./constants";

type Props = TDropdownProps & {
  clearIconClassName?: string;
  icon?: React.ReactNode;
  isClearable?: boolean;
  minDate?: Date;
  maxDate?: Date;
  onChange: (val: Date | null) => void;
  onClose?: () => void;
  value: Date | string | null;
  closeOnSelect?: boolean;
};

export const DateDropdown: React.FC<Props> = (props) => {
  const {
    buttonClassName = "",
    buttonContainerClassName,
    buttonVariant,
    className = "",
    clearIconClassName = "",
    closeOnSelect = true,
    disabled = false,
    hideIcon = false,
    icon = <CalendarDays className="h-3 w-3 flex-shrink-0" />,
    isClearable = true,
    minDate,
    maxDate,
    onChange,
    onClose,
    placeholder = "Date",
    placement,
    showTooltip = false,
    tabIndex,
    value,
  } = props;
  // states
  const [isOpen, setIsOpen] = useState(false);
  // refs
  const dropdownRef = useRef<HTMLDivElement | null>(null);
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

  const isDateSelected = value && value.toString().trim() !== "";

  const onOpen = () => {
    if (referenceElement) referenceElement.focus();
  };

  const handleClose = () => {
    if (!isOpen) return;
    setIsOpen(false);
    if (referenceElement) referenceElement.blur();
    onClose && onClose();
  };

  const toggleDropdown = () => {
    if (!isOpen) onOpen();
    setIsOpen((prevIsOpen) => !prevIsOpen);
    if (isOpen) onClose && onClose();
  };

  const dropdownOnChange = (val: Date | null) => {
    onChange(val);
    if (closeOnSelect) handleClose();
  };

  const handleKeyDown = useDropdownKeyDown(toggleDropdown, handleClose);

  const handleOnClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    e.preventDefault();
    toggleDropdown();
  };

  useOutsideClickDetector(dropdownRef, handleClose);

  const disabledDays: Matcher[] = [];
  if (minDate) disabledDays.push({ before: minDate });
  if (maxDate) disabledDays.push({ after: maxDate });

  return (
    <Combobox
      as="div"
      ref={dropdownRef}
      tabIndex={tabIndex}
      className={cn("h-full", className)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          if (!isOpen) handleKeyDown(e);
        } else handleKeyDown(e);
      }}
      disabled={disabled}
    >
      <Combobox.Button as={React.Fragment}>
        <button
          type="button"
          className={cn(
            "clickable block h-full max-w-full outline-none",
            {
              "cursor-not-allowed text-custom-text-200": disabled,
              "cursor-pointer": !disabled,
            },
            buttonContainerClassName
          )}
          ref={setReferenceElement}
          onClick={handleOnClick}
        >
          <DropdownButton
            className={buttonClassName}
            isActive={isOpen}
            tooltipHeading={placeholder}
            tooltipContent={value ? renderFormattedDate(value) : "None"}
            showTooltip={showTooltip}
            variant={buttonVariant}
          >
            {!hideIcon && icon}
            {BUTTON_VARIANTS_WITH_TEXT.includes(buttonVariant) && (
              <span className="flex-grow truncate">{value ? renderFormattedDate(value) : placeholder}</span>
            )}
            {isClearable && !disabled && isDateSelected && (
              <X
                className={cn("h-2 w-2 flex-shrink-0", clearIconClassName)}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null);
                }}
              />
            )}
          </DropdownButton>
        </button>
      </Combobox.Button>
      {isOpen && (
        <Combobox.Options className="fixed z-10" static>
          <div
            className="my-1 bg-custom-background-100 shadow-custom-shadow-rg rounded-md overflow-hidden p-3"
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
          >
            <DayPicker
              selected={value ? new Date(value) : undefined}
              defaultMonth={value ? new Date(value) : undefined}
              onSelect={(date) => {
                dropdownOnChange(date ?? null);
              }}
              showOutsideDays
              initialFocus
              disabled={disabledDays}
              mode="single"
            />
          </div>
        </Combobox.Options>
      )}
    </Combobox>
  );
};
