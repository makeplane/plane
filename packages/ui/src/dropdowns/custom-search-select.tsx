/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Combobox } from "@headlessui/react";
import { Info } from "lucide-react";
import React, { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePopper } from "react-popper";
import { useOutsideClickDetector } from "@plane/hooks";
import { CheckIcon, SearchIcon, ChevronDownIcon } from "@plane/propel/icons";
// plane imports
// local imports
import { Tooltip } from "@plane/propel/tooltip";
import { useDropdownKeyDown } from "../hooks/use-dropdown-key-down";
import { cn } from "../utils";
import type { ICustomSearchSelectProps } from "./helper";

/**
 * §single-vs-multi — Headless UI's `Combobox` single-select mode passes a
 * scalar to `onChange` (the selected option's `value`), but multiple-select
 * mode passes an array. Some single-select callers in this codebase wrap
 * `value` in a one-element array (e.g. the dashboard's analytics filters),
 * while others pass a scalar (e.g. the project-invite modal). We mirror
 * whatever shape the caller used on `value` so the `onChange` callback
 * receives a payload matching the documented contract — and so a downstream
 * scalar consumer doesn't suddenly receive a `list` and crash a Python
 * endpoint that hashes it as a dict key.
 *
 * Exported for direct unit testing; the component uses this internally.
 */
export function mirrorCallerShapeOnSingleChange(
  currentValue: unknown,
  onChange: (v: unknown) => void
): (selected: unknown) => void {
  return (selected: unknown) => {
    if (Array.isArray(currentValue)) {
      // Caller passed an array — preserve that shape on output.
      if (Array.isArray(selected)) onChange(selected);
      else if (selected === undefined || selected === null) onChange([]);
      else onChange([selected]);
    } else {
      // Caller passed a scalar (or undefined/null) — return what Headless UI
      // gave us so the consumer's `value` prop stays scalar-shaped.
      onChange(selected);
    }
  };
}

export function CustomSearchSelect(props: ICustomSearchSelectProps) {
  const {
    customButtonClassName = "",
    buttonClassName = "",
    className = "",
    chevronClassName = "",
    customButton,
    placement,
    disabled = false,
    footerOption,
    input = false,
    label,
    maxHeight = "md",
    multiple = false,
    noChevron = false,
    onChange,
    options,
    onOpen,
    onClose,
    optionsClassName = "",
    value,
    tabIndex,
    noResultsMessage = "No matches found",
    defaultOpen = false,
    selectedContent,
    multipleLabel,
  } = props;
  const [query, setQuery] = useState("");

  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(defaultOpen);
  // refs
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: placement ?? "bottom-start",
  });

  const filteredOptions =
    query === "" ? options : options?.filter((option) => option.query.toLowerCase().includes(query.toLowerCase()));

  // §single-vs-multi — see `mirrorCallerShapeOnSingleChange` above for the
  // contract we honor here: single-select callers pass `value` either as a
  // scalar or as a one-element array, and they get back the same shape they
  // passed. (The component is the single source of truth — HeadlessUI only
  // emits a scalar from a single-select click.)
  const valueArr = Array.isArray(value) ? value : value === undefined || value === null ? [] : [value];
  const handleSingleChange = mirrorCallerShapeOnSingleChange(value, onChange);
  const comboboxProps: any = {
    value: multiple ? valueArr : valueArr[0],
    onChange: multiple ? onChange : handleSingleChange,
    disabled,
  };

  if (multiple) comboboxProps.multiple = true;

  const openDropdown = () => {
    setIsOpen(true);
    if (referenceElement) referenceElement.focus();
    if (onOpen) onOpen();
  };

  const closeDropdown = () => {
    setIsOpen(false);
    onClose && onClose();
  };

  const handleKeyDown = useDropdownKeyDown(openDropdown, closeDropdown, isOpen);
  useOutsideClickDetector(dropdownRef, closeDropdown);

  const toggleDropdown = () => {
    if (isOpen) closeDropdown();
    else openDropdown();
  };

  return (
    <Combobox
      as="div"
      ref={dropdownRef}
      tabIndex={tabIndex}
      className={cn("relative flex-shrink-0 text-left", className)}
      onKeyDown={handleKeyDown}
      {...comboboxProps}
    >
      {({ open }: { open: boolean }) => {
        if (open && onOpen) onOpen();

        return (
          <>
            {customButton ? (
              <Combobox.Button as={React.Fragment}>
                <button
                  ref={setReferenceElement}
                  type="button"
                  className={cn(
                    "flex w-full items-center justify-between gap-1 text-11",
                    {
                      "cursor-not-allowed text-secondary": disabled,
                      "cursor-pointer hover:bg-layer-transparent-hover": !disabled,
                    },
                    customButtonClassName
                  )}
                  onClick={toggleDropdown}
                >
                  {customButton}
                </button>
              </Combobox.Button>
            ) : (
              <Combobox.Button as={React.Fragment}>
                <button
                  ref={setReferenceElement}
                  type="button"
                  className={cn(
                    "flex w-full items-center justify-between gap-1 rounded-sm border-[0.5px] border-strong",
                    {
                      "px-3 py-2 text-13": input,
                      "px-2 py-1 text-11": !input,
                      "cursor-not-allowed text-secondary": disabled,
                      "cursor-pointer hover:bg-layer-transparent-hover": !disabled,
                    },
                    buttonClassName
                  )}
                  onClick={toggleDropdown}
                >
                  {(() => {
                    const selectedOption = options?.find((o) => o.value === value?.[0]);
                    if (multiple && Array.isArray(value) && value.length > 1) {
                      return multipleLabel ? multipleLabel(value.length) : `${value.length} selected`;
                    }
                    if (selectedContent && Array.isArray(value) && value.length === 1) {
                      return selectedContent(value[0], selectedOption);
                    }
                    return label;
                  })()}
                  {!noChevron && !disabled && (
                    <ChevronDownIcon className={cn("h-3 w-3 flex-shrink-0", chevronClassName)} aria-hidden="true" />
                  )}
                </button>
              </Combobox.Button>
            )}
            {isOpen &&
              createPortal(
                <Combobox.Options data-prevent-outside-click static>
                  <div
                    className={cn(
                      "z-30 my-1 min-w-48 overflow-y-scroll rounded-md border-[0.5px] border-subtle-1 bg-surface-1 py-2.5 text-11 whitespace-nowrap focus:outline-none",
                      optionsClassName
                    )}
                    ref={setPopperElement}
                    style={styles.popper}
                    {...attributes.popper}
                  >
                    <div className="mx-2 flex items-center gap-1.5 rounded-sm border border-subtle px-2">
                      <SearchIcon className="h-3.5 w-3.5 text-placeholder" strokeWidth={1.5} />
                      <Combobox.Input
                        className="w-full bg-transparent py-1 text-11 text-secondary placeholder:text-placeholder focus:outline-none"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search"
                        displayValue={(assigned: any) => assigned?.name}
                      />
                    </div>
                    <div
                      className={cn("vertical-scrollbar mt-2 scrollbar-xs space-y-1 overflow-y-scroll px-2", {
                        "max-h-96": maxHeight === "2xl",
                        "max-h-80": maxHeight === "xl",
                        "max-h-60": maxHeight === "lg",
                        "max-h-48": maxHeight === "md",
                        "max-h-36": maxHeight === "rg",
                        "max-h-28": maxHeight === "sm",
                      })}
                    >
                      {filteredOptions ? (
                        filteredOptions.length > 0 ? (
                          filteredOptions.map((option) => (
                            <Combobox.Option
                              key={option.value}
                              value={option.value}
                              className={({ active }) =>
                                cn(
                                  "flex w-full cursor-pointer items-center justify-between gap-2 truncate rounded-sm px-1 py-1.5 select-none",
                                  {
                                    "bg-layer-transparent-hover": active,
                                    "cursor-not-allowed text-placeholder opacity-60": option.disabled,
                                  }
                                )
                              }
                              onClick={() => {
                                if (!multiple) closeDropdown();
                              }}
                              disabled={option.disabled}
                            >
                              {({ selected }) => (
                                <>
                                  <span className="flex-grow truncate">{option.content}</span>
                                  {selected && <CheckIcon className="h-3.5 w-3.5 flex-shrink-0" />}
                                  {option.tooltip && (
                                    <>
                                      {typeof option.tooltip === "string" ? (
                                        <Tooltip tooltipContent={option.tooltip}>
                                          <Info className="h-3.5 w-3.5 flex-shrink-0 cursor-pointer text-secondary" />
                                        </Tooltip>
                                      ) : (
                                        option.tooltip
                                      )}
                                    </>
                                  )}
                                </>
                              )}
                            </Combobox.Option>
                          ))
                        ) : (
                          <p className="px-1.5 py-1 text-placeholder italic">{noResultsMessage}</p>
                        )
                      ) : (
                        <p className="px-1.5 py-1 text-placeholder italic">Loading...</p>
                      )}
                    </div>
                    {footerOption}
                  </div>
                </Combobox.Options>,
                document.body
              )}
          </>
        );
      }}
    </Combobox>
  );
}
