import { Tab } from "@headlessui/react";
import type { LucideProps } from "lucide-react";
import type { FC } from "react";
import React from "react";
// helpers
import { cn } from "../utils";

export type TabListItem = {
  key: string;
  icon?: FC<LucideProps>;
  label?: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
};

type TTabListProps = {
  tabs: TabListItem[];
  tabListClassName?: string;
  tabClassName?: string;
  size?: "sm" | "md" | "lg";
  selectedTab?: string;
  autoWrap?: boolean;
  onTabChange?: (key: string) => void;
};

export function TabList({ autoWrap = true, ...props }: TTabListProps) {
  return autoWrap ? (
    <Tab.Group>
      <TabListInner {...props} />
    </Tab.Group>
  ) : (
    <TabListInner {...props} />
  );
}

function TabListInner({ tabs, tabListClassName, tabClassName, size = "md", selectedTab, onTabChange }: TTabListProps) {
  return (
    <Tab.List
      as="div"
      className={cn(
        "flex w-full min-w-fit items-center justify-between gap-1.5 rounded-md text-13 p-0.5 bg-layer-1",
        tabListClassName
      )}
    >
      {tabs.map((tab) => (
        <Tab
          className={({ selected }) =>
            cn(
              "flex items-center justify-center p-1 min-w-fit w-full font-medium text-primary outline-none focus:outline-none cursor-pointer transition-all rounded-sm",
              (selectedTab ? selectedTab === tab.key : selected)
                ? "bg-layer-transparent-active text-primary shadow-sm"
                : tab.disabled
                  ? "text-placeholder cursor-not-allowed"
                  : "text-placeholder hover:text-tertiary hover:bg-layer-transparent-hover",
              {
                "text-11": size === "sm",
                "text-13": size === "md",
                "text-14": size === "lg",
              },
              tabClassName
            )
          }
          key={tab.key}
          onClick={() => {
            if (!tab.disabled) {
              onTabChange?.(tab.key);
              tab.onClick?.();
            }
          }}
          disabled={tab.disabled}
        >
          {tab.icon && (
            <tab.icon className={cn({ "size-3": size === "sm", "size-4": size === "md", "size-5": size === "lg" })} />
          )}
          {tab.label}
        </Tab>
      ))}
    </Tab.List>
  );
}
