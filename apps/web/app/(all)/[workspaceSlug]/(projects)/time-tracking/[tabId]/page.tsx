/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useLocation } from "react-router";
import { useRouter } from "next/navigation";
// plane imports
import { TIME_TRACKING_DEFAULT_TAB, TIME_TRACKING_TABS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Tabs } from "@plane/propel/tabs";
import type { TTimeTrackingTab } from "@plane/types";
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { IssuePeekOverview } from "@/components/issues/peek-overview";
import { EntriesRoot } from "@/components/time-tracking/entries/entries-root";
import { ReportsRoot } from "@/components/time-tracking/reports/reports-root";
import { TimesheetRoot } from "@/components/time-tracking/timesheet/timesheet-root";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
import { useTimeTrackingPermissions } from "@/hooks/time-tracking/use-time-tracking-permissions";
import type { Route } from "./+types/page";

const TAB_CONTENT: Record<TTimeTrackingTab, React.FC<{ workspaceSlug: string }>> = {
  timesheet: TimesheetRoot,
  entries: EntriesRoot,
  reports: ReportsRoot,
};

function TimeTrackingPage({ params }: Route.ComponentProps) {
  const { workspaceSlug, tabId } = params;
  const router = useRouter();
  const { search } = useLocation();
  const { t } = useTranslation();
  const { currentWorkspace } = useWorkspace();
  const { workspaceUserInfo } = useUserPermissions();
  const { canView } = useTimeTrackingPermissions(workspaceSlug);

  const selectedTab: TTimeTrackingTab = TIME_TRACKING_TABS.includes(tabId as TTimeTrackingTab)
    ? (tabId as TTimeTrackingTab)
    : TIME_TRACKING_DEFAULT_TAB;
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - ${t("time-tracking.title")}` : undefined;

  if (workspaceUserInfo[workspaceSlug] && !canView) return <NotAuthorizedView section="general" />;

  // changing tab keeps the filters in the query string
  const handleTabChange = (value: string) => router.push(`/${workspaceSlug}/time-tracking/${value}/${search}`);

  return (
    <>
      <PageHead title={pageTitle} />
      <Tabs value={selectedTab} onValueChange={handleTabChange} className="flex h-full w-full flex-col overflow-hidden">
        <div className="flex w-full items-center border-b border-subtle bg-surface-1 px-page-x py-2">
          <Tabs.List className="flex h-7 w-fit overflow-x-auto">
            {TIME_TRACKING_TABS.map((tab) => (
              <Tabs.Trigger key={tab} value={tab} size="md" className="h-6 px-3">
                {t(`time-tracking.tabs.${tab}`)}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
        </div>
        {TIME_TRACKING_TABS.map((tab) => {
          const Content = TAB_CONTENT[tab];
          return (
            <Tabs.Content key={tab} value={tab} className="h-full overflow-hidden overflow-y-auto">
              {tab === selectedTab && <Content workspaceSlug={workspaceSlug} />}
            </Tabs.Content>
          );
        })}
      </Tabs>
      {/* work items clicked in the entries table open in the peek view */}
      <IssuePeekOverview />
    </>
  );
}

export default observer(TimeTrackingPage);
