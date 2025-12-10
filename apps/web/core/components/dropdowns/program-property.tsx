"use client";

import React, { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { createPortal } from "react-dom";
import { usePopper } from "react-popper";
import { Ban, Search, Users, X } from "lucide-react";

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
};

export const ProgramDropdown: React.FC<Props> = observer((props) => {
  const {
    className = "",
    buttonClassName = "p-1.5",
    buttonContainerClassName = "",
    clearIconClassName = "",
    placeholder = "Program",
    buttonVariant,
    renderByDefault = true,
    icon = <Users className="h-3 w-3 flex-shrink-0" />,
    hideIcon = false,
    showTooltip = false,
    disabled = false,
    value,
    onChange,
  } = props;

  const [programs, setPrograms] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
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

  /* Fetch Programs */
  useEffect(() => {
    const API_URL = `${process.env.NEXT_PUBLIC_CP_SERVER_URL}/meta-type?key='PROGRAM'`;
    setLoading(true);

    fetch(API_URL)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();

        const block = data?.["Gateway Response"]?.result?.[0] ?? [];
        const values = block.find((i: any) => i?.field === "values")?.value;
        if (!Array.isArray(values)) throw new Error("Invalid response");

        setPrograms(values.sort());
      })
      .catch((e) => setLoadError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredPrograms = programs.filter((p) =>
    p.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (program: string | null) => {
    console.log("[ProgramDropdown] selected:", program);
    onChange?.(program);
    setSearch("");
    handleClose();
    referenceElement?.blur();
  };

  const displayValue = value ?? placeholder;

  /* Dropdown Button */
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
          <span className="flex-grow truncate ">{displayValue}</span>
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

            {loading && <div className="px-2 py-1 text-xs">Loading…</div>}
            {loadError && <div className="px-2 py-1 text-xs text-red-500">Failed to load</div>}

            {!loading &&
              !loadError &&
              filteredPrograms.map((program) => (
                <div
                  key={program}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelect(program);
                  }}
                  className="px-2 py-1 cursor-pointer hover:bg-custom-background-80"
                >
                  <span className="text-xs">{program}</span>
                </div>
              ))}
          </div>,
          document.body
        )}
    </ComboDropDown>
  );
});
