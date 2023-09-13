import { Fragment } from "react";
// headless ui
import { Popover, Transition } from "@headlessui/react";
// lucide icons
import { ChevronDown, ChevronUp } from "lucide-react";

interface IIssueDropdown {
  children: React.ReactNode;
  title?: string;
}

export const IssueDropdown = ({ children, title = "Dropdown" }: IIssueDropdown) => (
  <Popover className="relative">
    {({ open }) => {
      if (open) {
      }
      return (
        <>
          <Popover.Button
            className={`outline-none border border-custom-border-200 text-xs rounded flex items-center gap-2 p-2 py-1.5 hover:bg-custom-background-100`}
          >
            <div className="font-medium">{title}</div>
            <div className="w-[14px] h-[14px] flex justify-center items-center">
              {open ? (
                <ChevronUp width={14} strokeWidth={2} />
              ) : (
                <ChevronDown width={14} strokeWidth={2} />
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
            <Popover.Panel className="absolute right-0 z-10 mt-1 w-[300px] h-[700px]">
              <div className="w-full h-full overflow-hidden rounded border border-custom-border-200 bg-custom-background-100 shadow-xl">
                {children}
              </div>
            </Popover.Panel>
          </Transition>
        </>
      );
    }}
  </Popover>
);
