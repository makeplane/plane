import * as React from "react";
import { Accordion as BaseAccordion } from "@base-ui-components/react";

import { PlusIcon } from "../icons";

export interface AccordionRootProps {
  defaultValue?: string[];
  allowMultiple?: boolean;
  className?: string;
  children: React.ReactNode;
}

export interface AccordionItemProps {
  value: string;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

export interface AccordionTriggerProps {
  className?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  asChild?: boolean;
  iconClassName?: string;
}

export interface AccordionContentProps {
  className?: string;
  contentWrapperClassName?: string;
  children: React.ReactNode;
}

function AccordionRoot({ defaultValue = [], allowMultiple = false, className = "", children }: AccordionRootProps) {
  return (
    <BaseAccordion.Root defaultValue={defaultValue} openMultiple={allowMultiple} className={`text-14 ${className}`}>
      {children}
    </BaseAccordion.Root>
  );
}

function AccordionItem({ value, disabled, className = "", children }: AccordionItemProps) {
  return (
    <BaseAccordion.Item value={value} disabled={disabled} className={`relative ${className}`}>
      {children}
    </BaseAccordion.Item>
  );
}

function AccordionTrigger({
  className = "",
  icon = <PlusIcon aria-hidden="true" className="transition-all ease-out  group-data-[panel-open]:rotate-45" />,
  iconClassName = "",
  children,
  asChild = false,
}: AccordionTriggerProps) {
  return (
    <BaseAccordion.Header>
      {asChild ? (
        <BaseAccordion.Trigger className={`w-full py-2 ${className}`}>{children}</BaseAccordion.Trigger>
      ) : (
        <BaseAccordion.Trigger className={`flex w-full items-center justify-between gap-2 py-2 ${className}`}>
          {children}
          <span aria-hidden="true" className={`flex-shrink-0 ${iconClassName}`}>
            {icon}
          </span>
        </BaseAccordion.Trigger>
      )}
    </BaseAccordion.Header>
  );
}

function AccordionContent({ className = "", contentWrapperClassName = "", children }: AccordionContentProps) {
  return (
    <BaseAccordion.Panel
      className={`h-[var(--accordion-panel-height)] overflow-hidden transition-[height] ease-out data-[ending-style]:h-0 data-[starting-style]:h-0 ${className}`}
    >
      <div className={`py-2 ${contentWrapperClassName}`}>{children}</div>
    </BaseAccordion.Panel>
  );
}

export const Accordion = {
  Root: AccordionRoot,
  Item: AccordionItem,
  Trigger: AccordionTrigger,
  Content: AccordionContent,
};
