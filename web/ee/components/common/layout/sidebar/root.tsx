"use client";

import React, { FC } from "react";
import { LucideProps } from "lucide-react";
// ui
import { Tabs } from "@plane/ui";
// local components
import { SidebarWrapper } from "./sidebar-wrapper";

type TabItem = {
  key: string;
  icon?: FC<LucideProps>;
  label?: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
};

type TSidebarRootProps = {
  isSidebarOpen: boolean;
  tabs: TabItem[];
  storageKey: string;
  defaultTab: string;
};

export const SidebarRoot: FC<TSidebarRootProps> = (props) => {
  const { isSidebarOpen, tabs, storageKey, defaultTab } = props;
  return (
    <SidebarWrapper isSidebarOpen={isSidebarOpen}>
      <Tabs
        tabs={tabs}
        storageKey={storageKey}
        defaultTab={defaultTab}
        containerClassName="gap-4"
        tabListContainerClassName="px-6"
        tabPanelClassName="h-full"
      />
    </SidebarWrapper>
  );
};
