/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Combobox } from "@headlessui/react";
import { sortBy } from "lodash-es";
import React, { useMemo, useRef, useState } from "react";
// plane imports
import { useOutsideClickDetector } from "@plane/hooks";
// local imports
import { DropdownPanel } from "../dropdowns/dropdown-panel";
import { useDropdownKeyPressed } from "../hooks/use-dropdown-key-pressed";
import { cn } from "../utils";
import { DropdownButton } from "./common";
import { DropdownOptions } from "./common/options";
import type { ISingleSelectDropdown } from "./dropdown";

export function Dropdown(props: ISingleSelectDropdown) {
  const {
    value,
    onChange,
    options,
    onOpen,
    onClose,
    containerClassName,
    tabIndex,
    placement,
    disabled,
    buttonContent,
    buttonContainerClassName,
    buttonClassName,
    disableSearch,
    inputPlaceholder,
    inputClassName,
    inputIcon,
    inputContainerClassName,
    keyExtractor,
    optionsContainerClassName,
    queryArray,
    sortByKey,
    firstItem,
    renderItem,
    loader = false,
    disableSorting,
  } = props;

  // states
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  // refs
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  // dropdown panel anchor
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);

  // handlers
  const toggleDropdown = () => {
    if (!isOpen) onOpen?.();
    setIsOpen((prevIsOpen) => !prevIsOpen);
    if (isOpen) onClose?.();
  };

  const handleOnClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    e.preventDefault();
    toggleDropdown();
  };

  const handleClose = () => {
    if (!isOpen) return;
    setIsOpen(false);
    onClose?.();
    setQuery?.("");
  };

  // options
  const sortedOptions = useMemo(() => {
    if (!options) return undefined;

    const filteredOptions = queryArray
      ? (options || []).filter((options) => {
          const queryString = queryArray.map((query) => options.data[query]).join(" ");
          return queryString.toLowerCase().includes(query.toLowerCase());
        })
      : options;

    if (disableSorting || !sortByKey) return filteredOptions;

    return sortBy(filteredOptions, [
      (option) => firstItem && firstItem(option.data[option.value]),
      (option) => !(value ?? []).includes(option.data[option.value]),
      () => sortByKey && sortByKey.toLowerCase(),
    ]);
  }, [query, options]);

  // hooks
  const handleKeyDown = useDropdownKeyPressed(toggleDropdown, handleClose);

  useOutsideClickDetector(dropdownRef, handleClose, true);

  return (
    <Combobox
      as="div"
      ref={dropdownRef}
      value={value}
      // Headless UI v2 widens a non-multiple Combobox to `T | null`. v1 never emitted
      // null, so drop it here and keep this component's non-nullable onChange contract.
      onChange={(selected) => {
        if (selected !== null) onChange(selected);
      }}
      className={cn(
        "h-full",
        typeof containerClassName === "function" ? containerClassName(isOpen) : containerClassName
      )}
      tabIndex={tabIndex}
      onKeyDown={handleKeyDown}
      disabled={disabled}
    >
      <DropdownButton
        value={value}
        isOpen={isOpen}
        setReferenceElement={setReferenceElement}
        handleOnClick={handleOnClick}
        buttonContent={buttonContent}
        buttonClassName={buttonClassName}
        buttonContainerClassName={buttonContainerClassName}
        disabled={disabled}
      />
      <DropdownPanel open={isOpen} reference={referenceElement} placement={placement}>
        <Combobox.Options
          as="ul"
          className={cn(
            "w-48 rounded-sm border-[0.5px] border-strong bg-surface-1 px-2 py-2 text-11 shadow-raised-200 focus:outline-none",
            optionsContainerClassName
          )}
          static
        >
          <DropdownOptions
            isOpen={isOpen}
            query={query}
            setQuery={setQuery}
            inputIcon={inputIcon}
            inputPlaceholder={inputPlaceholder}
            inputClassName={inputClassName}
            inputContainerClassName={inputContainerClassName}
            disableSearch={disableSearch}
            keyExtractor={keyExtractor}
            options={sortedOptions}
            value={value}
            renderItem={renderItem}
            loader={loader}
            handleClose={handleClose}
          />
        </Combobox.Options>
      </DropdownPanel>
    </Combobox>
  );
}
