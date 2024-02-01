import React, { useRef, useState } from "react";
import { Combobox } from "@headlessui/react";
import DatePicker from "react-datepicker";
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
    placeholder = "Date",
    placement,
    showTooltip = false,
    tabIndex,
    value,
  } = props;
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
    if (isOpen) setIsOpen(false);
    if (referenceElement) referenceElement.blur();
  };

  const toggleDropdown = () => {
    if (!isOpen) onOpen();
    setIsOpen((prevIsOpen) => !prevIsOpen);
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

  return (
    <Combobox
      as="div"
      ref={dropdownRef}
      tabIndex={tabIndex}
      className={cn("h-full", className)}
      onKeyDown={handleKeyDown}
    >
      <Combobox.Button as={React.Fragment}>
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
            {isClearable && isDateSelected && (
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
          <div className="my-1" ref={setPopperElement} style={styles.popper} {...attributes.popper}>
            <DatePicker
              selected={value ? new Date(value) : null}
              onChange={dropdownOnChange}
              dateFormat="dd-MM-yyyy"
              minDate={minDate}
              maxDate={maxDate}
              calendarClassName="shadow-custom-shadow-rg rounded"
              inline
            />
          </div>
        </Combobox.Options>
      )}
    </Combobox>
  );
};
