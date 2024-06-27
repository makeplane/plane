import { FC } from "react";
import { observer } from "mobx-react";
import { CheckCheck, MoreVertical, RefreshCw } from "lucide-react";
import { TNotificationFilter } from "@plane/types";
import { CustomMenu, Tooltip, ToggleSwitch } from "@plane/ui";
// components
import { NotificationFilter } from "@/components/workspace-notifications";
// constants
import { NOTIFICATIONS_READ } from "@/constants/event-tracker";
import { ENotificationLoader, ENotificationQueryParamType } from "@/constants/notification";
// hooks
import { useEventTracker, useWorkspaceNotification } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";

type TSidebarOptions = {
  workspaceSlug: string;
};

export const SidebarOptions: FC<TSidebarOptions> = observer((props) => {
  const { workspaceSlug } = props;
  // hooks
  const { captureEvent } = useEventTracker();
  const { isMobile } = usePlatformOS();
  const { filters, updateFilters, loader, getNotifications, markAllNotificationsAsRead } = useWorkspaceNotification();

  const refreshNotifications = async () => {
    if (loader) return;
    try {
      await getNotifications(workspaceSlug, ENotificationLoader.MUTATION_LOADER, ENotificationQueryParamType.CURRENT);
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    if (loader) return;
    try {
      await markAllNotificationsAsRead(workspaceSlug);
    } catch (error) {
      console.error(error);
    }
  };

  const handleFilterChange = (filterType: keyof TNotificationFilter, filterValue: boolean) =>
    updateFilters(filterType, filterValue);

  return (
    <div className="relative flex justify-center items-center gap-2 text-sm">
      {/* showing read adn unread notifications */}
      <Tooltip
        tooltipContent={filters?.read ? `Unread Notifications` : `Read Notifications`}
        isMobile={isMobile}
        position="bottom"
      >
        <div>
          <ToggleSwitch
            value={filters?.read}
            onChange={() => handleFilterChange("read", !filters?.read)}
            size="sm"
            disabled={loader === ENotificationLoader.INIT_LOADER ? true : false}
          />
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

      {/* mark all as read dropdown */}
      <CustomMenu
        customButton={
          <div className="flex-shrink-0 w-5 h-5 flex justify-center items-center overflow-hidden cursor-pointer transition-all hover:bg-custom-background-80 rounded-sm">
            <MoreVertical className="h-3 w-3" />
          </div>
        }
        closeOnSelect
      >
        <CustomMenu.MenuItem
          onClick={() => {
            handleMarkAllNotificationsAsRead();
            captureEvent(NOTIFICATIONS_READ);
          }}
        >
          <div className="flex items-center gap-2">
            <CheckCheck className="h-3 w-3" />
            Mark all as read
          </div>
        </CustomMenu.MenuItem>
      </CustomMenu>
    </div>
  );
});
