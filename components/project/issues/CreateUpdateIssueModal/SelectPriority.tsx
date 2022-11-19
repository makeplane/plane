import React from "react";
// react hook form
import { Controller } from "react-hook-form";
// headless ui
import { Listbox, Transition } from "@headlessui/react";
// icons
import { CheckIcon } from "@heroicons/react/20/solid";

// types
import type { IIssue } from "types";
import type { Control } from "react-hook-form";
import { ChartBarIcon } from "@heroicons/react/24/outline";

type Props = {
  control: Control<IIssue, any>;
};

const PRIORITIES = ["high", "medium", "low"];

const SelectPriority: React.FC<Props> = ({ control }) => {
  return (
    <Controller
      control={control}
      name="priority"
      render={({ field: { value, onChange } }) => (
        <Listbox value={value} onChange={onChange}>
          {({ open }) => (
            <>
              <div className="relative">
                <Listbox.Button className="flex items-center gap-1 hover:bg-gray-100 relative border rounded-md shadow-sm px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm duration-300">
                  <ChartBarIcon className="h-3 w-3" />
                  <span className="block capitalize">{value ?? "Priority"}</span>
                </Listbox.Button>

                <Transition
                  show={open}
                  as={React.Fragment}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Listbox.Options className="absolute mt-1 w-full bg-white shadow-lg max-h-28 rounded-md py-1 ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none text-xs">
                    <div className="p-1">
                      {PRIORITIES.map((priority) => (
                        <Listbox.Option
                          key={priority}
                          className={({ active }) =>
                            `${
                              active ? "text-white bg-theme" : "text-gray-900"
                            } cursor-pointer select-none relative p-2 rounded-md`
                          }
                          value={priority}
                        >
                          {({ selected, active }) => (
                            <>
                              <span
                                className={`block capitalize ${
                                  selected ? "font-semibold" : "font-normal"
                                }`}
                              >
                                {priority}
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
                      ))}
                    </div>
                  </Listbox.Options>
                </Transition>
              </div>
            </>
          )}
        </Listbox>
      )}
    ></Controller>
  );
};

export default SelectPriority;
