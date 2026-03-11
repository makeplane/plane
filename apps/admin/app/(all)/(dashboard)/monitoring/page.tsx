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
import { MonitoringTabs } from "./components/monitoring-tabs";
import { EmailLogsTab } from "./components/email-logs-tab";
import { ScheduledJobsTab } from "./components/scheduled-jobs-tab";
import { WorkerHealthTab } from "./components/worker-health-tab";
// types
import type { TMonitoringTab } from "@/store/monitoring.types";
import type { Route } from "./+types/page";

const MonitoringPageContent = () => {
  const [activeTab, setActiveTab] = useState<TMonitoringTab>("issue-email-logs");

  return (
    <PageWrapper
      header={{
        title: "Monitoring",
        description: "Monitor email delivery, scheduled tasks, and worker health.",
      }}
    >
      <div className="space-y-4">
        <MonitoringTabs activeTab={activeTab} onTabChange={setActiveTab} />
        {activeTab === "issue-email-logs" && <EmailLogsTab />}
        {activeTab === "scheduled-jobs" && <ScheduledJobsTab />}
        {activeTab === "worker-health" && <WorkerHealthTab />}
      </div>
    </PageWrapper>
  );
};

const MonitoringPage = observer(MonitoringPageContent);

export const meta: Route.MetaFunction = () => [{ title: "Monitoring - God Mode" }];

export default MonitoringPage;
