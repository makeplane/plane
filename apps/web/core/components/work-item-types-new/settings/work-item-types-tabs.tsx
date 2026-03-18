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

import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// components
import { TabNavigationItem, TabNavigationList } from "@plane/propel/tab-navigation";
import React, { useState } from "react";
import { PropertiesIcon, WorkItemsIcon } from "@plane/propel/icons";
import type { ISvgIcons } from "@plane/propel/icons";

type TWorkItemTypesTab = "types" | "properties";

const NAVIGATION_ITEMS: { key: TWorkItemTypesTab; labelKey: string; icon: React.FC<ISvgIcons> }[] = [
  {
    key: "types",
    labelKey: "work_item_types.label",
    icon: WorkItemsIcon,
  },
  {
    key: "properties",
    labelKey: "work_item_types.settings.properties.title",
    icon: PropertiesIcon,
  },
];

type Props = {
  TypesTab: React.ReactNode;
  PropertiesTab: React.ReactNode;
};

export const WorkItemTypesSettingsTabs = observer(function WorkItemTypesSettingsTabs(props: Props) {
  const { TypesTab, PropertiesTab } = props;
  // translation
  const { t } = useTranslation();
  // states
  const [activeTab, setActiveTab] = useState<TWorkItemTypesTab>("types");

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-subtle-1 pb-2">
        {/* TODO-@plane/propel/tabs - update this once underlined variant for tabs is available */}
        <TabNavigationList>
          {NAVIGATION_ITEMS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className="relative">
                <TabNavigationItem key={tab.key} isActive={activeTab === tab.key}>
                  <Icon className="size-4 text-tertiary" />
                  {t(tab.labelKey)}
                </TabNavigationItem>
                {activeTab === tab.key && (
                  <span className="absolute -bottom-2 w-full left-1/2 -translate-x-1/2 h-0.5 bg-(--text-color-icon-primary) rounded-t-md transition-all duration-300" />
                )}
              </button>
            );
          })}
        </TabNavigationList>
      </div>
      <div>
        {activeTab === "types" && TypesTab}
        {activeTab === "properties" && PropertiesTab}
      </div>
    </div>
  );
});
