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

import preview from "#.storybook/preview";
import { OverviewIcon } from "../icons/overview-icon";
import { CycleIcon } from "../icons/project/cycle-icon";
import { IntakeIcon } from "../icons/project/intake-icon";
import { ModuleIcon } from "../icons/project/module-icon";
import { PageIcon } from "../icons/project/page-icon";
import { ViewsIcon } from "../icons/project/view-icon";
import { WorkItemsIcon } from "../icons/project/work-items-icon";
import { TabNavigationItem } from "./tab-navigation-item";
import { TabNavigationList } from "./tab-navigation-list";

const meta = preview.meta({
  component: TabNavigationList,
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="w-[900px] p-8 bg-surface-1">
        <Story />
      </div>
    ),
  ],
});

const navItems = [
  { key: "overview", name: "Overview", icon: OverviewIcon },
  { key: "work_items", name: "Work items", icon: WorkItemsIcon },
  { key: "cycles", name: "Cycles", icon: CycleIcon },
  { key: "modules", name: "Modules", icon: ModuleIcon },
  { key: "views", name: "Views", icon: ViewsIcon },
  { key: "pages", name: "Pages", icon: PageIcon },
  { key: "intake", name: "Intake", icon: IntakeIcon },
];

export const Default = meta.story({
  args: { children: null },
  render() {
    return (
      <TabNavigationList>
        {navItems.map((item) => (
          <TabNavigationItem key={item.key} isActive={item.key === "work_items"}>
            <div className="flex items-center gap-2 z-10">
              <item.icon className="h-4 w-4" />
              <span>{item.name}</span>
            </div>
          </TabNavigationItem>
        ))}
      </TabNavigationList>
    );
  },
});
