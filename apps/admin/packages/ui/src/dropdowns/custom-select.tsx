import { Combobox } from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";
import React, { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePopper } from "react-popper";
// plane helpers
import { useOutsideClickDetector } from "@plane/hooks";
// hooks
import { useDropdownKeyDown } from "../hooks/use-dropdown-key-down";
// helpers
import { cn } from "../utils";
// types
import { ICustomSelectItemProps, ICustomSelectProps } from "./helper";

const CustomSelect = (props: ICustomSelectProps) => {
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

  const openDropdown = () => {
    setIsOpen(true);
    if (referenceElement) referenceElement.focus();
  };
  const closeDropdown = () => setIsOpen(false);
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
      value={value}
      onChange={onChange}
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
              className={`flex items-center justify-between gap-1 text-xs ${
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
              {!noChevron && !disabled && <ChevronDown className="h-3 w-3" aria-hidden="true" />}
            </button>
          </Combobox.Button>
        )}
      </>
      {isOpen &&
        createPortal(
          <Combobox.Options data-prevent-outside-click static>
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
  );
};

const Option = (props: ICustomSelectItemProps) => {
  const { children, value, className } = props;
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
    >
      {({ selected }) => (
        <>
          {children}
          {selected && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
        </>
      )}
    </Combobox.Option>
  );
};

CustomSelect.Option = Option;

export { CustomSelect };
