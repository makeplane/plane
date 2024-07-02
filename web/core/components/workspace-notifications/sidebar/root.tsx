"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { EmptyState } from "@/components/empty-state";
import {
  NotificationSidebarHeader,
  AppliedFilters,
  NotificationsLoader,
  NotificationCardListRoot,
} from "@/components/workspace-notifications";
// constants
import { EmptyStateType } from "@/constants/empty-state";
import { ENotificationTab } from "@/constants/notification";
// hooks
import { useWorkspace, useWorkspaceNotifications } from "@/hooks/store";

export const NotificationsSidebar: FC = observer(() => {
  const { workspaceSlug } = useParams();
  // hooks
  const { getWorkspaceBySlug } = useWorkspace();
  const { unreadNotificationsCount, loader, notificationIdsByWorkspaceId } = useWorkspaceNotifications();
  // derived values
  const workspace = workspaceSlug ? getWorkspaceBySlug(workspaceSlug.toString()) : undefined;
  const notificationIds = workspace ? notificationIdsByWorkspaceId(workspace.id) : undefined;

  // derived values
  const currentTabEmptyState = ENotificationTab.ALL
    ? EmptyStateType.NOTIFICATION_ALL_EMPTY_STATE
    : EmptyStateType.NOTIFICATION_MENTIONS_EMPTY_STATE;
  const totalNotificationCount = unreadNotificationsCount.total_unread_notifications_count;

  if (!workspaceSlug || !workspace) return <></>;
  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col">
      <div className="border-b border-custom-border-200">
        <NotificationSidebarHeader
          workspaceSlug={workspaceSlug.toString()}
          notificationsCount={totalNotificationCount}
        />
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
              <NotificationCardListRoot workspaceSlug={workspaceSlug.toString()} workspaceId={workspace?.id} />
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
