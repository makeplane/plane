import React, { FC, useState, useEffect, useCallback } from "react";
import { Disclosure, Transition } from "@headlessui/react";

export type TCollapsibleProps = {
  title: string | React.ReactNode;
  children: React.ReactNode;
  buttonClassName?: string;
  isOpen?: boolean;
  onToggle?: () => void;
  defaultOpen?: boolean;
};

export const Collapsible: FC<TCollapsibleProps> = (props) => {
  const { title, children, buttonClassName, isOpen, onToggle, defaultOpen } = props;
  // state
  const [localIsOpen, setLocalIsOpen] = useState<boolean>(isOpen || defaultOpen ? true : false);

  useEffect(() => {
    if (isOpen !== undefined) {
      setLocalIsOpen(isOpen);
    }
  }, [isOpen]);

  // handlers
  const handleOnClick = useCallback(() => {
    if (isOpen !== undefined) {
      if (onToggle) onToggle();
    } else {
      setLocalIsOpen((prev) => !prev);
    }
  }, [isOpen, onToggle]);

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
