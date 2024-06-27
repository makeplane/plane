import { FC } from "react";
import { observer } from "mobx-react";
import { CheckCheck, MoreVertical, RefreshCw } from "lucide-react";
import { CustomMenu, Tooltip } from "@plane/ui";
// components
import { NotificationFilter } from "@/components/workspace-notifications";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";

type TSidebarOptions = {
  workspaceSlug: string;
};

export const SidebarOptions: FC<TSidebarOptions> = observer((props) => {
  const {} = props;
  // hooks
  const { isMobile } = usePlatformOS();

  return (
    <div className="relative flex justify-center items-center gap-2 text-sm">
      <Tooltip tooltipContent="Refresh" isMobile={isMobile}>
        <div
          className="flex-shrink-0 w-5 h-5 flex justify-center items-center overflow-hidden cursor-pointer transition-all hover:bg-custom-background-80 rounded-sm"
          onClick={() => {}}
        >
          <RefreshCw className={`h-3 w-3 ${false ? "animate-spin" : ""}`} />
        </div>
      </Tooltip>

      <NotificationFilter />

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
            // markAllNotificationsAsRead();
            // captureEvent(NOTIFICATIONS_READ);
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
