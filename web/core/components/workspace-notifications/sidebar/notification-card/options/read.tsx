"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { MessageSquare } from "lucide-react";
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import { NotificationItemOptionButton } from "@/components/workspace-notifications";
// constants
import { NOTIFICATIONS_READ } from "@/constants/event-tracker";
// hooks
import { useEventTracker, useNotification, useWorkspaceNotifications } from "@/hooks/store";

type TNotificationItemReadOption = {
  workspaceSlug: string;
  notificationId: string;
};

export const NotificationItemReadOption: FC<TNotificationItemReadOption> = observer((props) => {
  const { workspaceSlug, notificationId } = props;
  // hooks
  const { captureEvent } = useEventTracker();
  const { currentNotificationTab } = useWorkspaceNotifications();
  const { asJson: notification, markNotificationAsRead, markNotificationAsUnRead } = useNotification(notificationId);

  const handleNotificationUpdate = async () => {
    try {
      const request = notification.read_at ? markNotificationAsUnRead : markNotificationAsRead;
      await request(workspaceSlug);
      captureEvent(NOTIFICATIONS_READ, {
        issue_id: notification?.data?.issue?.id,
        tab: currentNotificationTab,
        state: "SUCCESS",
      });
      setToast({
        title: notification.read_at ? "Notification marked as unread" : "Notification marked as read",
        type: TOAST_TYPE.SUCCESS,
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <NotificationItemOptionButton
      tooltipContent={notification.read_at ? "Mark as unread" : "Mark as read"}
      callBack={handleNotificationUpdate}
    >
      <MessageSquare className="h-3 w-3 text-custom-text-300" />
    </NotificationItemOptionButton>
  );
});
