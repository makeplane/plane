import React, { FC, useMemo, useRef, useState } from "react";
import sortBy from "lodash/sortBy";
// headless ui
import { Combobox } from "@headlessui/react";
// popper-js
import { usePopper } from "react-popper";
// plane helpers
import { useOutsideClickDetector } from "@plane/hooks";
// components
import { DropdownButton } from "./common";
import { DropdownOptions } from "./common/options";
// hooks
import { useDropdownKeyPressed } from "../hooks/use-dropdown-key-pressed";
// helper
import { cn } from "../../helpers";
// types
import { IMultiSelectDropdown } from "./dropdown";

export const MultiSelectDropdown: FC<IMultiSelectDropdown> = (props) => {
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
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  // refs
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  // popper-js refs
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);

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

    if (disableSorting) return filteredOptions;

    return sortBy(filteredOptions, [
      (option) => firstItem && firstItem(option.data[option.value]),
      (option) => !(value ?? []).includes(option.data[option.value]),
      () => sortByKey && sortByKey.toLowerCase(),
    ]);
  }, [query, options]);

  // hooks
  const handleKeyDown = useDropdownKeyPressed(toggleDropdown, handleClose);

  useOutsideClickDetector(dropdownRef, handleClose);

  return (
    <Combobox
      as="div"
      ref={dropdownRef}
      value={value}
      onChange={onChange}
      className={cn("h-full", containerClassName)}
      tabIndex={tabIndex}
      multiple
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

      {isOpen && (
        <Combobox.Options className="fixed z-10" static>
          <div
            className={cn(
              "my-1 w-48 rounded border-[0.5px] border-custom-border-300 bg-custom-background-100 px-2 py-2.5 text-xs shadow-custom-shadow-rg focus:outline-none",
              optionsContainerClassName
            )}
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
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
            />
          </div>
        </Combobox.Options>
      )}
    </Combobox>
  );
};
