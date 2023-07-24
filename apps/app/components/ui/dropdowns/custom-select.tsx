import React from "react";

// headless ui
import { Listbox, Transition } from "@headlessui/react";
// icons
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { CheckIcon } from "@heroicons/react/24/outline";
// types
import { DropdownProps } from "./types";

export type CustomSelectProps = DropdownProps & {
  children: React.ReactNode;
  value: any;
  onChange: any;
};

const CustomSelect = ({
  buttonClassName = "",
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
  position = "left",
  selfPositioned = false,
  value,
  verticalPosition = "bottom",
  width = "auto",
}: CustomSelectProps) => (
  <Listbox
    as="div"
    value={value}
    onChange={onChange}
    className={`${selfPositioned ? "" : "relative"} flex-shrink-0 text-left ${className}`}
    disabled={disabled}
  >
    <>
      {customButton ? (
        <Listbox.Button as="div">{customButton}</Listbox.Button>
      ) : (
        <Listbox.Button
          className={`flex items-center justify-between gap-1 w-full rounded-md border border-custom-border-300 shadow-sm duration-300 focus:outline-none ${
            input ? "px-3 py-2 text-sm" : "px-2.5 py-1 text-xs"
          } ${
            disabled
              ? "cursor-not-allowed text-custom-text-200"
              : "cursor-pointer hover:bg-custom-background-80"
          } ${buttonClassName}`}
        >
          {label}
          {!noChevron && !disabled && <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />}
        </Listbox.Button>
      )}
    </>

    <Transition
      as={React.Fragment}
      enter="transition ease-out duration-100"
      enterFrom="transform opacity-0 scale-95"
      enterTo="transform opacity-100 scale-100"
      leave="transition ease-in duration-75"
      leaveFrom="transform opacity-100 scale-100"
      leaveTo="transform opacity-0 scale-95"
    >
      <Listbox.Options
        className={`absolute z-10 border border-custom-border-300 mt-1 origin-top-right overflow-y-auto rounded-md bg-custom-background-90 text-xs shadow-lg focus:outline-none ${
          position === "left" ? "left-0 origin-top-left" : "right-0 origin-top-right"
        } ${verticalPosition === "top" ? "bottom-full mb-1" : "mt-1"} ${
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
      >
        <div className="space-y-1 p-2">{children}</div>
      </Listbox.Options>
    </Transition>
  </Listbox>
);

type OptionProps = {
  children: React.ReactNode;
  value: any;
  className?: string;
};

const Option: React.FC<OptionProps> = ({ children, value, className }) => (
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
        {selected && <CheckIcon className="h-4 w-4 flex-shrink-0" />}
      </div>
    )}
  </Listbox.Option>
);

CustomSelect.Option = Option;

export { CustomSelect };
