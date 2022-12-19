import React from "react";
// headless ui
import { Listbox, Transition } from "@headlessui/react";
// icons
import { CheckIcon } from "@heroicons/react/20/solid";

import { Props } from "./types";

const CustomListbox: React.FC<Props> = ({
  title = "",
  options,
  value,
  onChange,
  multiple,
  icon,
  width,
  footerOption,
  optionsFontsize,
  className,
  label,
}) => {
  return (
    <Listbox value={value} onChange={onChange} multiple={multiple}>
      {({ open }) => (
        <>
          {label && (
            <Listbox.Label>
              <div className="text-gray-500 mb-2">{label}</div>
            </Listbox.Label>
          )}
          <div className="relative">
            <Listbox.Button
              className={`flex items-center gap-1 hover:bg-gray-100 relative border rounded-md shadow-sm cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm duration-300 ${
                width === "sm"
                  ? "w-32"
                  : width === "md"
                  ? "w-48"
                  : width === "lg"
                  ? "w-64"
                  : width === "xl"
                  ? "w-80"
                  : width === "2xl"
                  ? "w-96"
                  : width === "w-full"
                  ? "w-full"
                  : ""
              }
              ${className || "px-2 py-1"}`}
            >
              {icon ?? null}
              <span className="block truncate">
                {Array.isArray(value)
                  ? value.map((v) => options?.find((o) => o.value === v)?.display).join(", ") ||
                    `${title}`
                  : options?.find((o) => o.value === value)?.display || `${title}`}
              </span>
            </Listbox.Button>

            <Transition
              show={open}
              as={React.Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options
                className={`absolute mt-1 bg-white shadow-lg max-h-32 overflow-auto ${
                  width === "sm"
                    ? "w-32"
                    : width === "md"
                    ? "w-48"
                    : width === "lg"
                    ? "w-64"
                    : width === "xl"
                    ? "w-80"
                    : width === "2xl"
                    ? "w-96"
                    : width === "w-full"
                    ? "w-full"
                    : ""
                } ${
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
                } rounded-md py-1 ring-1 ring-black ring-opacity-5 focus:outline-none z-10`}
              >
                <div className="py-1">
                  {options ? (
                    options.length > 0 ? (
                      options.map((option) => (
                        <Listbox.Option
                          key={option.value}
                          className={({ active }) =>
                            `${
                              active ? "bg-indigo-50" : ""
                            } text-gray-900 cursor-pointer select-none relative p-2`
                          }
                          value={option.value}
                        >
                          {({ selected, active }) => (
                            <>
                              <span
                                className={`${
                                  selected ||
                                  (Array.isArray(value)
                                    ? value.includes(option.value)
                                    : value === option.value)
                                    ? "font-semibold"
                                    : "font-normal"
                                } flex items-center gap-2 truncate`}
                              >
                                {option.color && (
                                  <span
                                    className="flex-shrink-0 h-1.5 w-1.5 rounded-full"
                                    style={{
                                      backgroundColor: option.color,
                                    }}
                                  ></span>
                                )}
                                {option.display}
                              </span>

                              {selected ||
                              (Array.isArray(value)
                                ? value.includes(option.value)
                                : value === option.value) ? (
                                <span
                                  className={`absolute inset-y-0 right-0 flex items-center pr-4 ${
                                    active ||
                                    (Array.isArray(value)
                                      ? value.includes(option.value)
                                      : value === option.value)
                                      ? "text-white"
                                      : "text-theme"
                                  }`}
                                >
                                  <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                </span>
                              ) : null}
                            </>
                          )}
                        </Listbox.Option>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center">No options</p>
                    )
                  ) : (
                    <p className="text-sm text-gray-500 text-center">Loading...</p>
                  )}
                </div>
                {footerOption ?? null}
              </Listbox.Options>
            </Transition>
          </div>
        </>
      )}
    </Listbox>
  );
};

export default CustomListbox;
