import React from "react";
// headless ui
import { Listbox, Transition } from "@headlessui/react";
// icons
import { ChevronDownIcon } from "@heroicons/react/20/solid";

type CustomSelectProps = {
  value: any;
  onChange: any;
  children: React.ReactNode;
  label?: string | JSX.Element;
  textAlignment?: "left" | "center" | "right";
  maxHeight?: "sm" | "rg" | "md" | "lg" | "none";
  width?: "auto" | string;
  input?: boolean;
  noChevron?: boolean;
  customButton?: JSX.Element;
  optionsClassName?: string;
  disabled?: boolean;
  selfPositioned?: boolean;
};

const CustomSelect = ({
  children,
  label,
  textAlignment,
  value,
  onChange,
  maxHeight = "none",
  width = "auto",
  input = false,
  noChevron = false,
  customButton,
  optionsClassName = "",
  disabled = false,
  selfPositioned = false,
}: CustomSelectProps) => (
  <Listbox
    as="div"
    value={value}
    onChange={onChange}
    className={`${!selfPositioned ? "relative" : ""} flex-shrink-0 text-left`}
    disabled={disabled}
  >
    <div>
      {customButton ? (
        <Listbox.Button as="div">{customButton}</Listbox.Button>
      ) : (
        <Listbox.Button
          className={`flex w-full ${
            disabled ? "cursor-not-allowed" : "cursor-pointer hover:bg-gray-100"
          } items-center justify-between gap-1 rounded-md border shadow-sm duration-300 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
            input ? "border-gray-300 px-3 py-2 text-sm" : "px-2 py-1 text-xs"
          } ${
            textAlignment === "right"
              ? "text-right"
              : textAlignment === "center"
              ? "text-center"
              : "text-left"
          }`}
        >
          {label}
          {!noChevron && !disabled && <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />}
        </Listbox.Button>
      )}
    </div>

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
        className={`${optionsClassName} absolute right-0 z-10 mt-1 origin-top-right overflow-y-auto rounded-md bg-white text-xs shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${
          width === "auto" ? "min-w-full whitespace-nowrap" : width
        } ${input ? "max-h-48" : ""} ${
          maxHeight === "lg"
            ? "max-h-60"
            : maxHeight === "md"
            ? "max-h-48"
            : maxHeight === "rg"
            ? "max-h-36"
            : maxHeight === "sm"
            ? "max-h-28"
            : ""
        }`}
      >
        <div className="py-1">{children}</div>
      </Listbox.Options>
    </Transition>
  </Listbox>
);

type OptionProps = {
  children: string | JSX.Element;
  value: any;
  className?: string;
};

const Option: React.FC<OptionProps> = ({ children, value, className }) => (
  <Listbox.Option
    value={value}
    className={({ active, selected }) =>
      `${className} ${active || selected ? "bg-indigo-50" : ""} ${
        selected ? "font-medium" : ""
      } relative flex cursor-pointer select-none items-center gap-2 truncate p-2 text-gray-900`
    }
  >
    {children}
  </Listbox.Option>
);

CustomSelect.Option = Option;

export { CustomSelect };
