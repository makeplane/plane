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
            `flex items-center text-xs cursor-pointer border rounded-md shadow-sm duration-300 
            ${
              open
                ? "outline-none border-[#3F76FF] bg-[rgba(63,118,255,0.05)] ring-1 ring-[#3F76FF] "
                : "hover:bg-[rgba(63,118,255,0.05)] focus:bg-[rgba(63,118,255,0.05)]"
            }`
          }
        >
          <span className="flex items-center justify-center text-xs gap-2 px-3 py-1.5">
            <span className="flex items-center">
              {getPriorityIcon(value, `${value ? "text-xs" : "text-xs text-[#858E96]"}`)}
            </span>
            <span className={`${value ? "text-[#495057]" : "text-[#858E96]"} capitalize`}>
              {value ?? "Priority"}
            </span>
          </span>
        </Listbox.Button>

        <Transition
          show={open}
          as={React.Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
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
                      active ? "bg-[#E9ECEF]" : ""
                    } group flex min-w-[14rem] cursor-pointer select-none items-center gap-2 truncate rounded px-1 py-1.5 text-[#495057]`
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
