"use client";

import React, { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { createPortal } from "react-dom";
import { usePopper } from "react-popper";
import { Ban, Search, Volleyball, X } from "lucide-react";

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
  renderByDefault?: boolean;
  icon?: React.ReactNode;
  clearIconClassName?: string;
  dropdownClassName?: string;
};

export const SportDropdown: React.FC<Props> = observer((props) => {
  const {
    className = "",
    buttonClassName = "p-1.5",
    buttonContainerClassName = "",
    clearIconClassName = "",
    placeholder = "Sport",
    buttonVariant,
    renderByDefault = true,
    icon = <Volleyball className="h-3 w-3 flex-shrink-0" />,
    hideIcon = false,
    showTooltip = false,
    disabled = false,
    value,
    onChange,
    dropdownClassName = "",
  } = props;

  const [sports, setSports] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [referenceElement, setReferenceElement] =
    useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] =
    useState<HTMLDivElement | null>(null);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-start",
    modifiers: [{ name: "preventOverflow", options: { padding: 12 } }],
  });

  const { handleClose, handleKeyDown, handleOnClick } = useDropdown({
    dropdownRef,
    isOpen,
    setIsOpen,
  });

  /* ─────────────── Fetch Sports ─────────────── */
  useEffect(() => {
    const API_URL = `${process.env.NEXT_PUBLIC_CP_SERVER_URL}/meta-type?key='SPORT'`;
    setLoading(true);

    fetch(API_URL)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch sports");
        const data = await res.json();
        const block = data?.["Gateway Response"]?.result?.[0] ?? [];
        const values = block.find((i: any) => i?.field === "values")?.value;

        const cleanValues = Array.isArray(values)
          ? values.filter((v) => typeof v === "string").sort()
          : [];

        setSports(cleanValues);
      })
      .catch((e) => setLoadError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredSports = sports.filter((s) =>
    s.toLowerCase().includes(search.toLowerCase())
  );

  /* ─────────────── ✅ FIXED SELECT HANDLER ─────────────── */
  const handleSelect = (selectedVal: string | null) => {
    console.log("✅ [SportDropdown] Selected:", selectedVal);

    onChange?.(selectedVal);

    setSearch("");
    handleClose();
    referenceElement?.blur();
  };

  const displayValue =
    typeof value === "string" && value.length > 0 ? value : placeholder;

  /* ─────────────── Button ─────────────── */
  const comboButton = (
    <button
      type="button"
      ref={setReferenceElement}
      onClick={handleOnClick}
      disabled={disabled}
      className={cn(
        "clickable block h-full max-w-full outline-none",
        disabled
          ? "cursor-not-allowed text-custom-text-200"
          : "cursor-pointer",
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
          <span className="flex-grow truncate min-w-0">
            {displayValue}
          </span>
        )}

        {!!value && !disabled && (
          <X
            className={cn("h-2.5 w-2.5", clearIconClassName)}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSelect(null);
            }}
          />
        )}
      </DropdownButton>
    </button>
  );

  return (
    <ComboDropDown
      ref={dropdownRef}
      as="div"
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
            className={cn(
              "my-1 w-52 bg-custom-background-100 shadow-custom-shadow-rg border border-custom-border-300 rounded-md z-30",
              dropdownClassName
            )}
          >
            {/* Search */}
            <div className="relative p-2">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3 w-3" />
              <input
                autoFocus
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
              <Ban className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-xs text-gray-400">None</span>
            </div>

            {/* Sports list */}
            <div className="max-h-44 overflow-y-auto">
              {!loading &&
                !loadError &&
                filteredSports.map((sport) => (
                  <div
                    key={sport}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSelect(sport);
                    }}
                    className={cn(
                      "px-2 h-6 flex items-center cursor-pointer text-xs",
                      "hover:bg-custom-background-80",
                      value === sport &&
                        "bg-custom-background-80 font-medium"
                    )}
                  >
                    {sport}
                  </div>
                ))}
            </div>
          </div>,
          document.body
        )}
    </ComboDropDown>
  );
});

export default SportDropdown;
