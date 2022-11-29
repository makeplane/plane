import React, { useState } from "react";
// headless ui
import { Transition, Combobox } from "@headlessui/react";
// common
import { classNames } from "constants/common";
// types
import type { Props } from "./types";

const SearchListbox: React.FC<Props> = ({
  display,
  options,
  onChange,
  value,
  multiple: canSelectMultiple,
}) => {
  const [query, setQuery] = useState("");

  const filteredOptions =
    query === ""
      ? options
      : options.filter((option) => option.name.toLowerCase().includes(query.toLowerCase()));

  const props: any = {
    value,
    onChange,
  };

  if (canSelectMultiple) {
    props.value = props.value ?? [];
    props.onChange = (value: string[]) => {
      onChange(value);
    };
    props.multiple = true;
  }

  return (
    <div className="flex flex-nowrap justify-end space-x-2 py-2 px-2 sm:px-3">
      <Combobox as="div" {...props} className="flex-shrink-0">
        {({ open }: any) => (
          <>
            <Combobox.Label className="sr-only"> {display} </Combobox.Label>
            <div className="relative">
              <Combobox.Button className="relative inline-flex items-center whitespace-nowrap rounded-full bg-gray-50 py-2 px-2 text-sm font-medium text-gray-500 hover:bg-gray-100 sm:px-3">
                <span
                  className={classNames(
                    value === null || value === undefined ? "" : "text-gray-900",
                    "hidden truncate sm:ml-2 sm:block"
                  )}
                >
                  {value
                    ? options.find((option) => option.value === value)?.name ?? "None"
                    : `Select ${display}`}
                </span>
              </Combobox.Button>

              <Transition
                show={open}
                as={React.Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Combobox.Options className="absolute right-0 z-10 mt-1 max-h-56 w-52 px-1 py-1 overflow-auto rounded-lg bg-white text-base shadow ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                  <Combobox.Input
                    className="w-full bg-transparent border-b py-2 pl-3 mb-1 focus:outline-none sm:text-sm"
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search"
                    displayValue={(assigned: any) => assigned?.name}
                  />
                  {filteredOptions.length > 0 ? (
                    filteredOptions.map((option) => (
                      <Combobox.Option
                        key={option.value}
                        className={({ active }) =>
                          classNames(
                            active ? "bg-gray-50" : "bg-white",
                            "relative rounded cursor-default select-none py-2 px-3"
                          )
                        }
                        value={option.value}
                      >
                        <div className="flex items-center">
                          <span className="ml-3 block truncate font-medium">{option.name}</span>
                        </div>
                      </Combobox.Option>
                    ))
                  ) : (
                    <div className="text-center text-gray-400 m-1 mt-0">No results found</div>
                  )}
                </Combobox.Options>
              </Transition>
            </div>
          </>
        )}
      </Combobox>
    </div>
  );
};

export default SearchListbox;
