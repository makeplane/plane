import { FC } from "react";
import { observer } from "mobx-react";
import { CheckCheck, RefreshCw } from "lucide-react";
import { Spinner, Tooltip } from "@plane/ui";
// components
import { NotificationFilter, NotificationHeaderMenuOption } from "@/components/workspace-notifications";
// constants
import { NOTIFICATIONS_READ } from "@/constants/event-tracker";
import { ENotificationLoader, ENotificationQueryParamType } from "@/constants/notification";
// hooks
import { useEventTracker, useWorkspaceNotifications } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";

type TNotificationSidebarHeaderOptions = {
  workspaceSlug: string;
};

export const NotificationSidebarHeaderOptions: FC<TNotificationSidebarHeaderOptions> = observer((props) => {
  const { workspaceSlug } = props;
  // hooks
  const { isMobile } = usePlatformOS();
  const { loader, getNotifications, markAllNotificationsAsRead } = useWorkspaceNotifications();
  const { captureEvent } = useEventTracker();

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
    <div className="relative flex justify-center items-center gap-2 text-sm">
      {/* mark all notifications as read*/}
      <Tooltip tooltipContent="Mark all as read" isMobile={isMobile} position="bottom">
        <div
          className="flex-shrink-0 w-5 h-5 flex justify-center items-center overflow-hidden cursor-pointer transition-all hover:bg-custom-background-80 rounded-sm"
          onClick={() => {
            captureEvent(NOTIFICATIONS_READ);
            handleMarkAllNotificationsAsRead();
          }}
        >
          {loader === ENotificationLoader.MARK_ALL_AS_READY ? (
            <Spinner height="14px" width="14px" />
          ) : (
            <CheckCheck className="h-3 w-3" />
          )}
        </div>
      </Tooltip>

      {/* refetch current notifications */}
      <Tooltip tooltipContent="Refresh" isMobile={isMobile} position="bottom">
        <div
          className="flex-shrink-0 w-5 h-5 flex justify-center items-center overflow-hidden cursor-pointer transition-all hover:bg-custom-background-80 rounded-sm"
          onClick={refreshNotifications}
        >
          <RefreshCw className={`h-3 w-3 ${loader === ENotificationLoader.MUTATION_LOADER ? "animate-spin" : ""}`} />
        </div>
      </Tooltip>

      {/* notification filters */}
      <NotificationFilter />

      {/* notification menu options */}
      <NotificationHeaderMenuOption />
    </div>
  );
});
