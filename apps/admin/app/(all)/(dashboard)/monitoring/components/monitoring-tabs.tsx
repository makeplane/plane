/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { cn } from "@plane/utils";
import type { TMonitoringTab } from "@/store/monitoring.types";

type Props = {
  activeTab: TMonitoringTab;
  onTabChange: (tab: TMonitoringTab) => void;
};

const TABS: { key: TMonitoringTab; label: string }[] = [
  { key: "issue-email-logs", label: "Issue Email Logs" },
  { key: "scheduled-jobs", label: "Scheduled Jobs" },
  { key: "worker-health", label: "Worker Health" },
];

export const MonitoringTabs = ({ activeTab, onTabChange }: Props) => (
  <div className="flex items-center gap-2 border-b border-subtle pb-2">
    {TABS.map((tab) => (
      <button
        key={tab.key}
        type="button"
        onClick={() => onTabChange(tab.key)}
        className={cn(
          "px-3 py-1.5 text-body-sm-medium rounded-md transition-colors",
          activeTab === tab.key ? "bg-primary/10 text-primary" : "text-secondary hover:bg-surface-2 hover:text-primary"
        )}
      >
        {tab.label}
      </button>
    ))}
  </div>
);
