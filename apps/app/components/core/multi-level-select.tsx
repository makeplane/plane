import React, { useState } from "react";

import { Listbox, Transition } from "@headlessui/react";

import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";

type TSelectOption = {
  id: string;
  label: string;
  value: any;
  children?:
    | (TSelectOption & {
        children?: null;
      })[]
    | null;
};

type TMultipleSelectProps = {
  options: TSelectOption[];
  selected: TSelectOption | null;
  setSelected: (value: any) => void;
  label: string;
};

export const MultiSelect: React.FC<TMultipleSelectProps> = (props) => {
  const { options, selected, setSelected, label } = props;

  const [openChildFor, setOpenChildFor] = useState<TSelectOption | null>(null);

  return (
    <div className="fixed top-16 w-72">
      <Listbox
        value={selected}
        onChange={(value) => {
          if (value?.children === null) {
            setSelected(value);
            setOpenChildFor(null);
          } else setOpenChildFor(value);
        }}
      >
        {({ open }) => (
          <div className="relative mt-1">
            <Listbox.Button
              onClick={() => setOpenChildFor(null)}
              className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm"
            >
              <span className="block truncate">{selected?.label ?? label}</span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </span>
            </Listbox.Button>
            <Transition
              as={React.Fragment}
              show={open}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options
                static
                className="absolute mt-1 max-h-60 w-full overflowa-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
              >
                {options.map((option) => (
                  <Listbox.Option
                    key={option.id}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active ? "bg-amber-100 text-amber-900" : "text-gray-900"
                      }`
                    }
                    onClick={(e: any) => {
                      if (option.children !== null) {
                        e.preventDefault();
                        setOpenChildFor(option);
                      }
                    }}
                    value={option}
                  >
                    {({ selected }) => (
                      <>
                        {openChildFor?.id === option.id && (
                          <div className="w-72 h-auto max-h-72 bg-white border border-gray-200 rounded-lg rounded-tl-none shadow-md absolute left-full translate-x-2">
                            {option.children?.map((child) => (
                              <Listbox.Option
                                key={child.id}
                                className={({ active }) =>
                                  `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                    active ? "bg-amber-100 text-amber-900" : "text-gray-900"
                                  }`
                                }
                                as="div"
                                value={child}
                              >
                                {({ selected }) => (
                                  <>
                                    <span
                                      className={`block truncate ${
                                        selected ? "font-medium" : "font-normal"
                                      }`}
                                    >
                                      {child.label}
                                    </span>
                                    {selected ? (
                                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                      </span>
                                    ) : null}
                                  </>
                                )}
                              </Listbox.Option>
                            ))}

                            <div className="w-0 h-0 absolute top-0 left-0 -translate-x-2 border-t-8 border-gray-300 border-r-8 border-b-8 border-b-transparent border-t-transparent border-l-transparent" />
                          </div>
                        )}
                        <span
                          className={`block truncate ${selected ? "font-medium" : "font-normal"}`}
                        >
                          {option.label}
                        </span>
                        {selected ? (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        )}
      </Listbox>
    </div>
  );
};
