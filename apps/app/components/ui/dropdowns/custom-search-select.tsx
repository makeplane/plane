import React, { useState } from "react";

// headless ui
import { Combobox, Transition } from "@headlessui/react";
// icons
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { CheckIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
// types
import { DropdownProps } from "./types";

export type CustomSearchSelectProps = DropdownProps & {
  footerOption?: JSX.Element;
  onChange: any;
  options:
    | {
        value: any;
        query: string;
        content: React.ReactNode;
      }[]
    | undefined;
} & (
    | { multiple?: false; value: any } // if multiple is false, value can be anything
    | {
        multiple?: true;
        value: any[]; // if multiple is true, value should be an array
      }
  );

export const CustomSearchSelect = ({
  buttonClassName = "",
  className = "",
  customButton,
  disabled = false,
  footerOption,
  input = false,
  label,
  maxHeight = "md",
  multiple = false,
  noChevron = false,
  onChange,
  options,
  optionsClassName = "",
  position = "left",
  selfPositioned = false,
  value,
  verticalPosition = "bottom",
  width = "auto",
}: CustomSearchSelectProps) => {
  const [query, setQuery] = useState("");

  const filteredOptions =
    query === ""
      ? options
      : options?.filter((option) => option.query.toLowerCase().includes(query.toLowerCase()));

  const props: any = {
    value,
    onChange,
    disabled,
  };

  if (multiple) props.multiple = true;

  return (
    <Combobox
      as="div"
      className={`${selfPositioned ? "" : "relative"} flex-shrink-0 text-left ${className}`}
      {...props}
    >
      {({ open }: any) => (
        <>
          {customButton ? (
            <Combobox.Button as="div">{customButton}</Combobox.Button>
          ) : (
            <Combobox.Button
              type="button"
              className={`flex items-center justify-between gap-1 w-full rounded-md shadow-sm border border-custom-border-300 duration-300 focus:outline-none ${
                input ? "px-3 py-2 text-sm" : "px-2.5 py-1 text-xs"
              } ${
                disabled
                  ? "cursor-not-allowed text-custom-text-200"
                  : "cursor-pointer hover:bg-custom-background-80"
              } ${buttonClassName}`}
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
              className={`absolute z-10 min-w-[10rem] border border-custom-border-300 p-2 rounded-md bg-custom-background-90 text-xs shadow-lg focus:outline-none ${
                position === "left" ? "left-0 origin-top-left" : "right-0 origin-top-right"
              } ${verticalPosition === "top" ? "bottom-full mb-1" : "mt-1"} ${
                width === "auto" ? "min-w-[8rem] whitespace-nowrap" : width
              } ${optionsClassName}`}
            >
              <div className="flex w-full items-center justify-start rounded-sm border-[0.6px] border-custom-border-200 bg-custom-background-90 px-2">
                <MagnifyingGlassIcon className="h-3 w-3 text-custom-text-200" />
                <Combobox.Input
                  className="w-full bg-transparent py-1 px-2 text-xs text-custom-text-200 placeholder:text-custom-text-400 focus:outline-none"
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type to search..."
                  displayValue={(assigned: any) => assigned?.name}
                />
              </div>
              <div
                className={`mt-2 space-y-1 ${
                  maxHeight === "lg"
                    ? "max-h-60"
                    : maxHeight === "md"
                    ? "max-h-48"
                    : maxHeight === "rg"
                    ? "max-h-36"
                    : maxHeight === "sm"
                    ? "max-h-28"
                    : ""
                } overflow-y-scroll`}
              >
                {filteredOptions ? (
                  filteredOptions.length > 0 ? (
                    filteredOptions.map((option) => (
                      <Combobox.Option
                        key={option.value}
                        value={option.value}
                        className={({ active, selected }) =>
                          `flex items-center justify-between gap-2 cursor-pointer select-none truncate rounded px-1 py-1.5 ${
                            active || selected ? "bg-custom-background-80" : ""
                          } ${selected ? "text-custom-text-100" : "text-custom-text-200"}`
                        }
                      >
                        {({ active, selected }) => (
                          <>
                            {option.content}
                            {multiple ? (
                              <div
                                className={`flex items-center justify-center rounded border border-custom-border-400 p-0.5 ${
                                  active || selected ? "opacity-100" : "opacity-0"
                                }`}
                              >
                                <CheckIcon
                                  className={`h-3 w-3 ${selected ? "opacity-100" : "opacity-0"}`}
                                />
                              </div>
                            ) : (
                              <CheckIcon
                                className={`h-3 w-3 ${selected ? "opacity-100" : "opacity-0"}`}
                              />
                            )}
                          </>
                        )}
                      </Combobox.Option>
                    ))
                  ) : (
                    <span className="flex items-center gap-2 p-1">
                      <p className="text-left text-custom-text-200 ">No matching results</p>
                    </span>
                  )
                ) : (
                  <p className="text-center text-custom-text-200">Loading...</p>
                )}
              </div>
              {footerOption}
            </Combobox.Options>
          </Transition>
        </>
      )}
    </Combobox>
  );
};
