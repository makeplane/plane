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

import { observer } from "mobx-react";
import { useParams, useRouter } from "next/navigation";
// plane imports
import { ENotificationLoader, ENotificationQueryParamType, NOTIFICATION_TABS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@plane/propel/tooltip";
import { ContentWrapper, ERowVariant, Spinner } from "@plane/ui";
import { cn, getNumberCount } from "@plane/utils";
// components
// hooks
import { useWorkspaceNotifications } from "@/hooks/store/notifications";
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web components
import { NotificationListRoot } from "@/components/workspace-notifications/sidebar/list-root";
// local imports
import type { TNotificationsViewMode } from "@/store/notifications/workspace-notifications.store";
import { getIconButtonStyling, IconButton } from "@plane/propel/icon-button";
import { Tabs } from "@plane/propel/tabs";
import { CheckCheck, MoveDiagonal, RefreshCw } from "lucide-react";
import { Link } from "react-router";
import { NotificationEmptyState } from "./empty-state";
import { AppliedFilters } from "./filters/applied-filter";
import { NotificationSidebarHeaderOptions } from "./header/options";
import { NotificationsLoader } from "./loader";
import { ViewModeSelector } from "./view-mode-selector";
import { usePlatformOS } from "@plane/hooks";

type NotificationsSidebarRootProps = {
  viewMode?: TNotificationsViewMode;
  onFullViewMode?: () => void;
  onNotificationClick?: () => void;
  onModeChange?: (mode: TNotificationsViewMode) => void;
};

const getSidebarWidthClass = (viewMode: TNotificationsViewMode, hasSelection: boolean) => {
  if (viewMode === "compact") {
    return "w-full md:w-full rounded-xl border border-subtle shadow-raised-200";
  }

  return hasSelection ? "w-0 md:w-3/12" : "w-full md:w-3/12";
};

export const NotificationsSidebarRoot = observer(function NotificationsSidebarRoot({
  viewMode = "full",
  onFullViewMode,
  onNotificationClick,
  onModeChange,
}: NotificationsSidebarRootProps) {
  const { workspaceSlug } = useParams();
  const { t } = useTranslation();

  const { isMobile } = usePlatformOS();

  const { getWorkspaceBySlug } = useWorkspace();
  const notifications = useWorkspaceNotifications();
  const router = useRouter();
  if (!workspaceSlug) return null;

  const workspace = getWorkspaceBySlug(workspaceSlug.toString());
  if (!workspace) return null;

  const {
    currentSelectedNotificationId,
    unreadNotificationsCount,
    notificationIdsByWorkspaceId,
    currentNotificationTab,
    setCurrentNotificationTab,
    setViewMode,
    viewMode: currentViewMode,
    loader,
    getNotifications,
    markAllNotificationsAsRead,
  } = notifications;

  const notificationIds = notificationIdsByWorkspaceId(workspace.id);
  const sidebarWidthClass = getSidebarWidthClass(viewMode, Boolean(currentSelectedNotificationId));

  const refreshNotifications = async () => {
    if (loader) return;
    try {
      await getNotifications(workspaceSlug, ENotificationLoader.MUTATION_LOADER, ENotificationQueryParamType.CURRENT);
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    // NOTE: We are using loader to prevent continues request when we are making all the notification to read
    if (loader) return;
    try {
      await markAllNotificationsAsRead(workspaceSlug);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div
      className={cn(
        "relative flex-shrink-0 bg-surface-1 h-full transition-all md:border-r border-subtle",
        sidebarWidthClass
      )}
    >
      <div className="flex h-full flex-col overflow-hidden">
        <div className="px-3 py-2 border-b border-subtle flex items-center justify-between mb-2">
          <h4 className="text-18 font-medium">{t("notification.label")}</h4>
          <div className="flex items-center gap-1">
            <Tooltip tooltipContent={t("notification.options.mark_all_as_read")} isMobile={isMobile} position="bottom">
              <IconButton
                size="base"
                variant="ghost"
                icon={loader === ENotificationLoader.MARK_ALL_AS_READY ? Spinner : CheckCheck}
                onClick={() => {
                  handleMarkAllNotificationsAsRead();
                }}
              />
            </Tooltip>

            {/* refetch current notifications */}
            <Tooltip tooltipContent={t("notification.options.refresh")} isMobile={isMobile} position="bottom">
              <IconButton
                size="base"
                variant="ghost"
                icon={RefreshCw}
                className={cn(loader === ENotificationLoader.MUTATION_LOADER && "[&>svg]:animate-spin")}
                onClick={refreshNotifications}
              />
            </Tooltip>
            {viewMode === "compact" && (
              <Tooltip tooltipContent={t("account_settings.notifications.full")} position="bottom">
                <Link
                  to={`/${workspaceSlug}/notifications/`}
                  className={getIconButtonStyling("ghost", "base")}
                  onClick={onFullViewMode}
                >
                  <MoveDiagonal size={16} />
                </Link>
              </Tooltip>
            )}

            <ViewModeSelector
              value={currentViewMode}
              onChange={(mode) => {
                setViewMode(mode);
                if (mode === "full") {
                  router.push(`/${workspaceSlug}/notifications/`);
                }
                onModeChange?.(mode);
              }}
            />
          </div>
        </div>

        <Tabs
          value={currentNotificationTab}
          onValueChange={setCurrentNotificationTab}
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="flex items-center justify-between mx-3">
            <Tabs.List className="w-fit">
              {NOTIFICATION_TABS.map((tab) => (
                <Tabs.Trigger key={tab.value} value={tab.value} size="sm">
                  <div className="flex items-center gap-1.5 px-1">
                    {t(tab.i18n_label)}
                    {tab.count(unreadNotificationsCount) > 0 && (
                      <span>{getNumberCount(tab.count(unreadNotificationsCount))}</span>
                    )}
                  </div>
                </Tabs.Trigger>
              ))}
            </Tabs.List>

            <NotificationSidebarHeaderOptions workspaceSlug={workspaceSlug.toString()} />
          </div>

          <Tabs.Content value={currentNotificationTab} className="py-2 overflow-auto flex flex-col flex-1">
            {loader === "init-loader" ? (
              <div className="relative w-full h-full overflow-hidden">
                <NotificationsLoader />
              </div>
            ) : notificationIds && notificationIds.length > 0 ? (
              <ContentWrapper variant={ERowVariant.HUGGING}>
                <NotificationListRoot
                  workspaceSlug={workspaceSlug.toString()}
                  workspaceId={workspace.id}
                  onNotificationClick={onNotificationClick}
                />
              </ContentWrapper>
            ) : (
              <div className="relative w-full h-full flex items-center justify-center">
                <NotificationEmptyState currentNotificationTab={currentNotificationTab} />
              </div>
            )}
          </Tabs.Content>
        </Tabs>

        <AppliedFilters workspaceSlug={workspaceSlug.toString()} />
      </div>
    </div>
  );
});
