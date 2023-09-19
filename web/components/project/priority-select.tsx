import React, { useEffect, useRef, useState, useCallback } from "react";

// hooks
import useOutsideClickDetector from "hooks/use-outside-click-detector";
// headless ui
import { Combobox, Transition } from "@headlessui/react";
// icons
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { CheckIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { PriorityIcon } from "components/icons";
// components
import { Tooltip } from "components/ui";
// types
import { TIssuePriorities } from "types";
// constants
import { PRIORITIES } from "constants/project";
// helper
import { handleDropdownPosition } from "helpers/dyanamic-dropdown-position";

type Props = {
  value: TIssuePriorities;
  onChange: (data: any) => void;
  className?: string;
  buttonClassName?: string;
  optionsClassName?: string;
  hideDropdownArrow?: boolean;
  disabled?: boolean;
};

export const PrioritySelect: React.FC<Props> = ({
  value,
  onChange,
  className = "",
  buttonClassName = "",
  optionsClassName = "",
  hideDropdownArrow = false,
  disabled = false,
}) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const dropdownBtn = useRef<any>(null);
  const dropdownOptions = useRef<any>(null);

  const options = PRIORITIES?.map((priority) => ({
    value: priority,
    query: priority,
    content: (
      <div className="flex items-center gap-2">
        <PriorityIcon priority={priority} className="text-sm" />
        {priority ?? "None"}
      </div>
    ),
  }));

  const filteredOptions =
    query === ""
      ? options
      : options?.filter((option) => option.query.toLowerCase().includes(query.toLowerCase()));

  const selectedOption = value ?? "None";

  const label = (
    <Tooltip tooltipHeading="Priority" tooltipContent={selectedOption} position="top">
      <div
        className={`grid place-items-center rounded "h-6 w-6 border shadow-sm ${
          value === "urgent"
            ? "border-red-500/20 bg-red-500"
            : "border-custom-border-300 bg-custom-background-100"
        } items-center`}
      >
        <span className="flex gap-1 items-center text-custom-text-200 text-xs">
          <PriorityIcon
            priority={value}
            className={`text-sm ${
              value === "urgent"
                ? "text-white"
                : value === "high"
                ? "text-orange-500"
                : value === "medium"
                ? "text-yellow-500"
                : value === "low"
                ? "text-green-500"
                : "text-custom-text-200"
            }`}
          />
        </span>
      </div>
    </Tooltip>
  );

  const handleResize = useCallback(() => {
    if (isOpen) {
      handleDropdownPosition(dropdownBtn, dropdownOptions);
    }
  }, [isOpen, dropdownBtn, dropdownOptions]);

  useEffect(() => {
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen, handleResize]);

  useOutsideClickDetector(dropdownOptions, () => {
    if (isOpen) setIsOpen(false);
  });

  return (
    <Combobox
      as="div"
      className={`flex-shrink-0 text-left ${className}`}
      value={value}
      onChange={onChange}
      disabled={disabled}
    >
      {({ open }: { open: boolean }) => {
        if (open) {
          setIsOpen(true);
          handleDropdownPosition(dropdownBtn, dropdownOptions);
        }

        return (
          <>
            <Combobox.Button
              ref={dropdownBtn}
              type="button"
              className={`flex items-center justify-between gap-1 w-full text-xs ${
                disabled
                  ? "cursor-not-allowed text-custom-text-200"
                  : "cursor-pointer hover:bg-custom-background-80"
              } ${buttonClassName}`}
            >
              {label}
              {!hideDropdownArrow && !disabled && (
                <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />
              )}
            </Combobox.Button>
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
              <div className="fixed z-20 top-0 left-0 h-full w-full cursor-auto">
                <Combobox.Options
                  ref={dropdownOptions}
                  className={`absolute z-10 border border-custom-border-300 px-2 py-2.5 rounded bg-custom-background-100 text-xs shadow-lg focus:outline-none w-48 whitespace-nowrap ${optionsClassName}`}
                >
                  <div className="flex w-full items-center justify-start rounded border border-custom-border-200 bg-custom-background-90 px-2">
                    <MagnifyingGlassIcon className="h-3.5 w-3.5 text-custom-text-300" />
                    <Combobox.Input
                      className="w-full bg-transparent py-1 px-2 text-xs text-custom-text-200 placeholder:text-custom-text-400 focus:outline-none"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search"
                      displayValue={(assigned: any) => assigned?.name}
                    />
                  </div>
                  <div className={`mt-2 space-y-1 max-h-48 overflow-y-scroll`}>
                    {filteredOptions ? (
                      filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => (
                          <Combobox.Option
                            key={option.value}
                            value={option.value}
                            className={({ active, selected }) =>
                              `flex items-center justify-between gap-2 cursor-pointer select-none truncate rounded px-1 py-1.5 ${
                                active && !selected ? "bg-custom-background-80" : ""
                              } ${selected ? "text-custom-text-100" : "text-custom-text-200"}`
                            }
                          >
                            {({ selected }) => (
                              <>
                                {option.content}
                                {selected && <CheckIcon className={`h-3.5 w-3.5`} />}
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
                </Combobox.Options>
              </div>
            </Transition>
          </>
        );
      }}
    </Combobox>
  );
};
