import React, { useState } from "react";
import useSWR from "swr";
import { PlusIcon } from "@heroicons/react/20/solid";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { Listbox, Transition } from "@headlessui/react";
// components
import { CycleModal } from "components/cycles";
// services
import cycleServices from "services/cycles.service";
// constants
import { CYCLE_LIST } from "constants/fetch-keys";

export type IssueCycleSelectProps = {
  workspaceSlug: string;
  projectId: string;
  value: any;
  onChange: (value: any) => void;
  multiple?: boolean;
};

export const CycleSelect: React.FC<IssueCycleSelectProps> = (props) => {
  const { workspaceSlug, projectId, value, onChange, multiple = false } = props;
  // states
  const [isCycleModalActive, setCycleModalActive] = useState(false);
  // fetching Cycles information
  const { data: cycles } = useSWR(
    workspaceSlug && projectId ? CYCLE_LIST(projectId) : null,
    workspaceSlug && projectId
      ? () => cycleServices.getCycles(workspaceSlug as string, projectId)
      : null
  );

  const options = cycles?.map((cycle) => ({ value: cycle.id, display: cycle.name }));

  const openCycleModal = () => {
    setCycleModalActive(true);
  };

  const closeCycleModal = () => {
    setCycleModalActive(false);
  };

  return (
    <>
      <CycleModal
        isOpen={isCycleModalActive}
        handleClose={closeCycleModal}
        projectId={projectId}
        workspaceSlug={workspaceSlug}
      />
      <Listbox as="div" className="relative" value={value} onChange={onChange} multiple={multiple}>
        {({ open }) => (
          <>
            <Listbox.Label>
              <div className="mb-2 text-gray-500">Cycles</div>
            </Listbox.Label>
            <Listbox.Button
              className={`flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-xs shadow-sm duration-300 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
            >
              <ArrowPathIcon className="h-3 w-3 text-gray-500" />
              <div className="flex items-center gap-2 truncate">{value.display || "Cycles"}</div>
            </Listbox.Button>

            <Transition
              show={open}
              as={React.Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options
                className={`absolute mt-1 max-h-32 min-w-[8rem] overflow-y-auto whitespace-nowrap bg-white shadow-lg text-xs z-10 rounded-md py-1 ring-1 ring-black ring-opacity-5 focus:outline-none`}
              >
                <div className="py-1">
                  {options ? (
                    options.length > 0 ? (
                      options.map((option) => (
                        <Listbox.Option
                          key={option.value}
                          className={({ selected, active }) =>
                            `${
                              selected ||
                              (Array.isArray(value)
                                ? value.includes(option.value)
                                : value === option.value)
                                ? "bg-indigo-50 font-medium"
                                : ""
                            } ${
                              active ? "bg-indigo-50" : ""
                            } relative cursor-pointer select-none p-2 text-gray-900`
                          }
                          value={option.value}
                        >
                          <span className={` flex items-center gap-2 truncate`}>
                            {option.display}
                          </span>
                        </Listbox.Option>
                      ))
                    ) : (
                      <p className="text-center text-sm text-gray-500">No options</p>
                    )
                  ) : (
                    <p className="text-center text-sm text-gray-500">Loading...</p>
                  )}
                </div>
                <button
                  type="button"
                  className="relative flex select-none items-center gap-x-2 py-2 pl-3 pr-9 text-gray-400 hover:text-gray-500"
                  onClick={openCycleModal}
                >
                  <span>
                    <PlusIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block truncate">Create cycle</span>
                  </span>
                </button>
              </Listbox.Options>
            </Transition>
          </>
        )}
      </Listbox>
    </>
  );
};
