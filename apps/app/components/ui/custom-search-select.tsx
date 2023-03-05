import React, { useState } from "react";

// headless ui
import { Combobox, Transition } from "@headlessui/react";
// icons
import { CheckIcon, ChevronDownIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";

type CustomSearchSelectProps = {
  value: any;
  onChange: any;
  options: {
    value: any;
    query: string;
    content: JSX.Element;
  }[];
  label?: string | JSX.Element;
  textAlignment?: "left" | "center" | "right";
  position?: "right" | "left";
  noChevron?: boolean;
  customButton?: JSX.Element;
  optionsClassName?: string;
  disabled?: boolean;
  selfPositioned?: boolean;
  multiple?: boolean;
  footerOption?: JSX.Element;
};

export const CustomSearchSelect = ({
  label,
  textAlignment,
  value,
  onChange,
  options,
  position = "left",
  noChevron = false,
  customButton,
  optionsClassName = "",
  disabled = false,
  selfPositioned = false,
  multiple = false,
  footerOption,
}: CustomSearchSelectProps) => {
  const [query, setQuery] = useState("");

  const filteredOptions =
    query === ""
      ? options
      : options?.filter((option) => option.query.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      {/* TODO: Improve this multiple logic */}
      {multiple ? (
        <Combobox
          as="div"
          value={value}
          onChange={onChange}
          className={`${!selfPositioned ? "relative" : ""} flex-shrink-0 text-left`}
          disabled={disabled}
          multiple
        >
          {({ open }: any) => (
            <>
              {customButton ? (
                <Combobox.Button as="div">{customButton}</Combobox.Button>
              ) : (
                <Combobox.Button
                  className={`flex w-full ${
                    disabled ? "cursor-not-allowed" : "cursor-pointer hover:bg-gray-100"
                  } items-center justify-between gap-1 rounded-md border px-3 py-1.5 text-xs shadow-sm duration-300 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                    textAlignment === "right"
                      ? "text-right"
                      : textAlignment === "center"
                      ? "text-center"
                      : "text-left"
                  }`}
                >
                  {label}
                  {!noChevron && !disabled && (
                    <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />
                  )}
                </Combobox.Button>
              )}

              <Transition
                show={open}
                as={React.Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-1"
              >
                <Combobox.Options
                  className={`${optionsClassName} absolute min-w-[10rem] p-2 ${
                    position === "right" ? "right-0" : "left-0"
                  } z-10 mt-1 origin-top-right overflow-y-auto rounded-md bg-white text-xs shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none`}
                >
                  <div className="flex w-full items-center justify-start rounded-sm border-[0.6px] bg-gray-100 px-2">
                    <MagnifyingGlassIcon className="h-3 w-3 text-gray-500" />
                    <Combobox.Input
                      className="w-full  bg-transparent py-1 px-2  text-xs text-gray-500 focus:outline-none"
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Type to search..."
                      displayValue={(assigned: any) => assigned?.name}
                    />
                  </div>
                  <div className="mt-2 space-y-1">
                    {filteredOptions ? (
                      filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => (
                          <Combobox.Option
                            key={option.value}
                            value={option.value}
                            className={({ active, selected }) =>
                              `${active || selected ? "bg-hover-gray" : ""} ${
                                selected ? "font-medium" : ""
                              } flex cursor-pointer select-none items-center justify-between gap-2 truncate rounded px-1 py-1.5 text-gray-500`
                            }
                          >
                            {({ active, selected }) => (
                              <>
                                {option.content}
                                <div
                                  className={`flex items-center justify-center rounded border border-gray-500 p-0.5 ${
                                    active || selected ? "opacity-100" : "opacity-0"
                                  }`}
                                >
                                  <CheckIcon
                                    className={`h-3 w-3 ${selected ? "opacity-100" : "opacity-0"}`}
                                  />
                                </div>
                              </>
                            )}
                          </Combobox.Option>
                        ))
                      ) : (
                        <p className="text-center text-gray-500">No matching results</p>
                      )
                    ) : (
                      <p className="text-center text-gray-500">Loading...</p>
                    )}
                  </div>
                  {footerOption}
                </Combobox.Options>
              </Transition>
            </>
          )}
        </Combobox>
      ) : (
        <Combobox
          as="div"
          value={value}
          onChange={onChange}
          className={`${!selfPositioned ? "relative" : ""} flex-shrink-0 text-left`}
          disabled={disabled}
        >
          {({ open }: any) => (
            <>
              {customButton ? (
                <Combobox.Button as="div">{customButton}</Combobox.Button>
              ) : (
                <Combobox.Button
                  className={`flex w-full ${
                    disabled ? "cursor-not-allowed" : "cursor-pointer hover:bg-gray-100"
                  } items-center justify-between gap-1 rounded-md border px-3 py-1.5 text-xs shadow-sm duration-300 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                    textAlignment === "right"
                      ? "text-right"
                      : textAlignment === "center"
                      ? "text-center"
                      : "text-left"
                  }`}
                >
                  {label}
                  {!noChevron && !disabled && (
                    <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />
                  )}
                </Combobox.Button>
              )}

              <Transition
                show={open}
                as={React.Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-1"
              >
                <Combobox.Options
                  className={`${optionsClassName} absolute min-w-[10rem] p-2 ${
                    position === "right" ? "right-0" : "left-0"
                  } z-10 mt-1 origin-top-right overflow-y-auto rounded-md bg-white text-xs shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none`}
                >
                  <div className="flex w-full items-center justify-start rounded-sm border bg-gray-100 px-2 text-gray-500">
                    <MagnifyingGlassIcon className="h-3 w-3" />
                    <Combobox.Input
                      className="w-full  bg-transparent py-1 px-2 text-xs focus:outline-none"
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Type to search..."
                      displayValue={(assigned: any) => assigned?.name}
                    />
                  </div>
                  <div className="mt-2 space-y-1">
                    {filteredOptions ? (
                      filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => (
                          <Combobox.Option
                            key={option.value}
                            value={option.value}
                            className={({ active, selected }) =>
                              `${active || selected ? "bg-hover-gray" : ""} ${
                                selected ? "font-medium" : ""
                              } flex cursor-pointer select-none items-center justify-between gap-2 truncate rounded px-1 py-1.5 text-gray-500`
                            }
                          >
                            {({ selected }) => (
                              <>
                                {option.content}
                                {selected && <CheckIcon className="h-4 w-4" />}
                              </>
                            )}
                          </Combobox.Option>
                        ))
                      ) : (
                        <p className="text-center text-gray-500">No matching results</p>
                      )
                    ) : (
                      <p className="text-center text-gray-500">Loading...</p>
                    )}
                  </div>
                  {footerOption}
                </Combobox.Options>
              </Transition>
            </>
          )}
        </Combobox>
      )}
    </>
  );
};
