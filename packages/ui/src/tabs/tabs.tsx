import React, { FC, Fragment } from "react";
import { Tab } from "@headlessui/react";
import { LucideProps } from "lucide-react";
// helpers
import { useLocalStorage } from "@plane/hooks";
import { cn } from "../../helpers";

type TabItem = {
  key: string;
  icon?: FC<LucideProps>;
  label?: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
};

type TTabsProps = {
  tabs: TabItem[];
  storageKey: string;
  actions?: React.ReactNode;
  defaultTab?: string;
  containerClassName?: string;
  tabListContainerClassName?: string;
  tabListClassName?: string;
  tabClassName?: string;
  tabPanelClassName?: string;
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
  } = props;
  // local storage
  const { storedValue, setValue } = useLocalStorage(`tab-${storageKey}`, defaultTab);

  const currentTabIndex = (tabKey: string): number => tabs.findIndex((tab) => tab.key === tabKey);

  return (
    <div className="flex flex-col w-full h-full">
      <Tab.Group defaultIndex={currentTabIndex(storedValue ?? defaultTab)}>
        <div className={cn("flex flex-col w-full h-full gap-2", containerClassName)}>
          <div className={cn("flex w-full items-center gap-4", tabListContainerClassName)}>
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
                      `flex items-center justify-center p-1 min-w-fit w-full font-medium text-custom-text-100 outline-none focus:outline-none cursor-pointer transition-all rounded`,
                      selected
                        ? "bg-custom-background-100 text-custom-text-100 shadow-sm"
                        : tab.disabled
                          ? "text-custom-text-400 cursor-not-allowed"
                          : "text-custom-text-400 hover:text-custom-text-300 hover:bg-custom-background-80/60",
                      tabClassName
                    )
                  }
                  key={tab.key}
                  onClick={() => {
                    if (!tab.disabled) setValue(tab.key);
                  }}
                  disabled={tab.disabled}
                >
                  {tab.icon && <tab.icon className="size-4" />}
                  {tab.label}
                </Tab>
              ))}
            </Tab.List>
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
};
