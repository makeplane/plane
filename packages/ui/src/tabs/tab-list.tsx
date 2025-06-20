import { Tab } from "@headlessui/react";
import { LucideProps } from "lucide-react";
import React, { FC } from "react";
// helpers
import { cn } from "../../helpers";

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
  onTabChange?: (key: string) => void;
};

export const TabList: FC<TTabListProps> = ({
  tabs,
  tabListClassName,
  tabClassName,
  size = "md",
  selectedTab,
  onTabChange,
}) => (
  <Tab.List
    as="div"
    className={cn(
      "flex w-full min-w-fit items-center justify-between gap-1.5 rounded-md text-sm p-0.5 bg-custom-background-80/60",
      tabListClassName
    )}
  >
    {tabs.map((tab) => (
      <Tab
        className={({ selected }) =>
          cn(
            "flex items-center justify-center p-1 min-w-fit w-full font-medium text-custom-text-100 outline-none focus:outline-none cursor-pointer transition-all rounded",
            (selectedTab ? selectedTab === tab.key : selected)
              ? "bg-custom-background-100 text-custom-text-100 shadow-sm"
              : tab.disabled
                ? "text-custom-text-400 cursor-not-allowed"
                : "text-custom-text-400 hover:text-custom-text-300 hover:bg-custom-background-80/60",
            {
              "text-xs": size === "sm",
              "text-sm": size === "md",
              "text-base": size === "lg",
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
        {tab.icon && <tab.icon className="size-4" />}
        {tab.label}
      </Tab>
    ))}
  </Tab.List>
);
