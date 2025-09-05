"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { ArchiveRestore } from "lucide-react";
// plane imports
import { NOTIFICATION_TRACKER_ELEMENTS, NOTIFICATION_TRACKER_EVENTS } from "@plane/constants";
import { ArchiveIcon } from "@plane/propel/icons";
import { TOAST_TYPE,setToast } from "@plane/ui";
// components
import { NotificationItemOptionButton } from "@/components/workspace-notifications/sidebar/notification-card/options";
// helpers
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
// hooks
import { useWorkspaceNotifications } from "@/hooks/store/notifications";
// store
import { INotification } from "@/store/notifications/notification";

type TNotificationItemArchiveOption = {
  workspaceSlug: string;
  notificationList: INotification[];
  issueId: string;
};

export const NotificationItemArchiveOption: FC<TNotificationItemArchiveOption> = observer((props) => {
  const { workspaceSlug, notificationList, issueId } = props;
  // hooks
  const { currentNotificationTab } = useWorkspaceNotifications();

  //derived values
  const archivedCount = notificationList.filter((n) => !!n.archived_at).length;

  const { archiveNotificationList, unArchiveNotificationList } = useWorkspaceNotifications();

  const handleNotificationUpdate = async () => {
    try {
      const request = archivedCount > 0 ? unArchiveNotificationList : archiveNotificationList;
      await request(notificationList, workspaceSlug);
      captureSuccess({
        eventName: archivedCount > 0 ? NOTIFICATION_TRACKER_EVENTS.unarchive : NOTIFICATION_TRACKER_EVENTS.archive,
        payload: {
          id: issueId,
          tab: currentNotificationTab,
        },
      });
      setToast({
        title: archivedCount > 0 ? "Notification(s) un-archived" : "Notification(s) archived",
        type: TOAST_TYPE.SUCCESS,
      });
    } catch (e) {
      console.error(e);
      captureError({
        eventName: archivedCount > 0 ? NOTIFICATION_TRACKER_EVENTS.unarchive : NOTIFICATION_TRACKER_EVENTS.archive,
        payload: {
          id: issueId,
          tab: currentNotificationTab,
        },
      });
    }
  };

  return (
    <NotificationItemOptionButton
      data-ph-element={NOTIFICATION_TRACKER_ELEMENTS.ARCHIVE_UNARCHIVE_BUTTON}
      tooltipContent={archivedCount > 0 ? "Un archive" : "Archive"}
      callBack={handleNotificationUpdate}
    >
      {archivedCount > 0 ? (
        <ArchiveRestore className="h-3 w-3 text-custom-text-300" />
      ) : (
        <ArchiveIcon className="h-3 w-3 text-custom-text-300" />
      )}
    </NotificationItemOptionButton>
  );
});
