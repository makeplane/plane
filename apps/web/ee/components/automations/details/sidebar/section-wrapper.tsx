import React from "react";
import { ChevronRight } from "lucide-react";
import { Disclosure, Transition } from "@headlessui/react";
// plane imports
import { cn } from "@plane/utils";

type TProps = {
  actionButtons?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  headerActions?: React.ReactNode | ((open: boolean) => React.ReactNode);
  title: string;
};

export const AutomationDetailsSidebarSectionWrapper: React.FC<TProps> = (props) => {
  const { actionButtons, children, defaultOpen = true, headerActions, title } = props;

  return (
    <Disclosure as="section" defaultOpen={defaultOpen} className="flex-grow w-full">
      {({ open }) => (
        <>
          <div className="px-3">
            <Disclosure.Button
              className={cn(
                "group/section-wrapper flex items-center gap-2 py-1.5 px-1 flex-shrink-0 w-full hover:rounded hover:text-custom-text-100 hover:bg-custom-background-80"
              )}
              aria-label="Toggle section"
            >
              <h3 className="flex-shrink-0 text-[9px] font-semibold uppercase text-custom-text-200">{title}</h3>
              <div className="flex-grow h-px" />
              {typeof headerActions === "function" ? headerActions(open) : headerActions}
              <div className="flex-shrink-0 size-4 rounded grid place-items-center outline-none border-none">
                <ChevronRight className={cn("size-3.5 transition-transform", { "rotate-90": open })} />
              </div>
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
            <Disclosure.Panel className="mt-2 space-y-3">
              <div className="space-y-3 px-4">{children}</div>
              {actionButtons}
            </Disclosure.Panel>
          </Transition>
        </>
      )}
    </Disclosure>
  );
};
