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
import { useEventTracker, useWorkspaceNotifications } from "@/hooks/store";
// store
import { INotification } from "@/store/notifications/notification";

type TNotificationItemReadOption = {
  workspaceSlug: string;
  notificationGroup: INotification[];
  issueId: string;
  unreadCount: number
};

export const NotificationItemReadOption: FC<TNotificationItemReadOption> = observer((props) => {
  const { workspaceSlug, notificationGroup, issueId, unreadCount } = props;
  // hooks
  const { captureEvent } = useEventTracker();
  const { currentNotificationTab } = useWorkspaceNotifications();

  const { markNotificationGroupRead, markNotificationGroupUnRead } = useWorkspaceNotifications();

  const handleNotificationUpdate = async () => {
    try {
      const request = unreadCount === 0 ?  markNotificationGroupUnRead : markNotificationGroupRead;
      await request(notificationGroup,workspaceSlug);
      captureEvent(NOTIFICATIONS_READ, {
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
