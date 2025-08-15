"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { MessageSquare } from "lucide-react";
// plane imports
import { NOTIFICATION_TRACKER_ELEMENTS, NOTIFICATION_TRACKER_EVENTS } from "@plane/constants";
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import { NotificationItemOptionButton } from "@/components/workspace-notifications/sidebar/notification-card/options";
// helpers
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
// hooks
import { useWorkspaceNotifications } from "@/hooks/store/notifications";
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
  const { currentNotificationTab } = useWorkspaceNotifications();

  const { markBulkNotificationsAsRead, markBulkNotificationsAsUnread } = useWorkspaceNotifications();

  const handleNotificationUpdate = async () => {
    try {
      const request = unreadCount === 0 ? markBulkNotificationsAsUnread : markBulkNotificationsAsRead;
      await request(notificationList, workspaceSlug);
      captureSuccess({
        eventName: unreadCount === 0 ? NOTIFICATION_TRACKER_EVENTS.mark_unread : NOTIFICATION_TRACKER_EVENTS.mark_read,
        payload: {
          id: issueId,
          tab: currentNotificationTab,
        },
      });
      setToast({
        title: unreadCount === 0 ? "Notification(s) marked as unread" : "Notification(s) marked as read",
        type: TOAST_TYPE.SUCCESS,
      });
    } catch (e) {
      console.error(e);
      captureError({
        eventName: unreadCount === 0 ? NOTIFICATION_TRACKER_EVENTS.mark_unread : NOTIFICATION_TRACKER_EVENTS.mark_read,
        payload: {
          id: issueId,
          tab: currentNotificationTab,
        },
      });
    }
  };

  return (
    <NotificationItemOptionButton
      data-ph-element={NOTIFICATION_TRACKER_ELEMENTS.MARK_READ_UNREAD_BUTTON}
      tooltipContent={unreadCount === 0 ? "Mark as unread" : "Mark as read"}
      callBack={handleNotificationUpdate}
    >
      <MessageSquare className="h-3 w-3 text-custom-text-300" />
    </NotificationItemOptionButton>
  );
});
