import { Accordion as BaseAccordion } from "@base-ui-components/react/accordion";
import { PlusIcon } from "lucide-react";
import * as React from "react";

export interface AccordionItem {
  id: string;
  title: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  defaultValue?: string[];
  className?: string;
  itemClassName?: string;
  triggerClassName?: string;
  panelClassName?: string;
  icon?: React.ReactNode;
}

export const Accordion: React.FC<AccordionProps> = ({
  items,
  allowMultiple = false,
  defaultValue = [],
  className = "",
  itemClassName = "",
  triggerClassName = "",
  panelClassName = "",
  icon = <PlusIcon className="mr-2 size-3 shrink-0 transition-all ease-out group-data-[panel-open]:scale-110 group-data-[panel-open]:rotate-45" />,
}) => (
  <BaseAccordion.Root
    defaultValue={defaultValue}
    openMultiple={allowMultiple}
    className={`flex flex-col justify-center text-gray-900 ${className}`}
  >
    {items.map((item) => (
      <BaseAccordion.Item
        key={item.id}
        value={item.id}
        disabled={item.disabled}
        className={`border-b border-gray-200 last:border-0 ${itemClassName}`}
      >
        <BaseAccordion.Header>
          <BaseAccordion.Trigger
            className={`group relative flex w-full items-center justify-between gap-4 bg-gray-50 py-2 pr-1 pl-3 text-left font-medium hover:bg-gray-100 focus-visible:z-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-800 disabled:cursor-not-allowed disabled:opacity-50 ${triggerClassName}`}
          >
            {item.title}
            {icon}
          </BaseAccordion.Trigger>
        </BaseAccordion.Header>
        <BaseAccordion.Panel
          className={`h-[var(--accordion-panel-height)] overflow-hidden text-base text-gray-600 transition-[height] ease-out data-[ending-style]:h-0 data-[starting-style]:h-0 ${panelClassName}`}
        >
          <div className="p-3">{item.content}</div>
        </BaseAccordion.Panel>
      </BaseAccordion.Item>
    ))}
  </BaseAccordion.Root>
);
