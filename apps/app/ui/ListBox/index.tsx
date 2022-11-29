import React from "react";
// headless ui
import { Listbox } from "@headlessui/react";
// icons
import { ChevronDownIcon } from "@heroicons/react/24/outline";
// types
type Props = {
  value: any;
  placeholder: string | JSX.Element;
  className?: string;
  theme?: "white" | "purple";
  onChange: (value: any) => void;
  icon?: () => React.ReactNode;
  children: React.ReactNode;
};

const ListBox: React.FC<Props> = ({
  value,
  onChange,
  placeholder,
  icon,
  children,
  className,
  theme,
}) => {
  return (
    <div className="relative">
      <Listbox value={value} onChange={onChange}>
        <Listbox.Button
          className={`p-2 rounded flex items-center gap-x-2 ${
            theme === "white"
              ? "bg-white border border-gray-200"
              : "bg-purple-200"
          } ${className ? className : ""}`}
        >
          {icon && icon()}
          <p className="font-semibold">{placeholder}</p>
          <div className="flex-grow flex justify-end">
            <ChevronDownIcon width="20" height="20" />
          </div>
        </Listbox.Button>
        <Listbox.Options className="absolute mt-1 w-full bg-white border border-gray-300 flex flex-col gap-y-2 py-3 z-50">
          {children}
        </Listbox.Options>
      </Listbox>
    </div>
  );
};

export { Listbox };

export default ListBox;
