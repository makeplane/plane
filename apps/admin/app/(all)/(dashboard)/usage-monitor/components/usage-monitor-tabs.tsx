/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { cn } from "@plane/utils";
import type { TUsageMonitorTab } from "@/store/usage-monitor.types";

type Props = {
  activeTab: TUsageMonitorTab;
  onTabChange: (tab: TUsageMonitorTab) => void;
};

const TABS: { key: TUsageMonitorTab; label: string }[] = [
  { key: "active-users", label: "Active Users" },
  { key: "standard-users", label: "Standard Users" },
  { key: "departments", label: "Departments" },
];

export const UsageMonitorTabs = ({ activeTab, onTabChange }: Props) => (
  <div className="flex items-center gap-2 border-b border-subtle pb-2">
    {TABS.map((tab) => (
      <button
        key={tab.key}
        type="button"
        onClick={() => onTabChange(tab.key)}
        className={cn(
          "px-3 py-1.5 text-body-sm-medium rounded-md transition-colors",
          activeTab === tab.key
            ? "bg-accent-subtle text-accent-primary"
            : "text-secondary hover:bg-surface-2 hover:text-primary"
        )}
      >
        {tab.label}
      </button>
    ))}
  </div>
);
