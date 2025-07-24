"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { getNumberCount } from "@plane/utils";
// components
import { CountChip } from "@/components/common/count-chip";
// hooks
import { useWorkspaceNotifications } from "@/hooks/store";

type TNotificationAppSidebarOption = {
  workspaceSlug: string;
};

export const NotificationAppSidebarOption: FC<TNotificationAppSidebarOption> = observer((props) => {
  const { workspaceSlug } = props;
  // hooks
  const { unreadNotificationsCount, getUnreadNotificationsCount } = useWorkspaceNotifications();

  useSWR(
    workspaceSlug ? "WORKSPACE_UNREAD_NOTIFICATION_COUNT" : null,
    workspaceSlug ? () => getUnreadNotificationsCount(workspaceSlug) : null
  );

  // derived values
  const isMentionsEnabled = unreadNotificationsCount.mention_unread_notifications_count > 0 ? true : false;
  const totalNotifications = isMentionsEnabled
    ? unreadNotificationsCount.mention_unread_notifications_count
    : unreadNotificationsCount.total_unread_notifications_count;

  if (totalNotifications <= 0) return <></>;

  return (
    <div className="ml-auto">
      <CountChip count={`${isMentionsEnabled ? `@ ` : ``}${getNumberCount(totalNotifications)}`} />
    </div>
  );
});
