import React, { useState, useEffect, useCallback, createContext, useContext } from "react";
import { Collapsible as BaseCollapsible } from "@base-ui-components/react/collapsible";
import clsx from "clsx";

// Types
type CollapsibleContextType = {
  isOpen: boolean;
  onToggle: () => void;
};

type RootProps = {
  children: React.ReactNode;
  className?: string;
  isOpen?: boolean;
  onToggle?: () => void;
  defaultOpen?: boolean;
};

type TriggerProps = {
  children: React.ReactNode;
  className?: string;
  buttonRef?: React.RefObject<HTMLButtonElement>;
};

type ContentProps = {
  children: React.ReactNode;
  className?: string;
};

// Context
const CollapsibleContext = createContext<CollapsibleContextType | undefined>(undefined);

// Hook
const useCollapsible = () => {
  const context = useContext(CollapsibleContext);
  if (!context) {
    throw new Error("Collapsible compound components cannot be rendered outside the Collapsible component");
  }
  return context;
};

// Components
const Root: React.FC<RootProps> = ({ children, className, isOpen: controlledIsOpen, onToggle, defaultOpen }) => {
  const [localIsOpen, setLocalIsOpen] = useState<boolean>(controlledIsOpen || defaultOpen || false);

  useEffect(() => {
    if (controlledIsOpen !== undefined) {
      setLocalIsOpen(controlledIsOpen);
    }
  }, [controlledIsOpen]);

  const handleToggle = useCallback(() => {
    if (controlledIsOpen !== undefined) {
      onToggle?.();
    } else {
      setLocalIsOpen((prev) => !prev);
    }
  }, [controlledIsOpen, onToggle]);

  return (
    <CollapsibleContext.Provider value={{ isOpen: localIsOpen, onToggle: handleToggle }}>
      <BaseCollapsible.Root
        className={clsx(className)}
        defaultOpen={defaultOpen}
        open={localIsOpen}
        onOpenChange={handleToggle}
      >
        {children}
      </BaseCollapsible.Root>
    </CollapsibleContext.Provider>
  );
};

const Trigger: React.FC<TriggerProps> = ({ children, className, buttonRef }) => {
  const { isOpen } = useCollapsible();

  return (
    <BaseCollapsible.Trigger data-panel-open={isOpen} ref={buttonRef} className={className}>
      {children}
    </BaseCollapsible.Trigger>
  );
};

const Content: React.FC<ContentProps> = ({ children, className }) => (
  <BaseCollapsible.Panel
    className={clsx(
      "flex h-[var(--collapsible-panel-height)] flex-col overflow-hidden text-sm transition-all ease-out data-[ending-style]:h-0 data-[starting-style]:h-0",
      className
    )}
  >
    {children}
  </BaseCollapsible.Panel>
);

// Compound Component
export const Collapsible = {
  CollapsibleRoot: Root,
  CollapsibleTrigger: Trigger,
  CollapsibleContent: Content,
};
