"use client";
import { FC, useCallback } from "react";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { NOTIFICATION_TABS, TNotificationTab } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// components
import { Header, Row, ERowVariant, EHeaderVariant, ContentWrapper } from "@plane/ui";
import { cn, getNumberCount } from "@plane/utils";
import { CountChip } from "@/components/common";
import {
  NotificationsLoader,
  NotificationEmptyState,
  NotificationSidebarHeader,
  AppliedFilters,
} from "@/components/workspace-notifications";
// hooks
import { useWorkspace, useWorkspaceNotifications } from "@/hooks/store";

import { NotificationListRoot } from "@/plane-web/components/workspace-notifications/list-root";

export const NotificationsSidebarRoot: FC = observer(() => {
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
    (tabValue: TNotificationTab) => {
      if (currentNotificationTab !== tabValue) {
        setCurrentNotificationTab(tabValue);
      }
    },
    [currentNotificationTab, setCurrentNotificationTab]
  );

  if (!workspaceSlug || !workspace) return <></>;

  return (
    <div
      className={cn(
        "relative border-0 md:border-r border-custom-border-200 z-[10] flex-shrink-0 bg-custom-background-100 h-full transition-all max-md:overflow-hidden",
        currentSelectedNotificationId ? "w-0 md:w-2/6" : "w-full md:w-2/6"
      )}
    >
      <div className="relative w-full h-full flex flex-col">
        <Row className="h-header border-b border-custom-border-200 flex flex-shrink-0">
          <NotificationSidebarHeader workspaceSlug={workspaceSlug.toString()} />
        </Row>

        <Header variant={EHeaderVariant.SECONDARY} className="justify-start">
          {NOTIFICATION_TABS.map((tab) => (
            <div
              key={tab.value}
              className="h-full px-3 relative cursor-pointer"
              onClick={() => handleTabClick(tab.value)}
            >
              <div
                className={cn(
                  `relative h-full flex justify-center items-center gap-1 text-sm transition-all`,
                  currentNotificationTab === tab.value
                    ? "text-custom-primary-100"
                    : "text-custom-text-100 hover:text-custom-text-200"
                )}
              >
                <div className="font-medium">{t(tab.i18n_label)}</div>
                {tab.count(unreadNotificationsCount) > 0 && (
                  <CountChip count={getNumberCount(tab.count(unreadNotificationsCount))} />
                )}
              </div>
              {currentNotificationTab === tab.value && (
                <div className="border absolute bottom-0 right-0 left-0 rounded-t-md border-custom-primary-100" />
              )}
            </div>
          ))}
        </Header>

        {/* applied filters */}
        <AppliedFilters workspaceSlug={workspaceSlug.toString()} />

        {/* rendering notifications */}
        {loader === "init-loader" ? (
          <div className="relative w-full h-full overflow-hidden">
            <NotificationsLoader />
          </div>
        ) : (
          <>
            {notificationIds && notificationIds.length > 0 ? (
              <ContentWrapper variant={ERowVariant.HUGGING}>
                <NotificationListRoot workspaceSlug={workspaceSlug.toString()} workspaceId={workspace?.id} />
              </ContentWrapper>
            ) : (
              <div className="relative w-full h-full flex justify-center items-center">
                <NotificationEmptyState />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
});
