import React, { useState } from "react";

// headless ui
import { Listbox, Transition } from "@headlessui/react";
// icons
import { Check, ChevronsUpDown } from "lucide-react";

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
  direction?: "left" | "right";
};

export const MultiLevelSelect: React.FC<TMultipleSelectProps> = ({
  options,
  selected,
  setSelected,
  label,
  direction = "right",
}) => {
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
              className="relative w-full cursor-default rounded-lg bg-custom-background-80 py-2 pl-3 pr-10 text-left shadow-md sm:text-sm"
            >
              <span className="block truncate">{selected?.label ?? label}</span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronsUpDown className="h-5 w-5 text-custom-text-200" />
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
                className="absolute mt-1 max-h-60 w-full rounded-md bg-custom-background-80 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
              >
                {options.map((option) => (
                  <Listbox.Option
                    key={option.id}
                    className={
                      "relative cursor-default select-none py-2 pl-10 pr-4 hover:bg-custom-background-90 hover:text-custom-text-100"
                    }
                    onClick={(e: any) => {
                      if (option.children !== null) {
                        e.preventDefault();
                        setOpenChildFor(option);
                      }
                      if (option.id === openChildFor?.id) {
                        e.preventDefault();
                        setOpenChildFor(null);
                      }
                    }}
                    value={option}
                  >
                    {({ selected }) => (
                      <>
                        {openChildFor?.id === option.id && (
                          <div
                            className={`absolute h-auto max-h-72 w-72 rounded-lg border border-custom-border-200 bg-custom-background-80 ${
                              direction === "right"
                                ? "left-full translate-x-2 rounded-tl-none shadow-md"
                                : "right-full -translate-x-2 rounded-tr-none shadow-md"
                            }`}
                          >
                            {option.children?.map((child) => (
                              <Listbox.Option
                                key={child.id}
                                className={
                                  "relative cursor-default select-none py-2 pl-10 pr-4 hover:bg-custom-background-90 hover:text-custom-text-100"
                                }
                                as="div"
                                value={child}
                              >
                                {({ selected }) => (
                                  <>
                                    <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>
                                      {child.label}
                                    </span>
                                    {selected ? (
                                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-custom-text-200">
                                        <Check className="h-5 w-5" aria-hidden="true" />
                                      </span>
                                    ) : null}
                                  </>
                                )}
                              </Listbox.Option>
                            ))}

                            <div
                              className={`absolute h-0 w-0 border-t-8 border-custom-border-200 ${
                                direction === "right"
                                  ? "left-0 top-0 -translate-x-2 border-b-8 border-r-8 border-b-transparent border-l-transparent border-t-transparent"
                                  : "right-0 top-0 translate-x-2 border-b-8 border-l-8 border-b-transparent border-r-transparent border-t-transparent"
                              }`}
                            />
                          </div>
                        )}
                        <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>
                          {option.label}
                        </span>
                        {selected ? (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-custom-text-200">
                            <Check className="h-5 w-5" aria-hidden="true" />
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
