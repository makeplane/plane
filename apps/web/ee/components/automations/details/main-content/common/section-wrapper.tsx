import React from "react";
import { ChevronRight } from "lucide-react";
import { Disclosure, Transition } from "@headlessui/react";
// plane imports
import { cn } from "@plane/utils";

type TProps = {
  children: React.ReactNode;
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
};

export const AutomationDetailsMainContentSectionWrapper: React.FC<TProps> = (props) => {
  const { children, title, icon: Icon } = props;

  return (
    <Disclosure as="section" defaultOpen>
      {({ open }) => (
        <>
          <div className="flex items-center gap-4">
            <h3
              className={cn("flex-shrink-0 text-sm font-medium uppercase transition-colors", {
                "text-custom-text-200": open,
                "text-custom-text-300": !open,
              })}
            >
              {title}
            </h3>
            <div
              className={cn("flex-grow h-px transition-colors", {
                "bg-custom-border-400": open,
                "bg-custom-border-300": !open,
              })}
            />
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
            <Disclosure.Panel className="mt-6 space-y-6">
              {Icon ? (
                <div className="flex items-start gap-4">
                  <span className="flex-shrink-0 size-8 rounded-full bg-custom-primary-100 text-white grid place-items-center">
                    <Icon className="size-4 fill-white" />
                  </span>
                  {children}
                </div>
              ) : (
                children
              )}
            </Disclosure.Panel>
          </Transition>
        </>
      )}
    </Disclosure>
  );
};
