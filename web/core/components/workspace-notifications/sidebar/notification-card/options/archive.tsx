"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { ArchiveRestore } from "lucide-react";
import { NOTIFICATION_TRACKER_ELEMENTS, NOTIFICATION_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { ArchiveIcon, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { NotificationItemOptionButton } from "@/components/workspace-notifications";
// constants
// hooks
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useWorkspaceNotifications } from "@/hooks/store";
// store
import { INotification } from "@/store/notifications/notification";

type TNotificationItemArchiveOption = {
  workspaceSlug: string;
  notification: INotification;
};

export const NotificationItemArchiveOption: FC<TNotificationItemArchiveOption> = observer((props) => {
  const { workspaceSlug, notification } = props;
  // hooks
  const { currentNotificationTab } = useWorkspaceNotifications();
  const { asJson: data, archiveNotification, unArchiveNotification } = notification;
  const { t } = useTranslation();

  const handleNotificationUpdate = async () => {
    try {
      const request = data.archived_at ? unArchiveNotification : archiveNotification;
      await request(workspaceSlug);
      captureSuccess({
        eventName: data.archived_at ? NOTIFICATION_TRACKER_EVENTS.unarchive : NOTIFICATION_TRACKER_EVENTS.archive,
        payload: {
          id: data?.data?.issue?.id,
          tab: currentNotificationTab,
        },
      });
      setToast({
        title: data.archived_at ? t("notification.toasts.unarchived") : t("notification.toasts.archived"),
        type: TOAST_TYPE.SUCCESS,
      });
    } catch (e) {
      console.error(e);
      captureError({
        eventName: data.archived_at ? NOTIFICATION_TRACKER_EVENTS.unarchive : NOTIFICATION_TRACKER_EVENTS.archive,
        payload: {
          id: data?.data?.issue?.id,
          tab: currentNotificationTab,
        },
      });
    }
  };

  return (
    <NotificationItemOptionButton
      data-ph-element={NOTIFICATION_TRACKER_ELEMENTS.ARCHIVE_UNARCHIVE_BUTTON}
      tooltipContent={
        data.archived_at ? t("notification.options.mark_unarchive") : t("notification.options.mark_archive")
      }
      callBack={handleNotificationUpdate}
    >
      {data.archived_at ? (
        <ArchiveRestore className="h-3 w-3 text-custom-text-300" />
      ) : (
        <ArchiveIcon className="h-3 w-3 text-custom-text-300" />
      )}
    </NotificationItemOptionButton>
  );
});
