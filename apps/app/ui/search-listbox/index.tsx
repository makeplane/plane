import React, { useState } from "react";
// headless ui
import { Transition, Combobox } from "@headlessui/react";
// common
import { classNames } from "constants/common";
// types
import type { Props } from "./types";

const SearchListbox: React.FC<Props> = ({
  title,
  options,
  onChange,
  value,
  multiple: canSelectMultiple,
  icon,
  width = "sm",
  optionsFontsize,
  buttonClassName,
  optionsClassName,
}) => {
  const [query, setQuery] = useState("");

  const filteredOptions =
    query === ""
      ? options
      : options?.filter((option) => option.display.toLowerCase().includes(query.toLowerCase()));

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
    <Combobox as="div" {...props} className="relative flex-shrink-0">
      {({ open }: any) => (
        <>
          <Combobox.Label className="sr-only">{title}</Combobox.Label>
          <Combobox.Button
            className={`flex items-center gap-1 hover:bg-gray-100 border rounded-md shadow-sm px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm duration-300 ${
              buttonClassName || ""
            }`}
          >
            {icon ?? null}
            <span
              className={classNames(
                value === null || value === undefined ? "" : "text-gray-900",
                "hidden truncate sm:block"
              )}
            >
              {Array.isArray(value)
                ? value
                    .map((v) => options?.find((option) => option.value === v)?.display)
                    .join(", ") || title
                : options?.find((option) => option.value === value)?.display || title}
            </span>
          </Combobox.Button>

          <Transition
            show={open}
            as={React.Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Combobox.Options
              className={`absolute z-10 mt-1 bg-white shadow-lg rounded-md py-1 ring-1 ring-black ring-opacity-5 focus:outline-none max-h-32 overflow-auto ${
                width === "xs"
                  ? "w-20"
                  : width === "sm"
                  ? "w-32"
                  : width === "md"
                  ? "w-48"
                  : width === "lg"
                  ? "w-64"
                  : width === "xl"
                  ? "w-80"
                  : width === "2xl"
                  ? "w-96"
                  : ""
              }} ${
                optionsFontsize === "sm"
                  ? "text-xs"
                  : optionsFontsize === "md"
                  ? "text-base"
                  : optionsFontsize === "lg"
                  ? "text-lg"
                  : optionsFontsize === "xl"
                  ? "text-xl"
                  : optionsFontsize === "2xl"
                  ? "text-2xl"
                  : ""
              } ${optionsClassName || ""}`}
            >
              <Combobox.Input
                className="w-full bg-transparent border-b p-2 focus:outline-none text-xs"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search"
                displayValue={(assigned: any) => assigned?.name}
              />
              <div className="py-1">
                {filteredOptions ? (
                  filteredOptions.length > 0 ? (
                    filteredOptions.map((option) => (
                      <Combobox.Option
                        key={option.value}
                        className={({ active }) =>
                          `${
                            active ? "bg-indigo-50" : ""
                          } cursor-pointer select-none truncate text-gray-900 p-2`
                        }
                        value={option.value}
                      >
                        {option.element ?? option.display}
                      </Combobox.Option>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No {title.toLowerCase()} found</p>
                  )
                ) : (
                  <p className="text-sm text-gray-500">Loading...</p>
                )}
              </div>
            </Combobox.Options>
          </Transition>
        </>
      )}
    </Combobox>
  );
};

export default SearchListbox;
