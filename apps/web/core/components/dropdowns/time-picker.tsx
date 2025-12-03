"use client";

import React, { useRef, useState } from "react";
import { observer } from "mobx-react";
import { createPortal } from "react-dom";
import { usePopper } from "react-popper";
import { Clock, X } from "lucide-react";
import { Combobox } from "@headlessui/react";

import { ComboDropDown } from "@plane/ui";
import { cn } from "@plane/utils";

import { useDropdown } from "@/hooks/use-dropdown";
import { DropdownButton } from "./buttons";
import { BUTTON_VARIANTS_WITH_TEXT } from "./constants";
import type { TDropdownProps } from "./types";

/* -------------------- UTILITIES -------------------- */

const formatTo12Hour = (time: string) => {
  if (!time) return null;

  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;

  return `${hour12.toString().padStart(2, "0")}:${m
    .toString()
    .padStart(2, "0")} ${period}`;
};

const convert12To24 = (time12: string | null) => {
  if (!time12) return "";

  const [time, period] = time12.split(" ");
  // eslint-disable-next-line prefer-const
  let [h, m] = time.split(":").map(Number);

  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;

  return `${h.toString().padStart(2, "0")}:${m
    .toString()
    .padStart(2, "0")}`;
};

/* -------------------- COMPONENT -------------------- */

type Props = TDropdownProps & {
  onChange: (val: string | null) => void;
  value: string | null;
  placeholder?: string;
  isClearable?: boolean;
  icon?: React.ReactNode;
  closeOnSelect?: boolean;
  clearIconClassName?: string;
  renderByDefault?: boolean;
};

export const TimeDropdown: React.FC<Props> = observer((props) => {
  const {
    buttonClassName = "",
    buttonContainerClassName = "",
    className = "",
    clearIconClassName = "",
    placeholder = "Time",
    icon = <Clock className="h-3 w-3 flex-shrink-0" />,
    buttonVariant,
    isClearable = true,
    showTooltip = false,
    tabIndex,
    disabled = false,
    closeOnSelect = true,
    renderByDefault = true,
    onChange,
    value,
  } = props;

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const [referenceElement, setReferenceElement] =
    useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(
    null
  );

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-start",
    modifiers: [{ name: "preventOverflow", options: { padding: 12 } }],
  });

  const isTimeSelected = value && value.trim() !== "";
  const { handleClose, handleKeyDown, handleOnClick } = useDropdown({
    dropdownRef,
    isOpen,
    setIsOpen,
  });

  const handlePickTime = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawTime = e.target.value; // "13:00"
    const formatted = formatTo12Hour(rawTime); // "01:00 PM"

    onChange(formatted);

    if (closeOnSelect) {
      handleClose();
      referenceElement?.blur();
    }
  };

  const comboButton = (
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
      disabled={disabled}
    >
      <DropdownButton
        className={buttonClassName}
        isActive={isOpen}
        tooltipHeading={placeholder}
        tooltipContent={value || "None"}
        showTooltip={showTooltip}
        variant={buttonVariant}
        renderToolTipByDefault={renderByDefault}
      >
        {!disabled && icon}

        {BUTTON_VARIANTS_WITH_TEXT.includes(buttonVariant) && (
          <span className="flex-grow truncate">{value || placeholder}</span>
        )}

        {isClearable && isTimeSelected && !disabled && (
          <X
            className={cn("h-2.5 w-2.5 flex-shrink-0", clearIconClassName)}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onChange(null);
            }}
          />
        )}
      </DropdownButton>
    </button>
  );

  return (
    <ComboDropDown
      as="div"
      className={cn("h-full", className)}
      ref={dropdownRef}
      button={comboButton}
      tabIndex={tabIndex}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      renderByDefault={renderByDefault}
    >
      {isOpen &&
        createPortal(
          <Combobox.Options data-prevent-outside-click static>
            <div
              className={cn(
                "my-1 bg-custom-background-200 shadow-custom-shadow-rg border-[0.5px] border-custom-border-300 rounded-md overflow-hidden z-30 p-2"
              )}
              ref={setPopperElement}
              style={styles.popper}
              {...attributes.popper}
            >
              {/* REAL TIME PICKER */}
              <input
                type="time"
                className="w-full bg-custom-background-300 text-sm rounded px-2 py-1 outline-none"
                value={convert12To24(value)}
                onChange={handlePickTime}
                autoFocus
              />
            </div>
          </Combobox.Options>,
          document.body
        )}
    </ComboDropDown>
  );
});
