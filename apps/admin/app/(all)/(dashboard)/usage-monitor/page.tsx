/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
// components
import { PageWrapper } from "@/components/common/page-wrapper";
// local imports
import { ActiveUsersDashboard } from "./components/active-users-dashboard";
import { DepartmentsDashboard } from "./components/departments-dashboard";
import { StandardUsersDashboard } from "./components/standard-users-dashboard";
import { UsageFilterBar } from "./components/usage-filter-bar";
import { UsageMonitorTabs } from "./components/usage-monitor-tabs";
// types
import type { TUsageMonitorTab } from "@/store/usage-monitor.types";
import type { Route } from "./+types/page";

const UsageMonitorPageContent = () => {
  const [activeTab, setActiveTab] = useState<TUsageMonitorTab>("active-users");

  return (
    <PageWrapper
      header={{
        title: "Usage Monitor",
        description: "Worklog-based activity across the instance — measures users who logged time, not logins.",
      }}
    >
      <div className="space-y-4">
        <UsageFilterBar />
        <UsageMonitorTabs activeTab={activeTab} onTabChange={setActiveTab} />
        {activeTab === "active-users" && <ActiveUsersDashboard />}
        {activeTab === "standard-users" && <StandardUsersDashboard />}
        {activeTab === "departments" && <DepartmentsDashboard />}
      </div>
    </PageWrapper>
  );
};

const UsageMonitorPage = observer(UsageMonitorPageContent);

// eslint-disable-next-line react-refresh/only-export-components
export const meta: Route.MetaFunction = () => [{ title: "Usage Monitor - God Mode" }];

export default UsageMonitorPage;
