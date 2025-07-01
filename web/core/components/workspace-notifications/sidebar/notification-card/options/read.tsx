"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { MessageSquare } from "lucide-react";
import { NOTIFICATION_TRACKER_ELEMENTS, NOTIFICATION_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import { NotificationItemOptionButton } from "@/components/workspace-notifications";
// constants
// hooks
import { captureClick, captureSuccess } from "@/helpers/event-tracker.helper";
import { useWorkspaceNotifications } from "@/hooks/store";
// store
import { INotification } from "@/store/notifications/notification";

type TNotificationItemReadOption = {
  workspaceSlug: string;
  notification: INotification;
};

export const NotificationItemReadOption: FC<TNotificationItemReadOption> = observer((props) => {
  const { workspaceSlug, notification } = props;
  // hooks
  const { currentNotificationTab } = useWorkspaceNotifications();
  const { asJson: data, markNotificationAsRead, markNotificationAsUnRead } = notification;
  const { t } = useTranslation();

  const handleNotificationUpdate = async () => {
    try {
      const request = data.read_at ? markNotificationAsUnRead : markNotificationAsRead;
      captureClick({
        elementName: NOTIFICATION_TRACKER_ELEMENTS.MARK_READ_BUTTON,
      });
      await request(workspaceSlug);
      captureSuccess({
        eventName: NOTIFICATION_TRACKER_EVENTS.all_marked_read,
        payload: {
          id: data?.data?.issue?.id,
          tab: currentNotificationTab,
        },
      });
      setToast({
        title: data.read_at ? t("notification.toasts.unread") : t("notification.toasts.read"),
        type: TOAST_TYPE.SUCCESS,
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <NotificationItemOptionButton
      tooltipContent={data.read_at ? t("notification.options.mark_unread") : t("notification.options.mark_read")}
      callBack={handleNotificationUpdate}
    >
      <MessageSquare className="h-3 w-3 text-custom-text-300" />
    </NotificationItemOptionButton>
  );
});
