import React, { useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// headless ui
import { Listbox, Transition } from "@headlessui/react";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
import { CyclesIcon } from "components/icons";
// services
import cycleServices from "services/cycles.service";
// components
import { CreateUpdateCycleModal } from "components/cycles";
// fetch-keys
import { CYCLE_LIST } from "constants/fetch-keys";

export type IssueCycleSelectProps = {
  projectId: string;
  value: any;
  onChange: (value: any) => void;
  multiple?: boolean;
};

export const CycleSelect: React.FC<IssueCycleSelectProps> = ({
  projectId,
  value,
  onChange,
  multiple = false,
}) => {
  // states
  const [isCycleModalActive, setCycleModalActive] = useState(false);

  const router = useRouter();
  const { workspaceSlug } = router.query;

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
      <CreateUpdateCycleModal isOpen={isCycleModalActive} handleClose={closeCycleModal} />
      <Listbox as="div" className="relative" value={value} onChange={onChange} multiple={multiple}>
        {({ open }) => (
          <>
            <Listbox.Button
              className={`flex cursor-pointer items-center gap-1 rounded-md border border-brand-base px-2 py-1 text-xs shadow-sm duration-300 hover:bg-brand-surface-1 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
            >
              <CyclesIcon className="h-3 w-3 text-brand-secondary" />
              <div className="flex items-center gap-2 truncate">
                {cycles?.find((c) => c.id === value)?.name ?? "Cycles"}
              </div>
            </Listbox.Button>

            <Transition
              show={open}
              as={React.Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options
                className={`absolute mt-1 max-h-32 min-w-[8rem] overflow-y-auto whitespace-nowrap bg-brand-surface-2 shadow-lg text-xs z-10 rounded-md py-1 ring-1 ring-black ring-opacity-5 focus:outline-none`}
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
                            } relative cursor-pointer select-none p-2 text-brand-base`
                          }
                          value={option.value}
                        >
                          <span className={` flex items-center gap-2 truncate`}>
                            {option.display}
                          </span>
                        </Listbox.Option>
                      ))
                    ) : (
                      <p className="text-center text-sm text-brand-secondary">No options</p>
                    )
                  ) : (
                    <p className="text-center text-sm text-brand-secondary">Loading...</p>
                  )}
                  <button
                    type="button"
                    className="relative w-full flex select-none items-center gap-x-2 p-2 text-gray-400 hover:bg-indigo-50 hover:text-brand-base"
                    onClick={openCycleModal}
                  >
                    <PlusIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                    <span>Create cycle</span>
                  </button>
                </div>
              </Listbox.Options>
            </Transition>
          </>
        )}
      </Listbox>
    </>
  );
};
