import React, { Fragment } from "react";
// headless ui
import { Popover, Transition } from "@headlessui/react";

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
          <Popover.Button
            className={`${
              open ? "" : ""
            }  relative flex items-center gap-1 border border-custom-border-300 shadow-sm p-1 px-2 ring-0 outline-none`}
          >
            <div className="text-sm font-medium">
              {label ? label : placeholder ? placeholder : "Select"}
            </div>
            <div className="w-[20px] h-[20px] relative flex justify-center items-center">
              {!open ? (
                <span className="material-symbols-rounded text-[20px]">expand_more</span>
              ) : (
                <span className="material-symbols-rounded text-[20px]">expand_less</span>
              )}
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
            <Popover.Panel className="absolute right-0 z-[9999]">
              <div className="overflow-hidden rounded-sm border border-custom-border-300 mt-1 overflow-y-auto bg-custom-background-90 shadow-lg focus:outline-none">
                {children}
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  </div>
);
