import React from "react";
import { ChevronRight } from "lucide-react";
import { Disclosure, Transition } from "@headlessui/react";
// plane imports
import { cn } from "@plane/utils";

type TProps = {
  children: React.ReactNode;
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconVariant?: "outline" | "filled";
};

export const AutomationDetailsMainContentSectionWrapper: React.FC<TProps> = (props) => {
  const { children, title, icon: Icon, iconVariant = "outline" } = props;

  return (
    <Disclosure as="section" defaultOpen className="flex-grow w-full">
      {({ open }) => (
        <>
          <Disclosure.Button
            className={cn(
              "flex items-center gap-4 flex-shrink-0 w-full hover:rounded hover:text-custom-text-100 hover:bg-custom-background-80 py-1.5 px-1"
            )}
            aria-label="Toggle section"
          >
            <h3 className="flex-shrink-0 text-sm font-medium uppercase text-custom-text-200">{title}</h3>
            <div className="flex-grow h-px bg-custom-border-300" />
            <div className="flex-shrink-0 size-4 rounded grid place-items-center outline-none border-none">
              <ChevronRight
                className={cn("size-3.5 transition-transform", {
                  "rotate-90": open,
                })}
              />
            </div>
          </Disclosure.Button>
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
                    <Icon
                      className={cn("size-4", {
                        "fill-white": iconVariant === "filled",
                      })}
                    />
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
