import { FC } from "react";
import { observer } from "mobx-react";
import { RefreshCw } from "lucide-react";
import { Tooltip } from "@plane/ui";
// components
import { NotificationFilter, NotificationHeaderMenuOption } from "@/components/workspace-notifications";
// constants
import { ENotificationLoader, ENotificationQueryParamType } from "@/constants/notification";
// hooks
import { useWorkspaceNotifications } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";

type TNotificationSidebarHeaderOptions = {
  workspaceSlug: string;
};

export const NotificationSidebarHeaderOptions: FC<TNotificationSidebarHeaderOptions> = observer((props) => {
  const { workspaceSlug } = props;
  // hooks
  const { isMobile } = usePlatformOS();
  const { loader, getNotifications } = useWorkspaceNotifications();

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
      <NotificationHeaderMenuOption workspaceSlug={workspaceSlug} />
    </div>
  );
});
