/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// components
import { useEffect, useRef } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
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

const NOTIFICATIONS_PATH_SEGMENT = "/notifications/";

export const TopNavigationRoot = observer(function TopNavigationRoot() {
  // router
  const { workspaceSlug } = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  // store hooks
  const { unreadNotificationsCount, getUnreadNotificationsCount } = useWorkspaceNotifications();
  const { preferences } = useAppRailPreferences();

  const showLabel = preferences.displayMode === "icon_with_label";

  // Fetch notification count
  useSWR(
    workspaceSlug ? "WORKSPACE_UNREAD_NOTIFICATION_COUNT" : null,
    workspaceSlug ? () => getUnreadNotificationsCount(workspaceSlug.toString()) : null
  );

  const isOnNotifications = pathname?.includes(NOTIFICATIONS_PATH_SEGMENT) ?? false;

  // Remembers the last page visited outside Notifications/Inbox, so a second
  // click on the Inbox icon can return there in one step instead of just
  // sitting on the current page (clicking a Link to the same URL is a no-op).
  const lastNonNotificationsPathRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isOnNotifications && pathname) {
      const query = searchParams.toString();
      lastNonNotificationsPathRef.current = query ? `${pathname}?${query}` : pathname;
    }
  }, [pathname, searchParams, isOnNotifications]);

  const handleInboxClick = (e?: React.MouseEvent) => {
    if (!isOnNotifications) return;
    e?.preventDefault();
    router.push(lastNonNotificationsPathRef.current ?? `/${workspaceSlug?.toString()}/`);
  };

  // Calculate notification count
  const isMentionsEnabled = unreadNotificationsCount.mention_unread_notifications_count > 0;
  const totalNotifications = isMentionsEnabled
    ? unreadNotificationsCount.mention_unread_notifications_count
    : unreadNotificationsCount.total_unread_notifications_count;

  return (
    <div
      className={cn("z-[27] flex min-h-10 w-full items-center bg-canvas px-3.5 transition-all duration-300", {
        "px-2": !showLabel,
      })}
    >
      {/* Workspace Menu */}
      <div className="flex-1 shrink-0">
        <WorkspaceMenuRoot variant="top-navigation" />
      </div>
      {/* Power K Search */}
      <div className="shrink-0">
        <TopNavPowerK />
      </div>
      {/* Additional Actions */}
      <div className="flex flex-1 shrink-0 items-center justify-end gap-1">
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
              isActive: isOnNotifications,
              onClick: handleInboxClick,
            }}
          />
        </Tooltip>
        <HelpMenuRoot />
        <StarUsOnGitHubLink />
        <div className="flex size-8 items-center justify-center rounded-md hover:bg-layer-1-hover">
          <UserMenuRoot />
        </div>
      </div>
    </div>
  );
});
