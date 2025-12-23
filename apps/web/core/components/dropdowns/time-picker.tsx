"use client";

import React, { useRef, useState } from "react";
import { observer } from "mobx-react";
import { createPortal } from "react-dom";
import { usePopper } from "react-popper";
import { Clock, X } from "lucide-react";
import { Combobox } from "@headlessui/react";
import { ComboDropDown } from "@plane/ui";
import { cn, isoTo24Hour, updateISOTime } from "@plane/utils";

import { useDropdown } from "@/hooks/use-dropdown";
import { DropdownButton } from "./buttons";
import { BUTTON_VARIANTS_WITH_TEXT } from "./constants";
import type { TDropdownProps } from "./types";

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
    buttonClassName = "p-1.5",
    buttonContainerClassName = "",
    className = "",
    clearIconClassName = "",
    placeholder = "Time",
    hideIcon = false,
    icon = <Clock className="h-3 w-3 flex-shrink-0" />,
    buttonVariant,
    isClearable = true,
    showTooltip = false,
    tabIndex,
    disabled = false,
    renderByDefault = true,
    closeOnSelect = true,
    onChange,
    value,
  } = props;

  const [isOpen, setIsOpen] = useState(false);
  const [tempTime24, setTempTime24] = useState<string>("");

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-start",
    modifiers: [{ name: "preventOverflow", options: { padding: 12 } }],
  });

  const isTimeSelected = Boolean(value && value.trim() !== "");

  const { handleClose, handleKeyDown, handleOnClick } = useDropdown({
    dropdownRef,
    isOpen,
    setIsOpen,
  });

  /* ─────────────────────────────── */
  /* Open dropdown & initialize time */
  /* ─────────────────────────────── */
  const handleOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
    handleOnClick(e);
    setTempTime24(value ? isoTo24Hour(value) : "");
  };

  /* ─────────────────────────────── */
  /* Apply time immediately on change */
  /* ─────────────────────────────── */
  const handlePickTime = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTempTime24(newTime);

    if (newTime) {
      const updatedISO = updateISOTime(value, newTime);
      onChange(updatedISO);
    }
  };

  /* ───────────── */
  /* Apply on OK   */
  /* ───────────── */
  const handleApply = () => {
    if (!tempTime24) return;

    const updatedISO = updateISOTime(value, tempTime24);
    onChange(updatedISO);

    handleClose();
    referenceElement?.blur();
  };

  const displayValue = value ? isoTo24Hour(value) : placeholder;

  const comboButton = (
    <button
      type="button"
      ref={setReferenceElement}
      onClick={handleOpen}
      disabled={disabled}
      className={cn(
        "clickable block h-full max-w-full outline-none",
        {
          "cursor-not-allowed text-custom-text-200": disabled,
          "cursor-pointer": !disabled,
        },
        buttonContainerClassName
      )}
    >
      <DropdownButton
        className={buttonClassName}
        isActive={isOpen}
        tooltipHeading={placeholder}
        tooltipContent={displayValue}
        showTooltip={showTooltip}
        variant={buttonVariant}
        renderToolTipByDefault={renderByDefault}
      >
        {!hideIcon && icon}

        {BUTTON_VARIANTS_WITH_TEXT.includes(buttonVariant) && (
          <span className="flex-grow truncate">{displayValue}</span>
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
      ref={dropdownRef}
      className={cn("h-full", className)}
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
              ref={setPopperElement}
              style={styles.popper}
              {...attributes.popper}
              className={cn(
                "my-1 bg-custom-background-100  shadow-custom-shadow-rg border-[0.5px] border-custom-border-300 rounded-md overflow-hidden z-30"
              )}
            >
              <div className="flex p-2 justify-between items-center space-x-2 min-w-[130px] ">
                <input
                  type="time"
                  value={tempTime24}
                  onChange={handlePickTime}
                  autoFocus
                  className="w-full bg-custom-background-100  text-sm rounded px-2 py-1 outline-none"
                />
                <X
                  className="h-3.5 w-3.5 flex-shrink-0"
                  onClick={() => {
                    handleClose();
                    referenceElement?.blur();
                  }}
                />

                {/* <button
                  className="text-xs px-3 py-1 rounded border border-custom-border-200 text-custom-text-300 "
                  onClick={handleApply}
                  disabled={!tempTime24}
                >
                  OK
                </button> */}
              </div>
            </div>
          </Combobox.Options>,
          document.body
        )}
    </ComboDropDown>
  );
});
