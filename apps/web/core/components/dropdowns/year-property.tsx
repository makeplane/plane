"use client";

import React, { useEffect, useState, useRef } from "react";
import { observer } from "mobx-react";
import { createPortal } from "react-dom";
import { usePopper } from "react-popper";
import { Ban, Calendar, Search, X } from "lucide-react";

import { ComboDropDown } from "@plane/ui";
import { cn } from "@plane/utils";
import { DropdownButton } from "@/components/dropdowns/buttons";
import { BUTTON_VARIANTS_WITH_TEXT } from "@/components/dropdowns/constants";
import type { TDropdownProps } from "@/components/dropdowns/types";
import { useDropdown } from "@/hooks/use-dropdown";

type Props = TDropdownProps & {
  value?: string | null;
  onChange?: (val: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  startYear?: number;
  renderByDefault?: boolean;
  icon?: React.ReactNode;
  clearIconClassName?: string;
};

export const YearRangeDropdown: React.FC<Props> = observer((props) => {
  const {
    className = "",
    buttonClassName = "p-1.5",
    buttonContainerClassName = "",
    clearIconClassName = "",
    placeholder = "Season",
    buttonVariant,
    renderByDefault = true,
    icon = <Calendar className="h-3 w-3 flex-shrink-0" />,
    hideIcon = false,
    showTooltip = false,
    disabled = false,
    value,
    onChange,
    startYear = 2020,
  } = props;

  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-start",
    modifiers: [{ name: "preventOverflow", options: { padding: 12 } }],
  });

  const { handleClose, handleKeyDown, handleOnClick } = useDropdown({
    dropdownRef,
    isOpen,
    setIsOpen,
  });

  /* Generate Year Ranges */
  const generateYearSessions = (startYear: number): string[] => {
    const currentYear = new Date().getFullYear();
    const sessions: string[] = [];
    for (let year = currentYear; year >= startYear; year--) {
      sessions.push(`${year}-${year + 1}`);
    }
    return sessions;
  };

  const yearRanges = generateYearSessions(startYear);
  const filteredRanges = yearRanges.filter((y) =>
    y.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (range: string | null) => {
    console.log("[YearRangeDropdown] selected:", range);
    onChange?.(range);
    setSearch("");
    handleClose();
    referenceElement?.blur();
  };

  const displayValue = value ?? placeholder;

  /* Button */
  const comboButton = (
    <button
      type="button"
      ref={setReferenceElement}
      onClick={handleOnClick}
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

        {!!value && !disabled && (
          <X
            className={cn("h-2.5 w-2.5 flex-shrink-0", clearIconClassName)}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onChange?.(null);
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
      onKeyDown={handleKeyDown}
      disabled={disabled}
      renderByDefault={renderByDefault}
    >
      {isOpen &&
        createPortal(
          <div
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
            className="my-1 w-52 bg-custom-background-100 shadow-custom-shadow-rg
                       border-[0.5px] border-custom-border-300 rounded-md
                       overflow-hidden z-30"
          >
            {/* Search */}
            <div className="relative p-2">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                className="w-full py-1 pl-8 pr-2 text-xs rounded bg-custom-background-90 outline-none"
              />
            </div>

            {/* None */}
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSelect(null);
              }}
              className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-custom-background-80"
            >
              <Ban className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs text-gray-400">None</span>
            </div>

            {filteredRanges.map((range) => (
              <div
                key={range}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelect(range);
                }}
                className="px-2 py-1 cursor-pointer hover:bg-custom-background-80"
              >
                <span className="text-xs">{range}</span>
              </div>
            ))}
          </div>,
          document.body
        )}
    </ComboDropDown>
  );
});
