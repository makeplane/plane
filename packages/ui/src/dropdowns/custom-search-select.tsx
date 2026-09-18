/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Combobox } from "@headlessui/react";
import { ChevronDownOutline, InfoOutline, SearchOutline, TickOutline } from "@makeplane/propel/icons";
import React, { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePopper } from "react-popper";
import { useOutsideClickDetector } from "@plane/hooks";
// plane imports
// local imports
import { Tooltip } from "@plane/propel/tooltip";
import { useDropdownKeyDown } from "../hooks/use-dropdown-key-down";
import { cn } from "../utils";
import type { ICustomSearchSelectProps } from "./helper";

export function CustomSearchSelect(props: ICustomSearchSelectProps) {
  const {
    ariaLabel,
    customButtonClassName = "",
    buttonClassName = "",
    className = "",
    chevronClassName = "",
    customButton,
    customButtonPrefix,
    customButtonRef,
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
  } = props;
  const [query, setQuery] = useState("");

  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLElement | null>(null);
  const [isOpen, setIsOpen] = useState(defaultOpen);
  // refs
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: placement ?? "bottom-start",
  });

  const filteredOptions =
    query === "" ? options : options?.filter((option) => option.query.toLowerCase().includes(query.toLowerCase()));

  const comboboxProps: any = {
    value,
    onChange,
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
    onClose?.();
  };

  const handleKeyDown = useDropdownKeyDown(openDropdown, closeDropdown, isOpen);
  useOutsideClickDetector(dropdownRef, closeDropdown);

  const toggleDropdown = () => {
    if (isOpen) closeDropdown();
    else openDropdown();
  };

  return (
    // oxlint-disable-next-line jsx_a11y/no-static-element-interactions
    <Combobox
      as="div"
      ref={dropdownRef}
      tabIndex={tabIndex}
      className={cn("relative flex-shrink-0 text-left", { flex: customButtonPrefix }, className)}
      onKeyDown={handleKeyDown}
      {...comboboxProps}
    >
      {({ open }: { open: boolean }) => {
        if (open && onOpen) onOpen();

        return (
          <>
            {customButton ? (
              <>
                {customButtonPrefix}
                <Combobox.Button as={React.Fragment}>
                  <button
                    ref={(element) => {
                      setReferenceElement(element);
                      if (typeof customButtonRef === "function") customButtonRef(element);
                      else if (customButtonRef) customButtonRef.current = element;
                    }}
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
                    aria-label={ariaLabel}
                  >
                    {customButton}
                  </button>
                </Combobox.Button>
              </>
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
                  aria-label={ariaLabel}
                >
                  {label}
                  {!noChevron && !disabled && (
                    <ChevronDownOutline className={cn("h-3 w-3 flex-shrink-0", chevronClassName)} aria-hidden="true" />
                  )}
                </button>
              </Combobox.Button>
            )}
            {isOpen &&
              createPortal(
                <Combobox.Options
                  as="ul"
                  data-prevent-outside-click
                  static
                  className="z-30"
                  ref={setPopperElement}
                  style={styles.popper}
                  {...attributes.popper}
                >
                  <div
                    className={cn(
                      "my-1 min-w-48 overflow-y-scroll rounded-md border-[0.5px] border-subtle-1 bg-surface-1 py-2.5 text-11 whitespace-nowrap focus:outline-none",
                      optionsClassName
                    )}
                  >
                    <div className="mx-2 flex items-center gap-1.5 rounded-sm border border-subtle px-2">
                      <SearchOutline className="h-3.5 w-3.5 text-placeholder" />
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
                            // Headless UI supplies the option's keyboard semantics.
                            // oxlint-disable-next-line jsx_a11y/click-events-have-key-events
                            <Combobox.Option
                              as="li"
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
                                  {selected && <TickOutline className="h-3.5 w-3.5 flex-shrink-0" />}
                                  {option.tooltip && (
                                    <>
                                      {typeof option.tooltip === "string" ? (
                                        <Tooltip tooltipContent={option.tooltip}>
                                          <InfoOutline className="h-3.5 w-3.5 flex-shrink-0 cursor-pointer text-secondary" />
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
