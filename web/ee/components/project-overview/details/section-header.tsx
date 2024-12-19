"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { Disclosure, Transition } from "@headlessui/react";
import { CollapsibleButton } from "@plane/ui";
import { cn } from "@plane/utils";

type TProps = {
  title: string;
  actionButton?: React.ReactNode;
  children?: React.ReactNode;
};
export const SectionHeader = observer((props: TProps) => {
  const { title, actionButton, children } = props;
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Disclosure as="div" defaultOpen>
      <div
        className={cn(
          "flex px-2 bg-custom-sidebar-background-100 group/workspace-button hover:bg-custom-sidebar-background-90 rounded"
        )}
      >
        <Disclosure.Button
          as="button"
          className="flex-1 sticky top-0  z-10 gap-2 w-full flex items-center text-custom-text-300  text-base font-semibold"
          onClick={() => setIsOpen(!isOpen)}
        >
          <CollapsibleButton
            isOpen={isOpen}
            title={title}
            actionItemElement={actionButton ?? null}
            className="w-full !text-custom-text-300"
          />
        </Disclosure.Button>
      </div>

      <Transition
        show={isOpen}
        enter="transition duration-100 ease-out"
        enterFrom="transform scale-95 opacity-0"
        enterTo="transform scale-100 opacity-100"
        leave="transition duration-75 ease-out"
        leaveFrom="transform scale-100 opacity-100"
        leaveTo="transform scale-95 opacity-0"
      >
        {isOpen && (
          <Disclosure.Panel as="div" className={cn("flex flex-col mt-0.5 gap-0.5", {})} static>
            {children}
          </Disclosure.Panel>
        )}
      </Transition>
    </Disclosure>
  );
});
