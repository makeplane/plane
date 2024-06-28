"use client";

import { FC, Dispatch, SetStateAction } from "react";
import { observer } from "mobx-react";
import { ArchiveRestore, MessageSquare } from "lucide-react";
import { ArchiveIcon, TOAST_TYPE, Tooltip, setToast } from "@plane/ui";
// components
import { NotificationSnoozeDropdown } from "@/components/workspace-notifications";
// constants
import { NOTIFICATIONS_READ, NOTIFICATION_ARCHIVED } from "@/constants/event-tracker";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useEventTracker, useNotification, useWorkspaceNotification } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";

type TNotificationOption = {
  workspaceSlug: string;
  notificationId: string;
  isSnoozeStateModalOpen: boolean;
  setIsSnoozeStateModalOpen: Dispatch<SetStateAction<boolean>>;
  customSnoozeModal: boolean;
  setCustomSnoozeModal: Dispatch<SetStateAction<boolean>>;
};

export const NotificationOption: FC<TNotificationOption> = observer((props) => {
  const {
    workspaceSlug,
    notificationId,
    isSnoozeStateModalOpen,
    setIsSnoozeStateModalOpen,
    customSnoozeModal,
    setCustomSnoozeModal,
  } = props;
  // hooks
  const { captureEvent } = useEventTracker();
  const { isMobile } = usePlatformOS();
  const { currentNotificationTab } = useWorkspaceNotification();
  const {
    asJson: notification,
    markNotificationAsRead,
    markNotificationAsUnRead,
    archiveNotification,
    unArchiveNotification,
  } = useNotification(notificationId);

  const options = [
    {
      id: 1,
      name: notification.read_at ? "Mark as unread" : "Mark as read",
      icon: <MessageSquare className="h-3 w-3 text-custom-text-300" />,
      onClick: async () => {
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
      },
    },
    {
      id: 2,
      name: notification.archived_at ? "Unarchive" : "Archive",
      icon: notification.archived_at ? (
        <ArchiveRestore className="h-3 w-3 text-custom-text-300" />
      ) : (
        <ArchiveIcon className="h-3 w-3 text-custom-text-300" />
      ),
      onClick: async () => {
        try {
          const request = notification.archived_at ? unArchiveNotification : archiveNotification;
          await request(workspaceSlug);
          captureEvent(NOTIFICATION_ARCHIVED, {
            issue_id: notification?.data?.issue?.id,
            tab: currentNotificationTab,
            state: "SUCCESS",
          });
          setToast({
            title: notification.archived_at ? "Notification un-archived" : "Notification archived",
            type: TOAST_TYPE.SUCCESS,
          });
        } catch (e) {
          console.error(e);
        }
      },
    },
  ];

  return (
    <div className={cn("flex-shrink-0 hidden group-hover:block text-sm", isSnoozeStateModalOpen ? `!block` : ``)}>
      <div className="relative flex justify-center items-center gap-2">
        {options.map((item) => (
          <Tooltip tooltipContent={item.name} key={item.id} isMobile={isMobile}>
            <button
              key={item.id}
              type="button"
              className="relative flex-shrink-0 w-5 h-5 rounded-sm flex justify-center items-center outline-none bg-custom-background-80 hover:bg-custom-background-90"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                item.onClick();
              }}
            >
              {item.icon}
            </button>
          </Tooltip>
        ))}

        {/* snooze notification */}
        <NotificationSnoozeDropdown
          workspaceSlug={workspaceSlug}
          notificationId={notificationId}
          setIsSnoozeStateModalOpen={setIsSnoozeStateModalOpen}
          customSnoozeModal={customSnoozeModal}
          setCustomSnoozeModal={setCustomSnoozeModal}
        />
      </div>
    </div>
  );
});
