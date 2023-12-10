import React, { Fragment } from "react";

// headless ui
import { Popover, Transition } from "@headlessui/react";
// icons
import { ChevronDown, ChevronUp } from "lucide-react";

export const CustomPopover = ({
  children,
  label,
  placeholder = "Select",
}: {
  children: React.ReactNode;
  label?: string;
  placeholder?: string;
}) => (
  <div className="relative">
    <Popover className="relative">
      {({ open }) => (
        <>
          <Popover.Button className={`${open ? "" : ""}  relative flex items-center gap-1 outline-none ring-0`}>
            <div className="text-sm">{label ?? placeholder}</div>
            <div className="grid h-5 w-5 place-items-center">
              {!open ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </div>
          </Popover.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Popover.Panel className="absolute right-0 z-10 mt-1 min-w-[150px]">
              <div className="mt-1 overflow-hidden overflow-y-auto rounded border border-custom-border-300 bg-custom-background-90 shadow-custom-shadow-2xs focus:outline-none">
                {children}
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  </div>
);
