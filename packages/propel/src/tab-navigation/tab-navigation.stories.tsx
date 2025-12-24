import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
// icons import
import { OverviewIcon } from "../icons/overview-icon";
import { CycleIcon } from "../icons/project/cycle-icon";
import { IntakeIcon } from "../icons/project/intake-icon";
import { ModuleIcon } from "../icons/project/module-icon";
import { PageIcon } from "../icons/project/page-icon";
import { ViewsIcon } from "../icons/project/view-icon";
import { WorkItemsIcon } from "../icons/project/work-items-icon";
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
      <div className="w-[900px] p-8 bg-surface-1">
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
      { key: "overview", name: "Overview", href: "#overview", icon: OverviewIcon },
      { key: "work_items", name: "Work items", href: "#work_items", icon: WorkItemsIcon },
      { key: "cycles", name: "Cycles", href: "#cycles", icon: CycleIcon },
      { key: "modules", name: "Modules", href: "#modules", icon: ModuleIcon },
      { key: "views", name: "Views", href: "#views", icon: ViewsIcon },
      { key: "pages", name: "Pages", href: "#pages", icon: PageIcon },
      { key: "intake", name: "Intake", href: "#intake", icon: IntakeIcon },
    ];

    return (
      <div className="space-y-8">
        {/* Example 1: Navigation with anchor tags (simulating React Router Link) */}
        <div className="space-y-3">
          <div className="text-11 font-medium text-tertiary uppercase tracking-wide">
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
                  <div className="flex items-center gap-2 z-10">
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
        <div className="mt-6 p-4 bg-layer-1 rounded-md">
          <div className="text-11 font-medium text-secondary mb-2">Example Code:</div>
          <pre className="text-11 text-tertiary overflow-x-auto">
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
