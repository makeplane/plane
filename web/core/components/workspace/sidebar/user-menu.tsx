"use client";

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Home, Inbox, PenSquare } from "lucide-react";
// plane imports
import { EUserWorkspaceRoles } from "@plane/constants";
import { UserActivityIcon } from "@plane/ui";
// components
import { SidebarUserMenuItem } from "@/components/workspace/sidebar";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useAppTheme, useUserPermissions, useUser } from "@/hooks/store";

export const sidebarUserMenuItems = (currentUserId: string) => [
  {
    key: "home",
    labelTranslationKey: "sidebar.home",
    href: "/",
    access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER, EUserWorkspaceRoles.GUEST],
    Icon: Home,
  },
  {
    key: "your-work",
    labelTranslationKey: "sidebar.your_work",
    href: `/profile/${currentUserId}/`,
    access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    Icon: UserActivityIcon,
  },
  {
    key: "notifications",
    labelTranslationKey: "sidebar.inbox",
    href: "/notifications/",
    access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER, EUserWorkspaceRoles.GUEST],
    Icon: Inbox,
  },
  {
    key: "drafts",
    labelTranslationKey: "sidebar.drafts",
    href: "/drafts/",
    access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    Icon: PenSquare,
  },
];

export const SidebarUserMenu = observer(() => {
  // navigation
  const { workspaceSlug } = useParams();
  // store hooks
  const { sidebarCollapsed } = useAppTheme();
  const { workspaceUserInfo } = useUserPermissions();
  const { data: currentUser } = useUser();
  // derived values
  const SIDEBAR_USER_MENU_ITEMS = sidebarUserMenuItems(currentUser?.id ?? "");
  const draftIssueCount = workspaceUserInfo[workspaceSlug.toString()]?.draft_issue_count;

  return (
    <div
      className={cn("flex flex-col gap-0.5", {
        "space-y-0": sidebarCollapsed,
      })}
    >
      {SIDEBAR_USER_MENU_ITEMS.map((item) => (
        <SidebarUserMenuItem key={item.key} item={item} draftIssueCount={draftIssueCount} />
      ))}
    </div>
  );
});
