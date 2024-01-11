import React, { useRef, useState } from "react";

// react-popper
import { usePopper } from "react-popper";
// hooks
import { useDropdownKeyDown } from "../hooks/use-dropdown-key-down";
import useOutsideClickDetector from "../hooks/use-outside-click-detector";
// headless ui
import { Listbox } from "@headlessui/react";
// icons
import { Check, ChevronDown } from "lucide-react";
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
    width = "auto",
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

  return (
    <Listbox
      as="div"
      ref={dropdownRef}
      tabIndex={tabIndex}
      value={value}
      onChange={onChange}
      className={`relative flex-shrink-0 text-left ${className}`}
      onKeyDown={handleKeyDown}
      disabled={disabled}
    >
      <>
        {customButton ? (
          <Listbox.Button as={React.Fragment}>
            <button
              ref={setReferenceElement}
              type="button"
              className={`flex items-center justify-between gap-1 text-xs ${
                disabled ? "cursor-not-allowed text-custom-text-200" : "cursor-pointer hover:bg-custom-background-80"
              } ${customButtonClassName}`}
              onClick={openDropdown}
            >
              {customButton}
            </button>
          </Listbox.Button>
        ) : (
          <Listbox.Button as={React.Fragment}>
            <button
              ref={setReferenceElement}
              type="button"
              className={`flex w-full items-center justify-between gap-1 rounded border-[0.5px] border-custom-border-300 ${
                input ? "px-3 py-2 text-sm" : "px-2 py-1 text-xs"
              } ${
                disabled ? "cursor-not-allowed text-custom-text-200" : "cursor-pointer hover:bg-custom-background-80"
              } ${buttonClassName}`}
              onClick={openDropdown}
            >
              {label}
              {!noChevron && !disabled && <ChevronDown className="h-3 w-3" aria-hidden="true" />}
            </button>
          </Listbox.Button>
        )}
      </>
      {isOpen && (
        <Listbox.Options static>
          <div
            className={`z-10 my-1 overflow-y-auto rounded-md border border-custom-border-300 bg-custom-background-90 text-xs shadow-custom-shadow-rg focus:outline-none ${
              maxHeight === "lg"
                ? "max-h-60"
                : maxHeight === "md"
                  ? "max-h-48"
                  : maxHeight === "rg"
                    ? "max-h-36"
                    : maxHeight === "sm"
                      ? "max-h-28"
                      : ""
            } ${width === "auto" ? "min-w-[8rem] whitespace-nowrap" : width} ${optionsClassName}`}
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
          >
            <div className="space-y-1 p-2">{children}</div>
          </div>
        </Listbox.Options>
      )}
    </Listbox>
  );
};

const Option = (props: ICustomSelectItemProps) => {
  const { children, value, className } = props;
  return (
    <Listbox.Option
      value={value}
      className={({ active, selected }) =>
        `cursor-pointer select-none truncate rounded px-1 py-1.5 ${
          active || selected ? "bg-custom-background-80" : ""
        } ${selected ? "text-custom-text-100" : "text-custom-text-200"} ${className}`
      }
    >
      {({ selected }) => (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">{children}</div>
          {selected && <Check className="h-4 w-4 flex-shrink-0" />}
        </div>
      )}
    </Listbox.Option>
  );
};

CustomSelect.Option = Option;

export { CustomSelect };
