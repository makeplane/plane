import * as React from "react";
import { Accordion as BaseAccordion } from "@base-ui-components/react";
import { PlusIcon } from "lucide-react";

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

const AccordionRoot: React.FC<AccordionRootProps> = ({
  defaultValue = [],
  allowMultiple = false,
  className = "",
  children,
}) => (
  <BaseAccordion.Root defaultValue={defaultValue} openMultiple={allowMultiple} className={`text-base ${className}`}>
    {children}
  </BaseAccordion.Root>
);

const AccordionItem: React.FC<AccordionItemProps> = ({ value, disabled, className = "", children }) => (
  <BaseAccordion.Item value={value} disabled={disabled} className={`relative ${className}`}>
    {children}
  </BaseAccordion.Item>
);

const AccordionTrigger: React.FC<AccordionTriggerProps> = ({
  className = "",
  icon = <PlusIcon aria-hidden="true" className="transition-all ease-out  group-data-[panel-open]:rotate-45" />,
  iconClassName = "",
  children,
  asChild = false,
}) => (
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

const AccordionContent: React.FC<AccordionContentProps> = ({
  className = "",
  contentWrapperClassName = "",
  children,
}) => (
  <BaseAccordion.Panel
    className={`h-[var(--accordion-panel-height)] overflow-hidden transition-[height] ease-out data-[ending-style]:h-0 data-[starting-style]:h-0 ${className}`}
  >
    <div className={`py-2 ${contentWrapperClassName}`}>{children}</div>
  </BaseAccordion.Panel>
);

export const Accordion = {
  Root: AccordionRoot,
  Item: AccordionItem,
  Trigger: AccordionTrigger,
  Content: AccordionContent,
};
