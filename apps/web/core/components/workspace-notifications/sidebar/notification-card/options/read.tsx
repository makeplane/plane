import { observer } from "mobx-react";
import { MessageSquare } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// store
import type { INotification } from "@/store/notifications/notification";
// local imports
import { NotificationItemOptionButton } from "./button";

type TNotificationItemReadOption = {
  workspaceSlug: string;
  notification: INotification;
};

export const NotificationItemReadOption = observer(function NotificationItemReadOption(
  props: TNotificationItemReadOption
) {
  const { workspaceSlug, notification } = props;
  // hooks
  const { asJson: data, markNotificationAsRead, markNotificationAsUnRead } = notification;
  const { t } = useTranslation();

  const handleNotificationUpdate = async () => {
    try {
      const request = data.read_at ? markNotificationAsUnRead : markNotificationAsRead;
      await request(workspaceSlug);
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
      <MessageSquare className="h-3 w-3 text-tertiary" />
    </NotificationItemOptionButton>
  );
});
