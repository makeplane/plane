import React, { FC, useState, useEffect, useCallback } from "react";
import { Disclosure, Transition } from "@headlessui/react";

export type TAccordionProps = {
  title: string | React.ReactNode;
  children: React.ReactNode;
  buttonClassName?: string;
  isOpen?: boolean;
  handleToggle?: () => void;
  defaultOpen?: boolean;
};

export const Accordion: FC<TAccordionProps> = (props) => {
  const { title, children, buttonClassName, isOpen, handleToggle, defaultOpen } = props;
  // state
  const [localIsOpen, setLocalIsOpen] = useState<boolean>(isOpen || defaultOpen ? true : false);

  useEffect(() => {
    if (isOpen !== undefined) {
      setLocalIsOpen(isOpen);
    }
  }, [isOpen]);

  // handlers
  const handleOnClick = useCallback(() => {
    setLocalIsOpen((prev) => !prev);
    if (handleToggle) handleToggle();
  }, [handleToggle]);

  return (
    <Disclosure>
      <Disclosure.Button className={buttonClassName} onClick={handleOnClick}>
        {title}
      </Disclosure.Button>
      <Transition
        show={localIsOpen}
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
