"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { MessageSquare } from "lucide-react";
// plane imports
import { NOTIFICATION_TRACKER_EVENTS } from "@plane/constants";
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import { NotificationItemOptionButton } from "@/components/workspace-notifications";
// hooks
import { useEventTracker, useWorkspaceNotifications } from "@/hooks/store";
// store
import { INotification } from "@/store/notifications/notification";

type TNotificationItemReadOption = {
  workspaceSlug: string;
  notificationList: INotification[];
  issueId: string;
  unreadCount: number;
};

export const NotificationItemReadOption: FC<TNotificationItemReadOption> = observer((props) => {
  const { workspaceSlug, notificationList, issueId, unreadCount } = props;
  // hooks
  const { captureEvent } = useEventTracker();
  const { currentNotificationTab } = useWorkspaceNotifications();

  const { markBulkNotificationsAsRead, markBulkNotificationsAsUnread } = useWorkspaceNotifications();

  const handleNotificationUpdate = async () => {
    try {
      const request = unreadCount === 0 ? markBulkNotificationsAsUnread : markBulkNotificationsAsRead;
      await request(notificationList, workspaceSlug);
      captureEvent(NOTIFICATION_TRACKER_EVENTS.all_marked_read, {
        issue_id: issueId,
        tab: currentNotificationTab,
        state: "SUCCESS",
      });
      setToast({
        title: unreadCount === 0 ? "Notification(s) marked as unread" : "Notification(s) marked as read",
        type: TOAST_TYPE.SUCCESS,
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <NotificationItemOptionButton
      tooltipContent={unreadCount === 0 ? "Mark as unread" : "Mark as read"}
      callBack={handleNotificationUpdate}
    >
      <MessageSquare className="h-3 w-3 text-custom-text-300" />
    </NotificationItemOptionButton>
  );
});
