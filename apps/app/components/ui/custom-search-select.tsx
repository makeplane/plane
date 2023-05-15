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
  height?: "sm" | "md" | "rg" | "lg";
  position?: "right" | "left";
  verticalPosition?: "top" | "bottom";
  noChevron?: boolean;
  customButton?: JSX.Element;
  optionsClassName?: string;
  input?: boolean;
  disabled?: boolean;
  selfPositioned?: boolean;
  multiple?: boolean;
  footerOption?: JSX.Element;
};
export const CustomSearchSelect = ({
  label,
  textAlignment,
  height = "md",
  value,
  onChange,
  options,
  position = "left",
  verticalPosition = "bottom",
  noChevron = false,
  customButton,
  optionsClassName = "",
  input = false,
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

  const props: any = {
    value,
    onChange,
    disabled,
  };

  if (multiple) props.multiple = true;

  return (
    <Combobox
      as="div"
      className={`${!selfPositioned ? "relative" : ""} flex-shrink-0 text-left`}
      {...props}
    >
      {({ open }: any) => (
        <>
          {customButton ? (
            <Combobox.Button as="div">{customButton}</Combobox.Button>
          ) : (
            <Combobox.Button
              className={`flex w-full border border-brand-base ${
                disabled ? "cursor-not-allowed" : "cursor-pointer hover:bg-brand-surface-2"
              } ${
                input ? "px-3 py-2 text-sm" : "px-2.5 py-1 text-xs"
              } items-center justify-between gap-1 rounded-md shadow-sm duration-300 focus:outline-none focus:ring-1 focus:ring-brand-base ${
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
              className={`${optionsClassName} absolute min-w-[10rem] border border-brand-base p-2 ${
                position === "right" ? "right-0" : "left-0"
              } ${
                verticalPosition === "top" ? "bottom-full mb-1" : "mt-1"
              } z-10 origin-top-right rounded-md bg-brand-surface-1 text-xs shadow-lg focus:outline-none`}
            >
              <div className="flex w-full items-center justify-start rounded-sm border-[0.6px] border-brand-base bg-brand-surface-1 px-2">
                <MagnifyingGlassIcon className="h-3 w-3 text-brand-secondary" />
                <Combobox.Input
                  className="w-full bg-transparent py-1 px-2 text-xs text-brand-secondary focus:outline-none"
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type to search..."
                  displayValue={(assigned: any) => assigned?.name}
                />
              </div>
              <div
                className={`mt-2 space-y-1 ${
                  height === "sm"
                    ? "max-h-28"
                    : height === "md"
                    ? "max-h-44"
                    : height === "rg"
                    ? "max-h-56"
                    : height === "lg"
                    ? "max-h-80"
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
                          `${active || selected ? "bg-brand-surface-2" : ""} ${
                            selected ? "font-medium" : ""
                          } flex cursor-pointer select-none items-center justify-between gap-2 truncate rounded px-1 py-1.5 text-brand-secondary`
                        }
                      >
                        {({ active, selected }) => (
                          <>
                            {option.content}
                            {multiple ? (
                              <div
                                className={`flex items-center justify-center rounded border border-gray-500 p-0.5 ${
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
                    <p className="text-center text-brand-secondary">No matching results</p>
                  )
                ) : (
                  <p className="text-center text-brand-secondary">Loading...</p>
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
