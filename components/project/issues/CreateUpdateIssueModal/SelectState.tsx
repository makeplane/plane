import React from "react";
// react hook form
import { Controller } from "react-hook-form";
// headless ui
import { Listbox, Transition } from "@headlessui/react";
// hooks
import useUser from "lib/hooks/useUser";
// components
import CreateUpdateStateModal from "components/project/issues/BoardView/state/CreateUpdateStateModal";
// icons
import { CheckIcon, PlusIcon } from "@heroicons/react/20/solid";
// ui
import { Spinner } from "ui";
// types
import type { Control } from "react-hook-form";
import type { IIssue } from "types";
import { Squares2X2Icon } from "@heroicons/react/24/outline";

type Props = {
  control: Control<IIssue, any>;
  data?: IIssue;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const SelectState: React.FC<Props> = ({ control, data, setIsOpen }) => {
  const { states } = useUser();

  return (
    <>
      <Controller
        control={control}
        name="state"
        render={({ field: { value, onChange } }) => (
          <Listbox value={value} onChange={onChange}>
            {({ open }) => (
              <>
                <div className="relative">
                  <Listbox.Button className="flex items-center gap-1 hover:bg-gray-100 relative border rounded-md shadow-sm px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm duration-300">
                    <Squares2X2Icon className="h-3 w-3" />
                    <span className="block truncate">
                      {states?.find((i) => i.id === value)?.name ?? "State"}
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
                        {states ? (
                          states.filter((i) => i.id !== data?.id).length > 0 ? (
                            states
                              .filter((i) => i.id !== data?.id)
                              .map((state) => (
                                <Listbox.Option
                                  key={state.id}
                                  className={({ active }) =>
                                    `${
                                      active ? "text-white bg-theme" : "text-gray-900"
                                    } cursor-pointer select-none relative p-2 rounded-md`
                                  }
                                  value={state.id}
                                >
                                  {({ selected, active }) => (
                                    <>
                                      <span
                                        className={`${
                                          selected ? "font-semibold" : "font-normal"
                                        } block truncate`}
                                      >
                                        {state.name}
                                      </span>

                                      {selected ? (
                                        <span
                                          className={`absolute inset-y-0 right-0 flex items-center pr-4 ${
                                            active ? "text-white" : "text-indigo-600"
                                          }`}
                                        >
                                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                        </span>
                                      ) : null}
                                    </>
                                  )}
                                </Listbox.Option>
                              ))
                          ) : (
                            <p className="text-gray-400">No states found!</p>
                          )
                        ) : (
                          <div className="flex justify-center">
                            <Spinner />
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        className="select-none relative py-2 pl-3 pr-9 flex items-center gap-x-2 text-gray-400 hover:text-gray-500"
                        onClick={() => setIsOpen(true)}
                      >
                        <span>
                          <PlusIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </span>
                        <span>
                          <span className="block truncate">Create state</span>
                        </span>
                      </button>
                    </Listbox.Options>
                  </Transition>
                </div>
              </>
            )}
          </Listbox>
        )}
      ></Controller>
    </>
  );
};

export default SelectState;
