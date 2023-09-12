import React, { Fragment } from "react";

// headless ui
import { Popover, Transition } from "@headlessui/react";
// icons
import { Icon } from "components/ui";

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
            className={`${open ? "" : ""}  relative flex items-center gap-1 ring-0 outline-none`}
          >
            <div className="text-sm">{label ?? placeholder}</div>
            <div className="w-5 h-5 grid place-items-center">
              {!open ? (
                <Icon iconName="expand_more" className="!text-base" />
              ) : (
                <Icon iconName="expand_less" className="!text-base" />
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
            <Popover.Panel className="absolute right-0 z-10 mt-1 min-w-[150px]">
              <div className="overflow-hidden rounded border border-custom-border-300 mt-1 overflow-y-auto bg-custom-background-90 shadow-custom-shadow-2xs focus:outline-none">
                {children}
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  </div>
);
