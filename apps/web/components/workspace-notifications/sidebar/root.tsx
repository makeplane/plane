/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { Tab, Tabs, TabsList } from "@makeplane/propel/components/tabs";
import type { TNotificationTab } from "@plane/constants";
import { NOTIFICATION_TABS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { ContentWrapper, Header, EHeaderVariant, Row, ERowVariant } from "@plane/blocks/layout";
import { cn, getNumberCount } from "@plane/utils";
// hooks
import { useWorkspaceNotifications } from "@/hooks/store/notifications";
import { useWorkspace } from "@/hooks/store/use-workspace";
// local imports
import { NotificationEmptyState } from "./empty-state";
import { AppliedFilters } from "./filters/applied-filter";
import { NotificationSidebarHeader } from "./header";
import { NotificationsLoader } from "./loader";
import { NotificationCardListRoot } from "../notification-card/root";

export const NotificationsSidebarRoot = observer(function NotificationsSidebarRoot() {
  const { workspaceSlug } = useParams();
  // hooks
  const { getWorkspaceBySlug } = useWorkspace();
  const {
    currentSelectedNotificationId,
    unreadNotificationsCount,
    loader,
    notificationIdsByWorkspaceId,
    currentNotificationTab,
    setCurrentNotificationTab,
  } = useWorkspaceNotifications();

  const { t } = useTranslation();
  // derived values
  const workspace = workspaceSlug ? getWorkspaceBySlug(workspaceSlug.toString()) : undefined;
  const notificationIds = workspace ? notificationIdsByWorkspaceId(workspace.id) : undefined;

  const handleTabClick = useCallback(
    (tabValue: TNotificationTab | null) => {
      if (
        tabValue !== null &&
        NOTIFICATION_TABS.some((tab) => tab.value === tabValue) &&
        currentNotificationTab !== tabValue
      ) {
        setCurrentNotificationTab(tabValue);
      }
    },
    [currentNotificationTab, setCurrentNotificationTab]
  );

  if (!workspaceSlug || !workspace) return <></>;

  return (
    <div
      className={cn(
        "relative z-[10] h-full flex-shrink-0 border-0 border-subtle bg-surface-1 transition-all max-md:overflow-hidden md:border-r",
        currentSelectedNotificationId ? "w-0 md:w-3/12" : "w-full md:w-3/12"
      )}
    >
      <div className="relative flex h-full w-full flex-col">
        <Row className="flex h-header flex-shrink-0 border-b border-subtle">
          <NotificationSidebarHeader workspaceSlug={workspaceSlug.toString()} />
        </Row>

        <Header variant={EHeaderVariant.SECONDARY} className="justify-start">
          <Tabs variant="contained" value={currentNotificationTab} onValueChange={handleTabClick}>
            <TabsList aria-label={t("notification.label")}>
              {NOTIFICATION_TABS.map((tab) => {
                const label = t(tab.i18n_label);
                const count = tab.count(unreadNotificationsCount);
                const formattedCount = getNumberCount(count);
                return (
                  <Tab
                    key={tab.value}
                    value={tab.value}
                    label=""
                    aria-label={count > 0 ? `${label} ${formattedCount}` : label}
                    icon={
                      <span className="flex items-center gap-2">
                        <span>{label}</span>
                        {count > 0 && <span>{formattedCount}</span>}
                      </span>
                    }
                  />
                );
              })}
            </TabsList>
          </Tabs>
        </Header>

        {/* applied filters */}
        <AppliedFilters workspaceSlug={workspaceSlug.toString()} />

        {/* rendering notifications */}
        {loader === "init-loader" ? (
          <div className="relative h-full w-full overflow-hidden">
            <NotificationsLoader />
          </div>
        ) : (
          <>
            {notificationIds && notificationIds.length > 0 ? (
              <ContentWrapper variant={ERowVariant.HUGGING}>
                <NotificationCardListRoot workspaceSlug={workspaceSlug.toString()} workspaceId={workspace?.id} />
              </ContentWrapper>
            ) : (
              <div className="relative flex h-full w-full items-center justify-center">
                <NotificationEmptyState currentNotificationTab={currentNotificationTab} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
});
