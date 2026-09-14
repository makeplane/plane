/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
// icons import
import {
  CyclesOutline,
  IntakeOutline,
  ModuleOutline,
  OverviewOutline,
  PagesOutline,
  ViewsOutline,
  WorkItemsOutline,
} from "@makeplane/propel/icons";
// tab navigation import
import { TabNavigationItem } from "./tab-navigation-item";
import { TabNavigationList } from "./tab-navigation-list";

const meta: Meta<typeof TabNavigationList> = {
  title: "Components/TabNavigation",
  component: TabNavigationList,
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="w-[900px] bg-surface-1 p-8">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render() {
    const [activeNavTab, setActiveNavTab] = useState("work_items");

    // Example navigation items (matching actual Plane project navigation)
    const navItems = [
      { key: "overview", name: "Overview", href: "#overview", icon: OverviewOutline },
      { key: "work_items", name: "Work items", href: "#work_items", icon: WorkItemsOutline },
      { key: "cycles", name: "Cycles", href: "#cycles", icon: CyclesOutline },
      { key: "modules", name: "Modules", href: "#modules", icon: ModuleOutline },
      { key: "views", name: "Views", href: "#views", icon: ViewsOutline },
      { key: "pages", name: "Pages", href: "#pages", icon: PagesOutline },
      { key: "intake", name: "Intake", href: "#intake", icon: IntakeOutline },
    ];

    return (
      <div className="space-y-8">
        {/* Example 1: Navigation with anchor tags (simulating React Router Link) */}
        <div className="space-y-3">
          <div className="text-11 font-medium tracking-wide text-tertiary uppercase">
            With Navigation Links (e.g., React Router)
          </div>
          <TabNavigationList>
            {navItems.map((item) => (
              <a
                key={item.key}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveNavTab(item.key);
                }}
              >
                <TabNavigationItem isActive={activeNavTab === item.key}>
                  <div className="z-10 flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </div>
                </TabNavigationItem>
              </a>
            ))}
          </TabNavigationList>
          <div className="text-11 text-tertiary">
            Active: <span className="font-mono text-primary">{activeNavTab}</span>
          </div>
        </div>

        {/* Code example */}
        <div className="mt-6 rounded-md bg-layer-1 p-4">
          <div className="mb-2 text-11 font-medium text-secondary">Example Code:</div>
          <pre className="overflow-x-auto text-11 text-tertiary">
            {`// With React Router Link
<TabNavigationList>
  {items.map(item => (
    <Link key={item.key} to={item.href}>
      <TabNavigationItem isActive={pathname === item.href}>
        <item.icon className="h-4 w-4" />
        <span>{item.name}</span>
      </TabNavigationItem>
    </Link>
  ))}
</TabNavigationList>
`}
          </pre>
        </div>
      </div>
    );
  },
};
