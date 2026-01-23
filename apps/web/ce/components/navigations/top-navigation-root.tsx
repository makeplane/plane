// components
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import { cn } from "@plane/utils";
import { TopNavPowerK } from "@/components/navigation";
import { HelpMenuRoot } from "@/components/workspace/sidebar/help-section/root";
import { UserMenuRoot } from "@/components/workspace/sidebar/user-menu-root";
import { WorkspaceMenuRoot } from "@/components/workspace/sidebar/workspace-menu-root";
import { useAppRailPreferences } from "@/hooks/use-navigation-preferences";
import { Tooltip } from "@plane/propel/tooltip";
import { AppSidebarItem } from "@/components/sidebar/sidebar-item";
import { InboxIcon } from "@plane/propel/icons";
import useSWR from "swr";
import { useWorkspaceNotifications } from "@/hooks/store/notifications";
// local imports
import { StarUsOnGitHubLink } from "@/app/(all)/[workspaceSlug]/(projects)/star-us-link";

export const TopNavigationRoot = observer(function TopNavigationRoot() {
  // router
  const { workspaceSlug } = useParams();
  const pathname = usePathname();

  // store hooks
  const { unreadNotificationsCount, getUnreadNotificationsCount } = useWorkspaceNotifications();
  const { preferences } = useAppRailPreferences();

  const showLabel = preferences.displayMode === "icon_with_label";

  // Fetch notification count
  useSWR(
    workspaceSlug ? "WORKSPACE_UNREAD_NOTIFICATION_COUNT" : null,
    workspaceSlug ? () => getUnreadNotificationsCount(workspaceSlug.toString()) : null
  );

  // Calculate notification count
  const isMentionsEnabled = unreadNotificationsCount.mention_unread_notifications_count > 0;
  const totalNotifications = isMentionsEnabled
    ? unreadNotificationsCount.mention_unread_notifications_count
    : unreadNotificationsCount.total_unread_notifications_count;

  return (
    <div
      className={cn("flex items-center min-h-10 w-full px-3.5 bg-canvas z-[27] transition-all duration-300", {
        "px-2": !showLabel,
      })}
    >
      {/* Workspace Menu */}
      <div className="shrink-0 flex-1">
        <WorkspaceMenuRoot variant="top-navigation" />
      </div>
      {/* Power K Search */}
      <div className="shrink-0">
        <TopNavPowerK />
      </div>
      {/* Additional Actions */}
      <div className="shrink-0 flex-1 flex gap-1 items-center justify-end">
        <Tooltip tooltipContent="Inbox" position="bottom">
          <AppSidebarItem
            variant="link"
            item={{
              href: `/${workspaceSlug?.toString()}/notifications/`,
              icon: (
                <div className="relative">
                  <InboxIcon className="size-5" />
                  {totalNotifications > 0 && (
                    <span className="absolute top-0 right-0 size-2 rounded-full bg-danger-primary" />
                  )}
                </div>
              ),
              isActive: pathname?.includes("/notifications/"),
            }}
          />
        </Tooltip>
        <HelpMenuRoot />
        <StarUsOnGitHubLink />
        <div className="flex items-center justify-center size-8 hover:bg-layer-1-hover rounded-md">
          <UserMenuRoot />
        </div>
      </div>
    </div>
  );
});
