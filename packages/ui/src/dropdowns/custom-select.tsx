import { Combobox } from "@headlessui/react";
import { Check } from "lucide-react";
import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePopper } from "react-popper";
import { useOutsideClickDetector } from "@plane/hooks";
import { ChevronDownIcon } from "@plane/propel/icons";
// plane helpers
// hooks
import { useDropdownKeyDown } from "../hooks/use-dropdown-key-down";
// helpers
import { cn } from "../utils";
// types
import type { ICustomSelectItemProps, ICustomSelectProps } from "./helper";

// Context to share the close handler with option components
const DropdownContext = createContext<() => void>(() => {});

function CustomSelect(props: ICustomSelectProps) {
  const {
    customButtonClassName = "",
    buttonClassName = "",
    placement,
    children,
    className = "",
    customButton,
    disabled = false,
    input = false,
    label,
    maxHeight = "md",
    noChevron = false,
    onChange,
    optionsClassName = "",
    value,
    tabIndex,
  } = props;
  // states
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  // refs
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: placement ?? "bottom-start",
  });

  const openDropdown = useCallback(() => {
    setIsOpen(true);
    if (referenceElement) referenceElement.focus();
  }, [referenceElement]);

  const closeDropdown = useCallback(() => setIsOpen(false), []);
  const handleKeyDown = useDropdownKeyDown(openDropdown, closeDropdown, isOpen);
  useOutsideClickDetector(dropdownRef, closeDropdown);

  const toggleDropdown = useCallback(() => {
    if (isOpen) closeDropdown();
    else openDropdown();
  }, [closeDropdown, isOpen, openDropdown]);

  return (
    <DropdownContext.Provider value={closeDropdown}>
      <Combobox
        as="div"
        ref={dropdownRef}
        tabIndex={tabIndex}
        value={value}
        onChange={(val) => {
          onChange?.(val);
          closeDropdown();
        }}
        className={cn("relative flex-shrink-0 text-left", className)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      >
        <>
          {customButton ? (
            <Combobox.Button as={React.Fragment}>
              <button
                ref={setReferenceElement}
                type="button"
                className={`flex items-center justify-between gap-1 text-xs rounded ${
                  disabled ? "cursor-not-allowed text-custom-text-200" : "cursor-pointer hover:bg-custom-background-80"
                } ${customButtonClassName}`}
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
                {!noChevron && !disabled && <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />}
              </button>
            </Combobox.Button>
          )}
        </>
        {isOpen &&
          createPortal(
            <Combobox.Options data-prevent-outside-click>
              <div
                className={cn(
                  "my-1 overflow-y-scroll rounded-md border-[0.5px] border-custom-border-300 bg-custom-background-100 px-2 py-2.5 text-xs shadow-custom-shadow-rg focus:outline-none min-w-48 whitespace-nowrap z-30",
                  optionsClassName
                )}
                ref={setPopperElement}
                style={styles.popper}
                {...attributes.popper}
              >
                <div
                  className={cn("space-y-1 overflow-y-scroll", {
                    "max-h-60": maxHeight === "lg",
                    "max-h-48": maxHeight === "md",
                    "max-h-36": maxHeight === "rg",
                    "max-h-28": maxHeight === "sm",
                  })}
                >
                  {children}
                </div>
              </div>
            </Combobox.Options>,
            document.body
          )}
      </Combobox>
    </DropdownContext.Provider>
  );
}

function Option(props: ICustomSelectItemProps) {
  const { children, value, className } = props;
  const closeDropdown = useContext(DropdownContext);

  const handleClick = useCallback(() => {
    // Close dropdown for both new and already-selected options.
    // Use setTimeout to ensure HeadlessUI's onChange handler fires first for new selections.
    // For already-selected options, this ensures the dropdown closes since onChange won't fire.
    setTimeout(() => {
      closeDropdown();
    }, 0);
  }, [closeDropdown]);

  return (
    <Combobox.Option
      value={value}
      className={({ active }) =>
        cn(
          "cursor-pointer select-none truncate rounded px-1 py-1.5 text-custom-text-200 flex items-center justify-between gap-2",
          {
            "bg-custom-background-80": active,
          },
          className
        )
      }
      onClick={handleClick}
    >
      {({ selected }) => (
        <div className="flex items-center justify-between gap-2 w-full">
          {children}
          {selected && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
        </div>
      )}
    </Combobox.Option>
  );
}

CustomSelect.Option = Option;

export { CustomSelect };
