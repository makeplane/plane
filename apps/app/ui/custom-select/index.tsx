import React from "react";
// headless ui
import { Listbox, Transition } from "@headlessui/react";
// icons
import { ChevronDownIcon } from "@heroicons/react/20/solid";

type CustomSelectProps = {
  value: any;
  onChange: (props: any) => void;
  children: React.ReactNode;
  label: string | JSX.Element;
  textAlignment?: "left" | "center" | "right";
  width?: "auto" | string;
};

const CustomSelect = ({
  children,
  label,
  textAlignment,
  value,
  onChange,
  width = "auto",
}: CustomSelectProps) => {
  return (
    <Listbox
      as="div"
      value={value}
      onChange={onChange}
      className="relative text-left flex-shrink-0"
    >
      <div>
        <Listbox.Button
          className={`flex justify-between items-center gap-1 hover:bg-gray-100 border rounded-md shadow-sm px-2 w-full py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs duration-300 ${
            textAlignment === "right"
              ? "text-right"
              : textAlignment === "center"
              ? "text-center"
              : "text-left"
          }`}
        >
          {label}
          <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />
        </Listbox.Button>
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
          className={`absolute right-0 z-10 mt-1 origin-top-right rounded-md bg-white text-xs shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${
            width === "auto" ? "min-w-full whitespace-nowrap" : "w-56"
          }`}
        >
          <div className="py-1">{children}</div>
        </Listbox.Options>
      </Transition>
    </Listbox>
  );
};

type OptionProps = {
  children: string | JSX.Element;
  value: string;
  className?: string;
};

const Option: React.FC<OptionProps> = ({ children, value, className }) => {
  return (
    <Listbox.Option
      value={value}
      className={({ active, selected }) =>
        `${
          active || selected ? "bg-indigo-50" : ""
        } flex items-center gap-2 text-gray-900 cursor-pointer select-none relative p-2 truncate ${className}`
      }
    >
      {children}
    </Listbox.Option>
  );
};

CustomSelect.Option = Option;

export default CustomSelect;
