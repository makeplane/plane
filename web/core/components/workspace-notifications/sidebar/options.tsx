import { FC } from "react";
import { observer } from "mobx-react";
import { RefreshCw } from "lucide-react";
import { Tooltip } from "@plane/ui";
// components
import { NotificationFilter, NotificationMenuOptions } from "@/components/workspace-notifications";
// constants
import { ENotificationLoader, ENotificationQueryParamType } from "@/constants/notification";
// hooks
import { useWorkspaceNotification } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";

type TSidebarOptions = {
  workspaceSlug: string;
};

export const SidebarOptions: FC<TSidebarOptions> = observer((props) => {
  const { workspaceSlug } = props;
  // hooks
  const { isMobile } = usePlatformOS();
  const { loader, getNotifications } = useWorkspaceNotification();

  const refreshNotifications = async () => {
    if (loader) return;
    try {
      await getNotifications(workspaceSlug, ENotificationLoader.MUTATION_LOADER, ENotificationQueryParamType.CURRENT);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="relative flex justify-center items-center gap-2 text-sm">
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
      <NotificationMenuOptions workspaceSlug={workspaceSlug} />
    </div>
  );
});
