import React, { useState, useEffect, useCallback } from "react";
import { Collapsible as BaseCollapsible } from "@base-ui-components/react/collapsible";
import clsx from "clsx";

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

export const Collapsible: React.FC<TCollapsibleProps> = (props) => {
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
    <BaseCollapsible.Root
      className={clsx(className)}
      defaultOpen={defaultOpen}
      open={localIsOpen}
      onOpenChange={handleOnClick}
    >
      <BaseCollapsible.Trigger data-panel-open={localIsOpen} ref={buttonRef} className={buttonClassName}>
        {title}
      </BaseCollapsible.Trigger>
      <BaseCollapsible.Panel className="flex h-[var(--collapsible-panel-height)] flex-col overflow-hidden text-sm transition-all ease-out data-[ending-style]:h-0 data-[starting-style]:h-0">
        {children}
      </BaseCollapsible.Panel>
    </BaseCollapsible.Root>
  );
};
