import React, { useRef, useState } from "react";
import { usePopper } from "react-popper";
import { Combobox } from "@headlessui/react";
import { Check, ChevronDown, Info, Search } from "lucide-react";
import { createPortal } from "react-dom";
// plane helpers
import { useOutsideClickDetector } from "@plane/hooks";
// hooks
import { useDropdownKeyDown } from "../hooks/use-dropdown-key-down";
// helpers
import { cn } from "../../helpers";
// types
import { ICustomSearchSelectProps } from "./helper";
// local components
import { Tooltip } from "../tooltip";

export const CustomSearchSelect = (props: ICustomSearchSelectProps) => {
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
  } = props;
  const [query, setQuery] = useState("");

  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
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
                  className={`flex w-full items-center justify-between gap-1 text-xs ${
                    disabled
                      ? "cursor-not-allowed text-custom-text-200"
                      : "cursor-pointer hover:bg-custom-background-80"
                  }  ${customButtonClassName}`}
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
                    "flex w-full items-center justify-between gap-1 rounded border-[0.5px] border-custom-border-300",
                    {
                      "px-3 py-2 text-sm": input,
                      "px-2 py-1 text-xs": !input,
                      "cursor-not-allowed text-custom-text-200": disabled,
                      "cursor-pointer hover:bg-custom-background-80": !disabled,
                    },
                    buttonClassName
                  )}
                  onClick={toggleDropdown}
                >
                  {label}
                  {!noChevron && !disabled && (
                    <ChevronDown className={cn("h-3 w-3 flex-shrink-0", chevronClassName)} aria-hidden="true" />
                  )}
                </button>
              </Combobox.Button>
            )}
            {isOpen &&
              createPortal(
                <Combobox.Options data-prevent-outside-click static>
                  <div
                    className={cn(
                      "my-1 overflow-y-scroll rounded-md border-[0.5px] border-custom-border-300 bg-custom-background-100 px-2 py-2.5 text-xs shadow-custom-shadow-rg focus:outline-none min-w-48 whitespace-nowrap z-20",
                      optionsClassName
                    )}
                    ref={setPopperElement}
                    style={styles.popper}
                    {...attributes.popper}
                  >
                    <div className="flex items-center gap-1.5 rounded border border-custom-border-100 bg-custom-background-90 px-2">
                      <Search className="h-3.5 w-3.5 text-custom-text-400" strokeWidth={1.5} />
                      <Combobox.Input
                        className="w-full bg-transparent py-1 text-xs text-custom-text-200 placeholder:text-custom-text-400 focus:outline-none"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search"
                        displayValue={(assigned: any) => assigned?.name}
                      />
                    </div>
                    <div
                      className={cn("mt-2 space-y-1 overflow-y-scroll", {
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
                                  "w-full truncate flex items-center justify-between gap-2 rounded px-1 py-1.5 cursor-pointer select-none",
                                  {
                                    "bg-custom-background-80": active,
                                    "text-custom-text-400 opacity-60 cursor-not-allowed": option.disabled,
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
                                  {selected && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
                                  {option.tooltip && (
                                    <>
                                      {typeof option.tooltip === "string" ? (
                                        <Tooltip tooltipContent={option.tooltip}>
                                          <Info className="h-3.5 w-3.5 flex-shrink-0 cursor-pointer text-custom-text-200" />
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
                          <p className="text-custom-text-400 italic py-1 px-1.5">No matches found</p>
                        )
                      ) : (
                        <p className="text-custom-text-400 italic py-1 px-1.5">Loading...</p>
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
};
