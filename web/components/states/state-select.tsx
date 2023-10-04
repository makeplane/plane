import React, { useRef, useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// hooks
import useDynamicDropdownPosition from "hooks/use-dynamic-dropdown";
// services
import projectStateService from "services/project_state.service";
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
      ? () => projectStateService.getStates(workspaceSlug as string, projectId as string)
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

  useDynamicDropdownPosition(isOpen, () => setIsOpen(false), dropdownBtn, dropdownOptions);

  return (
    <div className="fixed top-16 w-72">
      <Combobox value={selected} onChange={setSelected}>
        <div className="relative mt-1">
          <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
            <Combobox.Input
              className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
              displayValue={(person) => person.name}
              onChange={(event) => setQuery(event.target.value)}
            />
            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </Combobox.Button>
          </div>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery('')}
          >
            <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {filteredPeople.length === 0 && query !== '' ? (
                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                  Nothing found.
                </div>
              ) : (
                filteredPeople.map((person) => (
                  <Combobox.Option
                    key={person.id}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active ? 'bg-teal-600 text-white' : 'text-gray-900'
                      }`
                    }
                    value={person}
                  >
                    {({ selected, active }) => (
                      <>
                        <span
                          className={`block truncate ${
                            selected ? 'font-medium' : 'font-normal'
                          }`}
                        >
                          {person.name}
                        </span>
                        {selected ? (
                          <span
                            className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                              active ? 'text-white' : 'text-teal-600'
                            }`}
                          >
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Transition>
        </div>
      </Combobox>
    </div>
  );
};
