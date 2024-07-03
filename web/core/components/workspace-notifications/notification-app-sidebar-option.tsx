"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// helpers
import { getNumberCount } from "@/helpers/string.helper";
// hooks
import { useWorkspaceNotifications } from "@/hooks/store";

type TNotificationAppSidebarOption = {
  workspaceSlug: string;
  isSidebarCollapsed: boolean | undefined;
};

export const NotificationAppSidebarOption: FC<TNotificationAppSidebarOption> = observer((props) => {
  const { workspaceSlug, isSidebarCollapsed } = props;
  // hooks
  const { unreadNotificationsCount, getUnreadNotificationsCount } = useWorkspaceNotifications();

  useSWR(
    workspaceSlug ? "WORKSPACE_UNREAD_NOTIFICATION_COUNT" : null,
    workspaceSlug ? () => getUnreadNotificationsCount(workspaceSlug) : null
  );

  if (unreadNotificationsCount.total_unread_notifications_count <= 0) return <></>;

  if (isSidebarCollapsed)
    return <div className="absolute right-3.5 top-2 h-2 w-2 rounded-full bg-custom-primary-300" />;

  const isMentionsEnabled = unreadNotificationsCount.mention_unread_notifications_count > 0 ? true : false;
  const totalNotifications = isMentionsEnabled
    ? `@${getNumberCount(unreadNotificationsCount.total_unread_notifications_count)}`
    : unreadNotificationsCount.total_unread_notifications_count > 0
      ? getNumberCount(unreadNotificationsCount.total_unread_notifications_count)
      : 0;

  return (
    <div className="text-[8px] ml-auto bg-custom-primary-100 text-white p-1 py-0.5 rounded-full">
      {totalNotifications}
    </div>
  );
});
