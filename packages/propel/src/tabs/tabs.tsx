import { Tabs as BaseTabs } from "@base-ui-components/react/tabs";
import React, { FC, useEffect, useState } from "react";
// helpers
import { useLocalStorage } from "@plane/hooks";

// types
import { TabList, TabListItem } from "./tab-list";
import { cn } from "@plane/utils";

export type TabContent = {
  content: React.ReactNode;
};

export type TabItem<TKey = string> = TabListItem<TKey> & TabContent;

type TTabsProps<TTabs extends TabItem<string>[]> = {
  tabs: TTabs;
  storageKey?: string;
  actions?: React.ReactNode;
  defaultTab?: TTabs[number]["key"];
  containerClassName?: string;
  tabListContainerClassName?: string;
  tabListClassName?: string;
  tabClassName?: string;
  tabPanelClassName?: string;
  size?: "sm" | "md" | "lg";
  storeInLocalStorage?: boolean;
};

export const Tabs = <TTabs extends TabItem<string>[]>(props: TTabsProps<TTabs>) => {
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

  const { storedValue, setValue } = useLocalStorage(
    storeInLocalStorage && storageKey ? `tab-${storageKey}` : `tab-${tabs[0]?.key}`,
    defaultTab
  );

  const [activeIndex, setActiveIndex] = useState(() => {
    const initialTab = storedValue ?? defaultTab;
    return tabs.findIndex((tab) => tab.key === initialTab);
  });

  useEffect(() => {
    if (storeInLocalStorage && tabs[activeIndex]) {
      setValue(tabs[activeIndex].key);
    }
  }, [activeIndex, setValue, storeInLocalStorage, tabs]);

  const handleTabChange = (index: number) => {
    setActiveIndex(index);
    if (!tabs[index].disabled) {
      tabs[index].onClick?.();
    }
  };

  return (
    <BaseTabs.Root
      value={activeIndex}
      onValueChange={handleTabChange}
      className={cn("flex flex-col h-full overflow-hidden gap-3", containerClassName)}
    >
      <div className={cn("flex w-full items-center gap-4", tabListContainerClassName)}>
        <TabList
          tabs={tabs}
          tabListClassName={tabListClassName}
          tabClassName={tabClassName}
          size={size}
          selectedTab={tabs[activeIndex]?.key}
        />
        {actions && <div className="flex-grow">{actions}</div>}
      </div>

      {tabs.map((tab) => (
        <BaseTabs.Panel key={tab.key} className={cn("relative  h-full overflow-auto", tabPanelClassName)}>
          {tab.content}
        </BaseTabs.Panel>
      ))}
    </BaseTabs.Root>
  );
};
