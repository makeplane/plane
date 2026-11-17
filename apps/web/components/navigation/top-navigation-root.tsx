/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// components
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import { TopNavPowerK } from "@/components/navigation";
import { HelpMenuRoot } from "@/components/workspace/sidebar/help-section/root";
import { UserMenuRoot } from "@/components/workspace/sidebar/user-menu-root";
import { WorkspaceMenuRoot } from "@/components/workspace/sidebar/workspace-menu-root";
import { useAppRailPreferences } from "@/hooks/use-navigation-preferences";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { IconButton } from "@makeplane/propel/elements/icon-button";
import { InboxOutline } from "@makeplane/propel/icons";
import useSWR from "swr";
import { useWorkspaceNotifications } from "@/hooks/store/notifications";
// local imports
import { StarUsOnGitHubLink } from "@/app/(all)/[workspaceSlug]/(projects)/star-us-link";

export const TopNavigationRoot = observer(function TopNavigationRoot() {
  const { t } = useTranslation();
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
      className={cn(
        "desktop-header z-27 flex min-h-10 w-full items-center gap-2 bg-canvas px-3.5 transition-all duration-300 md:gap-0",
        {
          "px-2": !showLabel,
        }
      )}
    >
      <div className="flex shrink-0 items-center gap-1.5 md:flex-1">
        {/* Workspace Menu */}
        <div className="shrink-0">
          <WorkspaceMenuRoot variant="top-navigation" />
        </div>
      </div>
      {/* Power K Search */}
      <div className="desktop-header-actions min-w-0 flex-1 md:flex-none">
        <TopNavPowerK />
      </div>
      {/* Additional Actions */}
      <div className="desktop-header-actions flex shrink-0 items-center justify-end gap-1 md:flex-1">
        <Tooltip label={t("sidebar.inbox")} side="bottom">
          <IconButton
            variant="ghost"
            size="md"
            aria-label={t("sidebar.inbox")}
            aria-current={pathname?.includes("/notifications/") ? "page" : undefined}
            render={
              <Link
                href={`/${workspaceSlug?.toString()}/notifications/`}
                className={
                  pathname?.includes("/notifications/") ? "bg-layer-transparent-selected !text-icon-primary" : undefined
                }
              />
            }
          >
            <span className="relative flex">
              <InboxOutline className="size-4.5" />
              {totalNotifications > 0 && (
                <span className="absolute top-0 right-0 size-2 rounded-full bg-danger-primary" />
              )}
            </span>
          </IconButton>
        </Tooltip>
        <HelpMenuRoot />
        <StarUsOnGitHubLink />
        <UserMenuRoot />
      </div>
    </div>
  );
});
