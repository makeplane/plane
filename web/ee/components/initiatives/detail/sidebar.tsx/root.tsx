"use client";

import React, { FC, Fragment } from "react";
import { Activity, Info, MessageSquare } from "lucide-react";
import { Tab } from "@headlessui/react";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import useLocalStorage from "@/hooks/use-local-storage";
// Plane-web
import { TInitiative } from "@/plane-web/types/initiative";
// local components
import { InitiativeDetailsActivityRoot } from "./activity";
import { InitiativeDetailsCommentsRoot } from "./comments";
import { InitiativeDetailsProperties } from "./properties";

type TEpicDetailsSidebarProps = {
  workspaceSlug: string;
  initiative: TInitiative;
  isEditable: boolean;
};

const TABS = [
  {
    key: "properties",
    icon: Info,
  },
  {
    key: "comments",
    icon: MessageSquare,
  },
  {
    key: "activity",
    icon: Activity,
  },
];

export const InitiativeDetailsSidebar: FC<TEpicDetailsSidebarProps> = (props) => {
  const { workspaceSlug, initiative, isEditable } = props;

  const { storedValue: currentTab, setValue: setCycleTab } = useLocalStorage(
    `initiative-detail-sidebar-tab-${initiative.id}`,
    "properties"
  );

  const currentTabIndex = (tab: string): number => TABS.findIndex((stat) => stat.key === tab);

  return (
    <div className="flex flex-col p-6 min-w-[360px]">
      <Tab.Group defaultIndex={currentTabIndex(currentTab ? currentTab : "properties")}>
        <div className="flex flex-col gap-4">
          <Tab.List
            as="div"
            className="flex w-full items-center justify-between gap-2 rounded-md text-sm p-1 bg-custom-background-90"
          >
            {TABS.map((tab) => (
              <Tab
                className={cn(
                  `flex items-center justify-center p-1 w-full text-custom-text-100 outline-none focus:outline-none cursor-pointer transition-all rounded`,
                  tab.key === currentTab
                    ? "bg-custom-background-100 text-custom-text-300"
                    : "text-custom-text-400 hover:text-custom-text-300"
                )}
                key={tab.key}
                onClick={() => setCycleTab(tab.key)}
              >
                <tab.icon className="size-4" />
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels>
            <Tab.Panel as={Fragment}>
              <InitiativeDetailsProperties
                workspaceSlug={workspaceSlug}
                initiative={initiative}
                isEditable={isEditable}
              />
            </Tab.Panel>
            <Tab.Panel as={Fragment}>
              <InitiativeDetailsCommentsRoot workspaceSlug={workspaceSlug} initiativeId={initiative.id} />
            </Tab.Panel>
            <Tab.Panel as={Fragment}>
              <InitiativeDetailsActivityRoot workspaceSlug={workspaceSlug} initiativeId={initiative.id} />
            </Tab.Panel>
          </Tab.Panels>
        </div>
      </Tab.Group>
    </div>
  );
};
