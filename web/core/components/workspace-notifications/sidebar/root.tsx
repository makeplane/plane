"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { EmptyState } from "@/components/empty-state";
import {
  SidebarHeader,
  AppliedFilters,
  NotificationsLoader,
  NotificationList,
} from "@/components/workspace-notifications";
// constants
import { EmptyStateType } from "@/constants/empty-state";
import { ENotificationTab, NOTIFICATION_TABS } from "@/constants/notification";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useWorkspace, useWorkspaceNotification } from "@/hooks/store";

export const NotificationsSidebarRoot: FC = observer(() => {
  const { workspaceSlug } = useParams();
  // hooks
  const { getWorkspaceBySlug } = useWorkspace();
  const { paginationInfo, currentNotificationTab, setCurrentNotificationTab, loader, notificationIdsByWorkspaceId } =
    useWorkspaceNotification();
  // derived values
  const workspace = workspaceSlug ? getWorkspaceBySlug(workspaceSlug.toString()) : undefined;
  const notificationIds = workspace ? notificationIdsByWorkspaceId(workspace.id) : undefined;

  // derived values
  const currentTabEmptyState = ENotificationTab.ALL
    ? EmptyStateType.NOTIFICATION_ALL_EMPTY_STATE
    : EmptyStateType.NOTIFICATION_MENTIONS_EMPTY_STATE;

  if (!workspaceSlug || !workspace) return <></>;
  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col">
      <div className="border-b border-custom-border-200">
        <SidebarHeader />
      </div>

      <div className="flex-shrink-0 w-full h-[46px] border-b border-custom-border-200 px-5 relative flex items-center gap-2">
        {NOTIFICATION_TABS.map((tab) => (
          <div
            key={tab.value}
            className="h-full px-3 relative flex flex-col cursor-pointer"
            onClick={() => setCurrentNotificationTab(tab.value)}
          >
            <div
              className={cn(
                `relative h-full flex justify-center items-center gap-1 text-sm transition-all`,
                currentNotificationTab === tab.value
                  ? "text-custom-primary-100"
                  : "text-custom-text-100 hover:text-custom-text-200"
              )}
            >
              <div className="font-medium">{tab.label}</div>
              {notificationIds && notificationIds.length > 0 && paginationInfo?.total_count && (
                <div
                  className={cn(
                    `rounded-full text-xs px-1.5 py-0.5`,
                    currentNotificationTab === tab.value ? `bg-custom-primary-100/20` : `bg-custom-background-80/50`
                  )}
                >
                  {notificationIds.length}/{paginationInfo?.total_count}
                </div>
              )}
            </div>
            {currentNotificationTab === tab.value && (
              <div className="border absolute bottom-0 right-0 left-0 rounded-t-md border-custom-primary-100" />
            )}
          </div>
        ))}
      </div>

      {/* applied filters */}
      <div className="flex-shrink-0">
        <AppliedFilters workspaceSlug={workspaceSlug.toString()} />
      </div>

      {/* rendering notifications */}
      {loader === "init-loader" ? (
        <div className="relative w-full h-full overflow-hidden p-5">
          <NotificationsLoader />
        </div>
      ) : (
        <>
          {notificationIds && notificationIds.length > 0 ? (
            <div className="relative w-full h-full overflow-hidden overflow-y-auto">
              <NotificationList workspaceSlug={workspaceSlug.toString()} workspaceId={workspace?.id} />
            </div>
          ) : (
            <div className="relative w-full h-full flex justify-center items-center">
              <EmptyState type={currentTabEmptyState} layout="screen-simple" />
            </div>
          )}
        </>
      )}
    </div>
  );
});
