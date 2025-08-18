import React from "react";
import { ChevronRight } from "lucide-react";
import { Disclosure, Transition } from "@headlessui/react";
// plane imports
import { cn } from "@plane/utils";

type TProps = {
  actionButtons?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  headerActions?: React.ReactNode;
  title: string;
};

// TODO: Check if we can use collapsible component from plane-ui
export const AutomationDetailsSidebarSectionWrapper: React.FC<TProps> = (props) => {
  const { actionButtons, children, defaultOpen = true, headerActions, title } = props;

  return (
    <Disclosure as="section" defaultOpen={defaultOpen} className="flex-grow">
      {({ open }) => (
        <>
          <div
            className={cn("flex items-center gap-2 border-b pb-1.5", {
              "border-transparent px-6": open,
              "border-custom-border-200 mx-6": !open,
            })}
          >
            <h3
              className={cn("flex-shrink-0 text-[9px] font-semibold uppercase transition-colors", {
                "text-custom-text-300": open,
                "text-custom-text-400": !open,
              })}
            >
              {title}
            </h3>
            <div className="flex-grow h-px" />
            {headerActions}
            <Disclosure.Button
              className={cn(
                "flex-shrink-0 size-4 rounded hover:text-custom-text-100 hover:bg-custom-background-80 grid place-items-center outline-none border-none transition-colors",
                {
                  "text-custom-text-200": open,
                  "text-custom-text-300": !open,
                }
              )}
              aria-label="Toggle section"
            >
              {({ open }) => (
                <ChevronRight
                  className={cn("size-3.5 transition-transform", {
                    "rotate-90": open,
                  })}
                />
              )}
            </Disclosure.Button>
          </div>
          <Transition
            enter="transition duration-100 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
          >
            <Disclosure.Panel className="mt-4 space-y-4">
              <div className="px-6 space-y-4">{children}</div>
              {actionButtons}
            </Disclosure.Panel>
          </Transition>
        </>
      )}
    </Disclosure>
  );
};
