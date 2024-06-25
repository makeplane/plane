import React, { FC } from "react";
// headless ui
import { Disclosure, Transition } from "@headlessui/react";

export type TAccordionProps = {
  title: string | React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  handleToggle: () => void;
};

export const Accordion: FC<TAccordionProps> = (props) => {
  const { isOpen, handleToggle, title, children } = props;
  return (
    <Disclosure>
      <Disclosure.Button onClick={handleToggle}>{title}</Disclosure.Button>
      <Transition
        show={isOpen}
        className="overflow-hidden"
        enter="transition-max-height duration-400 ease-in-out"
        enterFrom="max-h-0"
        enterTo="max-h-screen"
        leave="transition-max-height duration-400 ease-in-out"
        leaveFrom="max-h-screen"
        leaveTo="max-h-0"
      >
        <Disclosure.Panel static>{children}</Disclosure.Panel>
      </Transition>
    </Disclosure>
  );
};
