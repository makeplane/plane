// react-hook-form
import { Control, Controller } from "react-hook-form";
// hooks
import useUser from "lib/hooks/useUser";
// headless ui
import { Listbox, Transition } from "@headlessui/react";
// types
import { IIssue } from "types";
import { classNames } from "constants/common";
import { Spinner } from "ui";
import React from "react";
import { ChevronDownIcon, Squares2X2Icon } from "@heroicons/react/24/outline";

type Props = {
  control: Control<IIssue, any>;
  submitChanges: (formData: Partial<IIssue>) => void;
};

const SelectState: React.FC<Props> = ({ control, submitChanges }) => {
  const { states } = useUser();

  return (
    <div className="flex items-center py-2 flex-wrap">
      <div className="flex items-center gap-x-2 text-sm sm:basis-1/2">
        <Squares2X2Icon className="flex-shrink-0 h-4 w-4" />
        <p>State</p>
      </div>
      <div className="sm:basis-1/2">
        <Controller
          control={control}
          name="state"
          render={({ field: { value } }) => (
            <Listbox
              as="div"
              value={value}
              onChange={(value: any) => {
                submitChanges({ state: value });
              }}
              className="flex-shrink-0"
            >
              {({ open }) => (
                <div className="relative">
                  <Listbox.Button className="flex justify-between items-center gap-1 hover:bg-gray-100 border rounded-md shadow-sm px-2 w-full py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs duration-300">
                    <span
                      className={classNames(
                        value ? "" : "text-gray-900",
                        "flex items-center gap-2 text-left"
                      )}
                    >
                      {value ? (
                        <>
                          <span
                            className="h-2 w-2 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: states?.find((option) => option.id === value)?.color,
                            }}
                          ></span>
                          {states?.find((option) => option.id === value)?.name}
                        </>
                      ) : (
                        "None"
                      )}
                    </span>
                    <ChevronDownIcon className="h-3 w-3" />
                  </Listbox.Button>

                  <Transition
                    show={open}
                    as={React.Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute z-10 right-0 mt-1 w-40 bg-white shadow-lg max-h-28 rounded-md py-1 text-xs ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                      <div className="p-1">
                        {states ? (
                          states.length > 0 ? (
                            states.map((option) => (
                              <Listbox.Option
                                key={option.id}
                                className={({ active, selected }) =>
                                  `${
                                    active || selected ? "text-white bg-theme" : "text-gray-900"
                                  } flex items-center gap-2 cursor-pointer select-none relative p-2 rounded-md truncate`
                                }
                                value={option.id}
                              >
                                {option.color && (
                                  <span
                                    className="h-2 w-2 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: option.color }}
                                  ></span>
                                )}
                                {option.name}
                              </Listbox.Option>
                            ))
                          ) : (
                            <div className="text-center">No states found</div>
                          )
                        ) : (
                          <Spinner />
                        )}
                      </div>
                    </Listbox.Options>
                  </Transition>
                </div>
              )}
            </Listbox>
          )}
        />
      </div>
    </div>
  );
};

export default SelectState;
