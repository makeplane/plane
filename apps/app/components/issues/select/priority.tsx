import React from "react";

// headless ui
import { Listbox, Transition } from "@headlessui/react";
// icons
import { getPriorityIcon } from "components/icons/priority-icon";
// constants
import { PRIORITIES } from "constants/project";
import { CheckIcon } from "@heroicons/react/24/outline";

type Props = {
  value: string | null;
  onChange: (value: string) => void;
};

export const IssuePrioritySelect: React.FC<Props> = ({ value, onChange }) => (
  <Listbox as="div" className="relative" value={value} onChange={onChange}>
    {({ open }) => (
      <>
        <Listbox.Button
          className={({ open }) =>
            `flex items-center text-xs cursor-pointer border rounded-md shadow-sm duration-200 
            ${
              open ? "outline-none border-theme bg-theme/5 ring-1 ring-theme " : "hover:bg-theme/5"
            }`
          }
        >
          <span className="flex items-center justify-center text-xs gap-2 px-3 py-1.5">
            <span className="flex items-center">
              {getPriorityIcon(value, `${value ? "text-xs" : "text-xs text-gray-500"}`)}
            </span>
            <span className={`${value ? "text-gray-600" : "text-gray-500"} capitalize`}>
              {value ?? "Priority"}
            </span>
          </span>
        </Listbox.Button>

        <Transition
          show={open}
          as={React.Fragment}
          enter="transition ease-out duration-200"
          enterFrom="opacity-0 translate-y-1"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-1"
        >
          <Listbox.Options
            className={`absolute z-10 max-h-52 min-w-[8rem] px-2 py-2  text-xs 
              rounded-md shadow-md overflow-auto border-none bg-white focus:outline-none`}
          >
            <div>
              {PRIORITIES.map((priority) => (
                <Listbox.Option
                  key={priority}
                  className={({ active }) =>
                    `${
                      active ? "bg-gray-200" : ""
                    } group flex min-w-[14rem] cursor-pointer select-none items-center gap-2 truncate rounded px-1 py-1.5 text-gray-600`
                  }
                  value={priority}
                >
                  {({ selected, active }) => (
                    <div className="flex w-full gap-2 justify-between rounded">
                      <div className="flex justify-start items-center gap-2">
                        <span>{getPriorityIcon(priority)}</span>
                        <span className="capitalize">{priority ?? "None"}</span>
                      </div>
                      <div className="flex justify-center items-center p-1 rounded">
                        <CheckIcon
                          className={`h-3 w-3 ${selected ? "opacity-100" : "opacity-0"}`}
                        />
                      </div>
                    </div>
                  )}
                </Listbox.Option>
              ))}
            </div>
          </Listbox.Options>
        </Transition>
      </>
    )}
  </Listbox>
);
