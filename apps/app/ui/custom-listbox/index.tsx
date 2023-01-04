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
    <Listbox as="div" className="relative" value={value} onChange={onChange} multiple={multiple}>
      {({ open }) => (
        <>
          {label && (
            <Listbox.Label>
              <div className="mb-2 text-gray-500">{label}</div>
            </Listbox.Label>
          )}
          <Listbox.Button
            className={`flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-xs shadow-sm duration-300 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500
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
              className={`absolute mt-1 max-h-32 overflow-y-auto whitespace-nowrap bg-white shadow-lg ${
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
                  : width === "w-full"
                  ? "w-full"
                  : "min-w-full"
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
              } z-10 rounded-md py-1 ring-1 ring-black ring-opacity-5 focus:outline-none`}
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
                          } relative cursor-pointer select-none p-2 text-gray-900`
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
                                  className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
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
                    <p className="text-center text-sm text-gray-500">No options</p>
                  )
                ) : (
                  <p className="text-center text-sm text-gray-500">Loading...</p>
                )}
              </div>
              {footerOption ?? null}
            </Listbox.Options>
          </Transition>
        </>
      )}
    </Listbox>
  );
};

export default CustomListbox;
