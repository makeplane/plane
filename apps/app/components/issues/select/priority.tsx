import React from "react";

// headless ui
import { Listbox, Transition } from "@headlessui/react";
// constants
import { getPriorityIcon } from "constants/global";
import { PRIORITIES } from "constants/";

type Props = {
  value: string | null;
  onChange: (value: string) => void;
};

export const IssuePrioritySelect: React.FC<Props> = ({ value, onChange }) => (
  <Listbox as="div" className="relative" value={value} onChange={onChange}>
    {({ open }) => (
      <>
        <Listbox.Button className="flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-xs shadow-sm duration-300 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
          <span className="text-gray-500 grid place-items-center">{getPriorityIcon(value)}</span>
          <div className="flex items-center gap-2 capitalize">{value ?? "Priority"}</div>
        </Listbox.Button>

        <Transition
          show={open}
          as={React.Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options className="absolute mt-1 max-h-32 min-w-[8rem] overflow-y-auto whitespace-nowrap bg-white shadow-lg text-xs z-10 rounded-md py-1 ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              {PRIORITIES.map((priority) => (
                <Listbox.Option
                  key={priority}
                  className={({ selected, active }) =>
                    `${selected ? "bg-indigo-50 font-medium" : ""} ${
                      active ? "bg-indigo-50" : ""
                    } relative cursor-pointer select-none p-2 text-gray-900`
                  }
                  value={priority}
                >
                  <span className="flex items-center gap-2 capitalize">
                    {getPriorityIcon(priority)}
                    {priority ?? "None"}
                  </span>
                </Listbox.Option>
              ))}
            </div>
          </Listbox.Options>
        </Transition>
      </>
    )}
  </Listbox>
);
