"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { ArchiveRestore } from "lucide-react";
// plane imports
import { NOTIFICATION_ARCHIVED } from "@plane/constants";
import { ArchiveIcon, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { NotificationItemOptionButton } from "@/components/workspace-notifications";
import { useEventTracker, useWorkspaceNotifications } from "@/hooks/store";
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
  const { captureEvent } = useEventTracker();
  const { currentNotificationTab } = useWorkspaceNotifications();

  //derived values
  const archivedCount = notificationList.filter((n) => !!n.archived_at).length;

  const { archiveNotificationList, unArchiveNotificationList } = useWorkspaceNotifications();

  const handleNotificationUpdate = async () => {
    try {
      const request = archivedCount > 0 ? unArchiveNotificationList : archiveNotificationList;
      await request(notificationList, workspaceSlug);
      captureEvent(NOTIFICATION_ARCHIVED, {
        issue_id: issueId,
        tab: currentNotificationTab,
        state: "SUCCESS",
      });
      setToast({
        title: archivedCount > 0 ? "Notification(s) un-archived" : "Notification(s) archived",
        type: TOAST_TYPE.SUCCESS,
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <NotificationItemOptionButton
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
