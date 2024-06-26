"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { ArchiveRestore, MessageSquare } from "lucide-react";
import { ArchiveIcon, Tooltip } from "@plane/ui";
// hooks
import { useNotification } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";

type TNotificationOption = {
  notificationId: string;
};

export const NotificationOption: FC<TNotificationOption> = observer((props) => {
  const { notificationId } = props;
  // hooks
  // const { captureEvent } = useEventTracker();
  const { isMobile } = usePlatformOS();
  const { asJson: notification } = useNotification(notificationId);

  const options = [
    {
      id: 1,
      name: notification.read_at ? "Mark as unread" : "Mark as read",
      icon: <MessageSquare className="h-3.5 w-3.5 text-custom-text-300" />,
      onClick: () => {
        // markNotificationReadStatusToggle(notification.id).then(() => {
        //   captureEvent(NOTIFICATIONS_READ, {
        //     issue_id: notification.data.issue.id,
        //     tab: selectedTab,
        //     state: "SUCCESS",
        //   });
        //   setToast({
        //     title: notification.read_at ? "Notification marked as read" : "Notification marked as unread",
        //     type: TOAST_TYPE.SUCCESS,
        //   });
        // });
      },
    },
    {
      id: 2,
      name: notification.archived_at ? "Unarchive" : "Archive",
      icon: notification.archived_at ? (
        <ArchiveRestore className="h-3.5 w-3.5 text-custom-text-300" />
      ) : (
        <ArchiveIcon className="h-3.5 w-3.5 text-custom-text-300" />
      ),
      onClick: () => {
        // markNotificationArchivedStatus(notification.id).then(() => {
        //   captureEvent(NOTIFICATION_ARCHIVED, {
        //     issue_id: notification.data.issue.id,
        //     tab: selectedTab,
        //     state: "SUCCESS",
        //   });
        //   setToast({
        //     title: notification.archived_at ? "Notification un-archived" : "Notification archived",
        //     type: TOAST_TYPE.SUCCESS,
        //   });
        // });
      },
    },
  ];

  return (
    <div className="relative flex justify-center items-center gap-2">
      {options.map((item) => (
        <Tooltip tooltipContent={item.name} key={item.id} isMobile={isMobile}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              item.onClick();
            }}
            key={item.id}
            className="flex w-full items-center gap-x-2 rounded bg-custom-background-80 p-0.5 text-sm outline-none hover:bg-custom-background-100"
          >
            {item.icon}
          </button>
        </Tooltip>
      ))}
    </div>
  );
});
