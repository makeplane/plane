"use client";

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { DraftIcon, HomeIcon, InboxIcon, YourWorkIcon } from "@plane/propel/icons";
import { EUserWorkspaceRoles } from "@plane/types";
// hooks
import { useUserPermissions, useUser } from "@/hooks/store/user";
// local imports
import { SidebarUserMenuItem } from "./user-menu-item";

export const SidebarUserMenu = observer(() => {
  const { workspaceSlug } = useParams();
  const { workspaceUserInfo } = useUserPermissions();
  const { data: currentUser } = useUser();

  const SIDEBAR_USER_MENU_ITEMS = [
    {
      key: "home",
      labelTranslationKey: "sidebar.home",
      href: `/${workspaceSlug.toString()}/`,
      access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER, EUserWorkspaceRoles.GUEST],
      Icon: HomeIcon,
    },
    {
      key: "your-work",
      labelTranslationKey: "sidebar.your_work",
      href: `/${workspaceSlug.toString()}/profile/${currentUser?.id}/`,
      access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
      Icon: YourWorkIcon,
    },
    {
      key: "notifications",
      labelTranslationKey: "sidebar.inbox",
      href: `/${workspaceSlug.toString()}/notifications/`,
      access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER, EUserWorkspaceRoles.GUEST],
      Icon: InboxIcon,
    },
    {
      key: "drafts",
      labelTranslationKey: "sidebar.drafts",
      href: `/${workspaceSlug.toString()}/drafts/`,
      access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
      Icon: DraftIcon,
    },
  ];

  const draftIssueCount = workspaceUserInfo[workspaceSlug.toString()]?.draft_issue_count;

  return (
    <div className="flex flex-col gap-0.5">
      {SIDEBAR_USER_MENU_ITEMS.map((item) => (
        <SidebarUserMenuItem key={item.key} item={item} draftIssueCount={draftIssueCount} />
      ))}
    </div>
  );
});
