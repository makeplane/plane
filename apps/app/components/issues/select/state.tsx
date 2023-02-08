import React, { useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import stateService from "services/state.service";
// headless ui
import { Squares2X2Icon, PlusIcon } from "@heroicons/react/24/outline";
// icons
import { Combobox, Transition } from "@headlessui/react";
// fetch keys
import { STATE_LIST } from "constants/fetch-keys";

type Props = {
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  value: string;
  onChange: (value: string) => void;
  projectId: string;
};

export const IssueStateSelect: React.FC<Props> = ({ setIsOpen, value, onChange, projectId }) => {
  // states
  const [query, setQuery] = useState("");

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { data: states } = useSWR(
    workspaceSlug && projectId ? STATE_LIST(projectId) : null,
    workspaceSlug && projectId
      ? () => stateService.getStates(workspaceSlug as string, projectId)
      : null
  );

  const options = states?.map((state) => ({
    value: state.id,
    display: state.name,
    color: state.color,
  }));

  const filteredOptions =
    query === ""
      ? options
      : options?.filter((option) => option.display.toLowerCase().includes(query.toLowerCase()));

  return (
    <Combobox
      as="div"
      value={value}
      onChange={(val: any) => onChange(val)}
      className="relative flex-shrink-0"
    >
      {({ open }: any) => (
        <>
          <Combobox.Label className="sr-only">State</Combobox.Label>
          <Combobox.Button
            className={`flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-xs shadow-sm duration-300 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
          >
            <Squares2X2Icon className="h-3 w-3 text-gray-500" />
            <span className={`flex items-center gap-2 ${!value ? "" : "text-gray-900"}`}>
              {value && value !== "" ? (
                <span
                  className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                  style={{
                    backgroundColor: options?.find((option) => option.value === value)?.color,
                  }}
                />
              ) : null}
              {options?.find((option) => option.value === value)?.display || "State"}
            </span>
          </Combobox.Button>

          <Transition
            show={open}
            as={React.Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Combobox.Options
              className={`absolute z-10 mt-1 max-h-32 min-w-[8rem] overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none text-xs`}
            >
              <Combobox.Input
                className="w-full border-b bg-transparent p-2 text-xs focus:outline-none"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search"
                displayValue={(assigned: any) => assigned?.name}
              />
              <div className="py-1">
                {filteredOptions ? (
                  filteredOptions.length > 0 ? (
                    filteredOptions.map((option) => (
                      <Combobox.Option
                        key={option.value}
                        className={({ active, selected }) =>
                          `${active ? "bg-indigo-50" : ""} ${
                            selected ? "bg-indigo-50 font-medium" : ""
                          } flex cursor-pointer select-none items-center gap-2 truncate p-2 text-gray-900`
                        }
                        value={option.value}
                      >
                        {states && (
                          <>
                            <span
                              className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                              style={{
                                backgroundColor: option.color,
                              }}
                            />
                            {option.display}
                          </>
                        )}
                      </Combobox.Option>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500 px-2">No states found</p>
                  )
                ) : (
                  <p className="text-xs text-gray-500 px-2">Loading...</p>
                )}
                <button
                  type="button"
                  className="flex select-none w-full items-center gap-2 p-2 text-gray-400 hover:bg-indigo-50 hover:text-gray-900"
                  onClick={() => setIsOpen(true)}
                >
                  <PlusIcon className="h-3 w-3 text-gray-400" aria-hidden="true" />
                  <span className="text-xs whitespace-nowrap">Create state</span>
                </button>
              </div>
            </Combobox.Options>
          </Transition>
        </>
      )}
    </Combobox>
  );
};
