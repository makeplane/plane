import React, { useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// react-popper
import { usePopper } from "react-popper";
// services
import { ProjectStateService } from "services/project";
// headless ui
import { Combobox } from "@headlessui/react";
// icons
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { CheckIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { StateGroupIcon } from "components/icons";
// types
import { Tooltip } from "components/ui";
import { Placement } from "@popperjs/core";
// constants
import { IState } from "types";
import { STATES_LIST } from "constants/fetch-keys";
// helper
import { getStatesList } from "helpers/state.helper";

type Props = {
  value: IState;
  onChange: (data: any, states: IState[] | undefined) => void;
  projectId: string;
  className?: string;
  buttonClassName?: string;
  optionsClassName?: string;
  placement?: Placement;
  hideDropdownArrow?: boolean;
  disabled?: boolean;
};

// services
const projectStateService = new ProjectStateService();

export const StateSelect: React.FC<Props> = ({
  value,
  onChange,
  projectId,
  className = "",
  buttonClassName = "",
  optionsClassName = "",
  placement,
  hideDropdownArrow = false,
  disabled = false,
}) => {
  const [query, setQuery] = useState("");

  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);

  const [fetchStates, setFetchStates] = useState<boolean>(false);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: placement ?? "bottom-start",
  });

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { data: stateGroups } = useSWR(
    workspaceSlug && projectId && fetchStates ? STATES_LIST(projectId) : null,
    workspaceSlug && projectId && fetchStates
      ? () => projectStateService.getStates(workspaceSlug.toString(), projectId)
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
    query === "" ? options : options?.filter((option) => option.query.toLowerCase().includes(query.toLowerCase()));

  const label = (
    <Tooltip tooltipHeading="State" tooltipContent={value?.name ?? ""} position="top">
      <div className="flex items-center cursor-pointer w-full gap-2 text-custom-text-200">
        <span className="h-3.5 w-3.5">{value && <StateGroupIcon stateGroup={value.group} color={value.color} />}</span>
        <span className="truncate">{value?.name ?? "State"}</span>
      </div>
    </Tooltip>
  );

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
        if (open) setFetchStates(true);

        return (
          <>
            <Combobox.Button as={React.Fragment}>
              <button
                ref={setReferenceElement}
                type="button"
                className={`flex items-center justify-between gap-1 w-full text-xs px-2.5 py-1 rounded-md shadow-sm border border-custom-border-300 duration-300 focus:outline-none ${
                  disabled ? "cursor-not-allowed text-custom-text-200" : "cursor-pointer hover:bg-custom-background-80"
                } ${buttonClassName}`}
              >
                {label}
                {!hideDropdownArrow && !disabled && <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />}
              </button>
            </Combobox.Button>
            <Combobox.Options>
              <div
                className={`z-10 border border-custom-border-300 px-2 py-2.5 rounded bg-custom-background-100 text-xs shadow-custom-shadow-rg focus:outline-none w-48 whitespace-nowrap my-1 ${optionsClassName}`}
                ref={setPopperElement}
                style={styles.popper}
                {...attributes.popper}
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
              </div>
            </Combobox.Options>
          </>
        );
      }}
    </Combobox>
  );
};
