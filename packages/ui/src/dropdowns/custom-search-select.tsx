/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { Combobox } from "@headlessui/react";
import { SearchIcon, ChevronDownIcon } from "@plane/propel/icons";
import React, { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePopper } from "react-popper";
// plane imports
import { useOutsideClickDetector } from "@plane/hooks";
import { isObject } from "@plane/utils";
// local imports
import { useDropdownKeyDown } from "../hooks/use-dropdown-key-down";
import { cn } from "../utils";
import { FlatOptionsList, GroupedOptionsList, unscopeGroupOptionValue } from "./custom-search-select-options";
import type { ICustomSearchSelectProps } from "./helper";

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
    onOpen,
    onClose,
    optionsClassName = "",
    value,
    tabIndex,
    noResultsMessage = "No matches found",
    defaultOpen = false,
    searchQuery: controlledSearchQuery,
    onSearchQueryChange,
    fetchMoreOptions,
  } = props;
  // states
  const [internalSearchQuery, setInternalSearchQuery] = useState("");
  // derived values
  const searchQuery = controlledSearchQuery !== undefined ? controlledSearchQuery : internalSearchQuery;
  const options = "options" in props ? props.options : undefined;
  const groupedOptions = "groupedOptions" in props ? props.groupedOptions : undefined;

  const setSearchQuery = useCallback(
    (query: string) => {
      if (onSearchQueryChange) {
        onSearchQueryChange(query);
      } else {
        setInternalSearchQuery(query);
      }
    },
    [onSearchQueryChange]
  );

  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(defaultOpen);
  // refs
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: placement ?? "bottom-start",
  });

  const isSearchControlled = controlledSearchQuery !== undefined;

  // When grouped options are used, option values are scoped with a group prefix to avoid
  // cross-group hover/selection collisions. Strip the prefix before forwarding to onChange.
  const handleChange = (val: unknown) => {
    if (!groupedOptions) {
      onChange(val);
      return;
    }
    const unscope = (v: unknown) => (typeof v === "string" ? unscopeGroupOptionValue(v) : v);
    onChange(Array.isArray(val) ? val.map(unscope) : unscope(val));
  };

  const comboboxProps: any = {
    value,
    onChange: handleChange,
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

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el || !fetchMoreOptions) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollTop + clientHeight >= scrollHeight - 20) {
      void fetchMoreOptions();
    }
  }, [fetchMoreOptions]);

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
                  {label}
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
                      "my-1 overflow-y-scroll rounded-md border-[0.5px] border-subtle-1 bg-surface-1 py-2.5 text-11 focus:outline-none min-w-48 whitespace-nowrap z-30",
                      optionsClassName
                    )}
                    ref={setPopperElement}
                    style={styles.popper}
                    {...attributes.popper}
                  >
                    <div className="flex items-center gap-1.5 rounded-sm border border-subtle px-2 mx-2">
                      <SearchIcon className="h-3.5 w-3.5 text-placeholder" strokeWidth={1.5} />
                      <Combobox.Input
                        className="w-full bg-transparent py-1 text-11 text-secondary placeholder:text-placeholder focus:outline-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search"
                        displayValue={(assigned) =>
                          isObject(assigned) && "name" in assigned && typeof assigned.name === "string"
                            ? assigned.name
                            : ""
                        }
                      />
                    </div>
                    <div
                      className={cn("mt-2 px-2 space-y-1 overflow-y-scroll vertical-scrollbar scrollbar-xs", {
                        "max-h-96": maxHeight === "2xl",
                        "max-h-80": maxHeight === "xl",
                        "max-h-60": maxHeight === "lg",
                        "max-h-48": maxHeight === "md",
                        "max-h-36": maxHeight === "rg",
                        "max-h-28": maxHeight === "sm",
                      })}
                      ref={scrollContainerRef}
                      onScroll={handleScroll}
                    >
                      {groupedOptions ? (
                        <GroupedOptionsList
                          groups={groupedOptions}
                          searchQuery={searchQuery}
                          isSearchControlled={isSearchControlled}
                          multiple={!!multiple}
                          closeDropdown={closeDropdown}
                          noResultsMessage={noResultsMessage ?? "No matches found"}
                          comboboxValue={value as string | string[] | null | undefined}
                        />
                      ) : options ? (
                        <FlatOptionsList
                          options={options}
                          searchQuery={searchQuery}
                          isSearchControlled={isSearchControlled}
                          multiple={!!multiple}
                          closeDropdown={closeDropdown}
                          noResultsMessage={noResultsMessage ?? "No matches found"}
                        />
                      ) : (
                        <p className="text-placeholder italic py-1 px-1.5">Loading...</p>
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
