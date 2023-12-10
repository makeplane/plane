import React, { useState } from "react";

// react-popper
import { usePopper } from "react-popper";
// headless ui
import { Combobox } from "@headlessui/react";
// icons
import { Check, ChevronDown, Search } from "lucide-react";
// types
import { ICustomSearchSelectProps } from "./helper";

export const CustomSearchSelect = (props: ICustomSearchSelectProps) => {
  const {
    customButtonClassName = "",
    buttonClassName = "",
    className = "",
    customButton,
    placement,
    disabled = false,
    footerOption,
    input = false,
    label,
    maxHeight = "md",
    multiple = false,
    noChevron = false,
    onChange,
    options,
    onOpen,
    optionsClassName = "",
    value,
    width = "auto",
  } = props;
  const [query, setQuery] = useState("");

  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: placement ?? "bottom-start",
  });

  const filteredOptions =
    query === "" ? options : options?.filter((option) => option.query.toLowerCase().includes(query.toLowerCase()));

  const comboboxProps: any = {
    value,
    onChange,
    disabled,
  };

  if (multiple) comboboxProps.multiple = true;

  return (
    <Combobox as="div" className={`relative flex-shrink-0 text-left ${className}`} {...comboboxProps}>
      {({ open }: { open: boolean }) => {
        if (open && onOpen) onOpen();

        return (
          <>
            {customButton ? (
              <Combobox.Button as={React.Fragment}>
                <button
                  ref={setReferenceElement}
                  type="button"
                  className={`flex w-full items-center justify-between gap-1 text-xs ${
                    disabled
                      ? "cursor-not-allowed text-custom-text-200"
                      : "cursor-pointer hover:bg-custom-background-80"
                  }  ${customButtonClassName}`}
                >
                  {customButton}
                </button>
              </Combobox.Button>
            ) : (
              <Combobox.Button as={React.Fragment}>
                <button
                  ref={setReferenceElement}
                  type="button"
                  className={`flex w-full items-center justify-between gap-1 rounded border-[0.5px] border-custom-border-300 ${
                    input ? "px-3 py-2 text-sm" : "px-2 py-1 text-xs"
                  } ${
                    disabled
                      ? "cursor-not-allowed text-custom-text-200"
                      : "cursor-pointer hover:bg-custom-background-80"
                  } ${buttonClassName}`}
                >
                  {label}
                  {!noChevron && !disabled && <ChevronDown className="h-3 w-3" aria-hidden="true" />}
                </button>
              </Combobox.Button>
            )}
            <Combobox.Options as={React.Fragment}>
              <div
                className={`z-10 my-1 min-w-[10rem] rounded-md border border-custom-border-300 bg-custom-background-90 p-2 text-xs shadow-custom-shadow-rg focus:outline-none ${
                  width === "auto" ? "min-w-[8rem] whitespace-nowrap" : width
                } ${optionsClassName}`}
                ref={setPopperElement}
                style={styles.popper}
                {...attributes.popper}
              >
                <div className="flex w-full items-center justify-start rounded-sm border-[0.6px] border-custom-border-200 bg-custom-background-90 px-2">
                  <Search className="h-3 w-3 text-custom-text-200" />
                  <Combobox.Input
                    className="w-full bg-transparent px-2 py-1 text-xs text-custom-text-200 placeholder:text-custom-text-400 focus:outline-none"
                    value={query}
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
                            `flex cursor-pointer select-none items-center justify-between gap-2 truncate rounded px-1 py-1.5 ${
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
                                  <Check className={`h-3 w-3 ${selected ? "opacity-100" : "opacity-0"}`} />
                                </div>
                              ) : (
                                <Check className={`h-3 w-3 ${selected ? "opacity-100" : "opacity-0"}`} />
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
              </div>
            </Combobox.Options>
          </>
        );
      }}
    </Combobox>
  );
};
