import { Tab } from "@headlessui/react";
import type { FC } from "react";
import React, { Fragment, useEffect, useState } from "react";
// helpers
import { useLocalStorage } from "@plane/hooks";
import { cn } from "../utils";
// types
import type { TabListItem } from "./tab-list";
import { TabList } from "./tab-list";

export type TabContent = {
  content: React.ReactNode;
};

export type TabItem = TabListItem & TabContent;

type TTabsProps = {
  tabs: TabItem[];
  storageKey?: string;
  actions?: React.ReactNode;
  defaultTab?: string;
  containerClassName?: string;
  tabListContainerClassName?: string;
  tabListClassName?: string;
  tabClassName?: string;
  tabPanelClassName?: string;
  size?: "sm" | "md" | "lg";
  storeInLocalStorage?: boolean;
};

export function Tabs(props: TTabsProps) {
  const {
    tabs,
    storageKey,
    actions,
    defaultTab = tabs[0]?.key,
    containerClassName = "",
    tabListContainerClassName = "",
    tabListClassName = "",
    tabClassName = "",
    tabPanelClassName = "",
    size = "md",
    storeInLocalStorage = true,
  } = props;
  // local storage
  const { storedValue, setValue } = useLocalStorage(
    storeInLocalStorage && storageKey ? `tab-${storageKey}` : `tab-${tabs[0]?.key}`,
    defaultTab
  );
  // state
  const [selectedTab, setSelectedTab] = useState(storedValue ?? defaultTab);

  useEffect(() => {
    if (storeInLocalStorage) {
      setValue(selectedTab);
    }
  }, [selectedTab, setValue, storeInLocalStorage, storageKey]);

  const currentTabIndex = (tabKey: string): number => tabs.findIndex((tab) => tab.key === tabKey);

  const handleTabChange = (key: string) => {
    setSelectedTab(key);
  };

  return (
    <div className="flex flex-col w-full h-full">
      <Tab.Group defaultIndex={currentTabIndex(selectedTab)}>
        <div className={cn("flex flex-col w-full h-full gap-2", containerClassName)}>
          <div className={cn("flex w-full items-center gap-4", tabListContainerClassName)}>
            <TabList
              tabs={tabs}
              tabListClassName={tabListClassName}
              tabClassName={tabClassName}
              size={size}
              onTabChange={handleTabChange}
            />
            {actions && <div className="flex-grow">{actions}</div>}
          </div>
          <Tab.Panels as={Fragment}>
            {tabs.map((tab) => (
              <Tab.Panel key={tab.key} as="div" className={cn("relative outline-none", tabPanelClassName)}>
                {tab.content}
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </div>
      </Tab.Group>
    </div>
  );
}
