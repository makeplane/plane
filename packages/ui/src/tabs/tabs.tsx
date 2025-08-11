import { Tabs as BaseTabs } from "@base-ui-components/react/tabs";
import React, { FC, useEffect, useState } from "react";
// helpers
import { useLocalStorage } from "@plane/hooks";
import { cn } from "@/utils";
// types
import { TabList, TabListItem } from "./tab-list";

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

export const Tabs: FC<TTabsProps> = (props: TTabsProps) => {
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
    <div className="flex flex-col w-full h-full">
      <BaseTabs.Root value={activeIndex} onValueChange={handleTabChange}>
        <div className={cn("flex flex-col w-full h-full gap-2", containerClassName)}>
          <div className={cn("flex w-full items-center gap-4", tabListContainerClassName)}>
            <TabList
              tabs={tabs}
              tabListClassName={tabListClassName}
              tabClassName={tabClassName}
              size={size}
              selectedTab={tabs[activeIndex]?.key}
              autoWrap={false}
            />
            {actions && <div className="flex-grow">{actions}</div>}
          </div>

          {tabs.map((tab) => (
            <BaseTabs.Panel key={tab.key} className={cn("relative outline-none", tabPanelClassName)}>
              {tab.content}
            </BaseTabs.Panel>
          ))}
        </div>
      </BaseTabs.Root>
    </div>
  );
};
