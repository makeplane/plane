import { observer } from "mobx-react";
import { CheckCheck, RefreshCw } from "lucide-react";
// plane imports
import { ENotificationLoader, ENotificationQueryParamType } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@plane/propel/tooltip";
import { Spinner } from "@plane/ui";
// hooks
import { useWorkspaceNotifications } from "@/hooks/store/notifications";
import { usePlatformOS } from "@/hooks/use-platform-os";
// local imports
import { NotificationFilter } from "../../filters/menu";
import { NotificationHeaderMenuOption } from "./menu-option";
import { IconButton } from "@plane/propel/icon-button";

type TNotificationSidebarHeaderOptions = {
  workspaceSlug: string;
};

export const NotificationSidebarHeaderOptions = observer(function NotificationSidebarHeaderOptions(
  props: TNotificationSidebarHeaderOptions
) {
  const { workspaceSlug } = props;
  // hooks
  const { isMobile } = usePlatformOS();
  const { loader, getNotifications, markAllNotificationsAsRead } = useWorkspaceNotifications();
  const { t } = useTranslation();

  const refreshNotifications = async () => {
    if (loader) return;
    try {
      await getNotifications(workspaceSlug, ENotificationLoader.MUTATION_LOADER, ENotificationQueryParamType.CURRENT);
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    // NOTE: We are using loader to prevent continues request when we are making all the notification to read
    if (loader) return;
    try {
      await markAllNotificationsAsRead(workspaceSlug);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="relative flex justify-center items-center gap-2 text-body-xs-medium">
      {/* mark all notifications as read*/}
      <Tooltip tooltipContent={t("notification.options.mark_all_as_read")} isMobile={isMobile} position="bottom">
        <IconButton
          size="base"
          variant="ghost"
          icon={loader === ENotificationLoader.MARK_ALL_AS_READY ? Spinner : CheckCheck}
          onClick={() => {
            handleMarkAllNotificationsAsRead();
          }}
        />
      </Tooltip>

      {/* refetch current notifications */}
      <Tooltip tooltipContent={t("notification.options.refresh")} isMobile={isMobile} position="bottom">
        <IconButton
          size="base"
          variant="ghost"
          icon={RefreshCw}
          className={loader === ENotificationLoader.MUTATION_LOADER ? "animate-spin" : ""}
          onClick={refreshNotifications}
        />
      </Tooltip>

      {/* notification filters */}
      <NotificationFilter />

      {/* notification menu options */}
      <NotificationHeaderMenuOption />
    </div>
  );
});
