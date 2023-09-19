import React, { useRef, useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// hooks
import useDynamicDropdownPosition from "hooks/use-dynamic-dropdown";
// services
import stateService from "services/state.service";
// headless ui
import { Combobox } from "@headlessui/react";
// icons
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { CheckIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { StateGroupIcon } from "components/icons";
// types
import { Tooltip } from "components/ui";
// constants
import { IState } from "types";
import { STATES_LIST } from "constants/fetch-keys";
// helper
import { getStatesList } from "helpers/state.helper";

type Props = {
  value: IState;
  onChange: (data: any, states: IState[] | undefined) => void;
  className?: string;
  buttonClassName?: string;
  optionsClassName?: string;
  hideDropdownArrow?: boolean;
  disabled?: boolean;
};

export const StateSelect: React.FC<Props> = ({
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

  const [fetchStates, setFetchStates] = useState<boolean>(false);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: stateGroups } = useSWR(
    workspaceSlug && projectId && fetchStates ? STATES_LIST(projectId as string) : null,
    workspaceSlug && projectId && fetchStates
      ? () => stateService.getStates(workspaceSlug as string, projectId as string)
      : null
  );

  const states = getStatesList(stateGroups);

  const options = states?.map((state) => ({
    value: state.id,
    query: state.name,
    content: (
      <div className="flex items-center gap-2">
        <StateGroupIcon stateGroup={state.group} color={state.color} />
        {state.name}
      </div>
    ),
  }));

  const filteredOptions =
    query === ""
      ? options
      : options?.filter((option) => option.query.toLowerCase().includes(query.toLowerCase()));

  const label = (
    <Tooltip tooltipHeading="State" tooltipContent={value?.name ?? ""} position="top">
      <div className="flex items-center cursor-pointer w-full gap-2 text-custom-text-200">
        <span className="h-3.5 w-3.5">
          {value && <StateGroupIcon stateGroup={value.group} color={value.color} />}
        </span>
        <span className="truncate">{value?.name ?? "State"}</span>
      </div>
    </Tooltip>
  );

  useDynamicDropdownPosition(isOpen, () => setIsOpen(false), dropdownBtn, dropdownOptions);

  return (
    <Combobox
      as="div"
      className={`flex-shrink-0 text-left ${className}`}
      value={value.id}
      onChange={(data: string) => {
        onChange(data, states);
      }}
      disabled={disabled}
    >
      {({ open }: { open: boolean }) => {
        if (open) {
          if (!isOpen) setIsOpen(true);
          setFetchStates(true);
        } else if (isOpen) setIsOpen(false);

        return (
          <>
            <Combobox.Button
              ref={dropdownBtn}
              type="button"
              className={`flex items-center justify-between gap-1 w-full text-xs px-2.5 py-1 rounded-md shadow-sm border border-custom-border-300 duration-300 focus:outline-none ${
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
            <div className={`${open ? "fixed z-20 top-0 left-0 h-full w-full cursor-auto" : ""}`}>
              <Combobox.Options
                ref={dropdownOptions}
                className={`absolute z-10 border border-custom-border-300 px-2 py-2.5 rounded bg-custom-background-100 text-xs shadow-lg focus:outline-none w-48 whitespace-nowrap mt-1 ${optionsClassName}`}
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
          </>
        );
      }}
    </Combobox>
  );
};
