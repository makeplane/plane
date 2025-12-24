import { Disclosure, Transition } from "@headlessui/react";
import React, { useState, useEffect, useCallback } from "react";

export type TCollapsibleProps = {
  title: string | React.ReactNode;
  children: React.ReactNode;
  buttonRef?: React.RefObject<HTMLButtonElement>;
  className?: string;
  buttonClassName?: string;
  isOpen?: boolean;
  onToggle?: () => void;
  defaultOpen?: boolean;
};

export function Collapsible(props: TCollapsibleProps) {
  const { title, children, buttonRef, className, buttonClassName, isOpen, onToggle, defaultOpen } = props;
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
    <Disclosure as="div" className={className}>
      <Disclosure.Button ref={buttonRef} className={buttonClassName} onClick={handleOnClick}>
        {title}
      </Disclosure.Button>
      <Transition
        show={localIsOpen}
        enter="transition-all duration-300 ease-in-out"
        enterFrom="grid-rows-[0fr] opacity-0"
        enterTo="grid-rows-[1fr] opacity-100"
        leave="transition-all duration-300 ease-in-out"
        leaveFrom="grid-rows-[1fr] opacity-100"
        leaveTo="grid-rows-[0fr] opacity-0"
        className="grid overflow-hidden"
      >
        <Disclosure.Panel static className="min-h-0">
          {children}
        </Disclosure.Panel>
      </Transition>
    </Disclosure>
  );
}
