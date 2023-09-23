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
            className={`outline-none border border-custom-border-200 text-xs rounded flex items-center gap-2 px-2 py-1.5 hover:bg-custom-background-80 ${
              open ? "text-custom-text-100" : "text-custom-text-200"
            }`}
          >
            <div className="font-medium">{title}</div>
            <div className={`w-3.5 h-3.5 flex items-center justify-center transition-all ${open ? "" : "rotate-180"}`}>
              <ChevronUp width={14} strokeWidth={2} />
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
            <Popover.Panel className="absolute right-0 z-10 mt-1 w-[18.75rem] h-auto max-h-[37.5rem] bg-custom-background-100 border border-custom-border-200 shadow-custom-shadow-rg rounded overflow-y-auto">
              {children}
            </Popover.Panel>
          </Transition>
        </>
      );
    }}
  </Popover>
);
