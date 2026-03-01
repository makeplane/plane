/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { FC } from "react";
import React from "react";
import type { LucideProps } from "lucide-react";

// local components
import { useLocalStorage } from "@plane/hooks";
import { Tabs } from "@plane/propel/tabs";
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

export function SidebarRoot(props: TSidebarRootProps) {
  const { isSidebarOpen, tabs, storageKey, defaultTab } = props;
  const { storedValue, setValue } = useLocalStorage(storageKey, defaultTab);

  return (
    <SidebarWrapper isSidebarOpen={isSidebarOpen}>
      <Tabs defaultValue={storedValue ?? defaultTab} onValueChange={setValue}>
        <Tabs.List>
          {tabs.map((tab) => (
            <Tabs.Trigger key={tab.key} value={tab.key}>
              {tab.icon && <tab.icon className="size-4" />}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <div className="pt-4 flex-1 overflow-y-auto">
          {tabs.map((tab) => (
            <Tabs.Content key={tab.key} value={tab.key} className="h-full">
              {tab.content}
            </Tabs.Content>
          ))}
        </div>
      </Tabs>
    </SidebarWrapper>
  );
}
