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
                  <ChartBarIcon className="h-3 w-3 text-gray-500" />
                  <span className="block capitalize">
                    {value && value !== "" ? value : "Priority"}
                  </span>
                </Listbox.Button>

                <Transition
                  show={open}
                  as={React.Fragment}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Listbox.Options className="absolute z-10 mt-1 w-full w-[5rem] bg-white shadow-lg max-h-28 rounded-md py-1 ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none text-xs">
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
                                  selected ? "font-medium" : "font-normal"
                                }`}
                              >
                                {priority}
                              </span>
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
