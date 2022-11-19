import React from "react";
// react hook form
import { Controller } from "react-hook-form";
// headless ui
import { Listbox, Transition } from "@headlessui/react";
// hooks
import useUser from "lib/hooks/useUser";
// components
import CreateUpdateSprintsModal from "components/project/cycles/CreateUpdateCyclesModal";
// icons
import { CheckIcon, ChevronDownIcon, PlusIcon } from "@heroicons/react/20/solid";
// types
import type { IIssue } from "types";
import type { Control } from "react-hook-form";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

type Props = {
  control: Control<IIssue, any>;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const SelectSprint: React.FC<Props> = ({ control, setIsOpen }) => {
  const { sprints } = useUser();

  return (
    <>
      <Controller
        control={control}
        name="sprints"
        render={({ field: { value, onChange } }) => (
          <Listbox as="div" value={value} onChange={onChange}>
            {({ open }) => (
              <>
                <div className="relative">
                  <Listbox.Button className="flex items-center gap-1 hover:bg-gray-100 relative border rounded-md shadow-sm px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm duration-300">
                    <ArrowPathIcon className="h-3 w-3" />
                    <span className="block truncate">
                      {sprints?.find((i) => i.id.toString() === value?.toString())?.name ?? "Cycle"}
                    </span>
                  </Listbox.Button>

                  <Transition
                    show={open}
                    as={React.Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute mt-1 bg-white shadow-lg max-h-28 rounded-md py-1 text-xs ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                      <div className="p-1">
                        {sprints?.map((sprint) => (
                          <Listbox.Option
                            key={sprint.id}
                            value={sprint.id}
                            className={({ active }) =>
                              `relative cursor-pointer select-none p-2 rounded-md ${
                                active ? "bg-theme text-white" : "text-gray-900"
                              }`
                            }
                          >
                            {({ active, selected }) => (
                              <>
                                <span className={`block ${selected && "font-semibold"}`}>
                                  {sprint.name}
                                </span>

                                {selected && (
                                  <span
                                    className={`absolute inset-y-0 right-0 flex items-center pr-4 ${
                                      active ? "text-white" : "text-indigo-600"
                                    }`}
                                  >
                                    <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                  </span>
                                )}
                              </>
                            )}
                          </Listbox.Option>
                        ))}
                      </div>
                      <button
                        type="button"
                        className="relative select-none py-2 pl-3 pr-9 flex items-center gap-x-2 text-gray-400 hover:text-gray-500"
                        onClick={() => setIsOpen(true)}
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
                </div>
              </>
            )}
          </Listbox>
        )}
      />
    </>
  );
};

export default SelectSprint;
